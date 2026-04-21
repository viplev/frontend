import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AsyncStateView } from '../ui/async-state/AsyncState'
import {
  createBenchmark,
  CreateBenchmarkError,
  getBenchmark,
  GetBenchmarkError,
  listActiveEnvironmentRuns,
  updateBenchmark,
  UpdateBenchmarkError,
} from './service'
import { ServicePickerPanel } from './ServicePickerPanel'

interface BenchmarkFormValues {
  name: string
  description: string
  k6Instructions: string
}

interface BenchmarkFormErrors {
  name?: string
  description?: string
  k6Instructions?: string
}

function validate(values: BenchmarkFormValues): BenchmarkFormErrors {
  const errors: BenchmarkFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Benchmark name is required.'
  } else if (values.name.trim().length < 3) {
    errors.name = 'Benchmark name must be at least 3 characters.'
  }

  if (values.description.trim().length > 500) {
    errors.description = 'Description must be 500 characters or fewer.'
  }

  if (!values.k6Instructions.trim()) {
    errors.k6Instructions = 'K6 instructions are required.'
  } else if (values.k6Instructions.trim().length < 10) {
    errors.k6Instructions = 'K6 instructions must be at least 10 characters.'
  }

  return errors
}

export function BenchmarkFormPage() {
  const { environmentId = '', benchmarkId } = useParams<{
    environmentId: string
    benchmarkId?: string
  }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(benchmarkId)

  const [values, setValues] = useState<BenchmarkFormValues>({
    name: '',
    description: '',
    k6Instructions: '',
  })
  const [errors, setErrors] = useState<BenchmarkFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)

  // K6 textarea cursor tracking for service picker insertion
  const k6TextareaRef = useRef<HTMLTextAreaElement>(null)
  const k6SelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 })
  const k6HasFocusedRef = useRef(false)
  const [copiedService, setCopiedService] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleInsertService = useCallback(
    (serviceName: string) => {
      if (!k6HasFocusedRef.current) {
        void navigator.clipboard.writeText(serviceName).then(() => {
          setCopiedService(serviceName)
          if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
          copiedTimerRef.current = setTimeout(() => setCopiedService(null), 2000)
        })
        return
      }
      const { start, end } = k6SelectionRef.current
      setValues((prev) => {
        const next =
          prev.k6Instructions.slice(0, start) +
          serviceName +
          prev.k6Instructions.slice(end)
        return { ...prev, k6Instructions: next }
      })
      setErrors((prev) => ({ ...prev, k6Instructions: undefined }))
      setSubmitError(null)
      const newCursor = start + serviceName.length
      k6SelectionRef.current = { start: newCursor, end: newCursor }
      setTimeout(() => {
        k6TextareaRef.current?.focus()
        k6TextareaRef.current?.setSelectionRange(newCursor, newCursor)
      }, 0)
    },
    [],
  )

  useEffect(() => {
    if (!isEditMode || !benchmarkId) {
      return
    }

    let isActive = true

    const loadBenchmark = async () => {
      if (!environmentId.trim()) {
        setLoadError('Environment ID is missing or invalid.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const [benchmarkResult, activeRunsResult] = await Promise.allSettled([
          getBenchmark(environmentId, benchmarkId),
          listActiveEnvironmentRuns(environmentId),
        ])
        if (!isActive) {
          return
        }

        if (benchmarkResult.status === 'rejected') {
          const error = benchmarkResult.reason
          if (error instanceof GetBenchmarkError) {
            setLoadError(error.message)
          } else {
            setLoadError('Unable to load benchmark details right now.')
          }
          return
        }

        const benchmark = benchmarkResult.value
        if (activeRunsResult.status === 'rejected') {
          setLoadError(
            'Unable to verify whether this benchmark is running. Please try again.',
          )
          return
        }

        const activeRuns = activeRunsResult.value
        const hasActiveRun = activeRuns.some((run) => run.benchmarkId === benchmarkId)
        if (hasActiveRun) {
          setLoadError('This benchmark is currently running and cannot be edited.')
          return
        }

        setValues({
          name: benchmark.name ?? '',
          description: benchmark.description ?? '',
          k6Instructions: benchmark.k6Instructions ?? '',
        })
      } catch (error: unknown) {
        if (!isActive) {
          return
        }

        if (error instanceof GetBenchmarkError) {
          setLoadError(error.message)
        } else {
          setLoadError('Unable to load benchmark details right now.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadBenchmark()

    return () => {
      isActive = false
    }
  }, [benchmarkId, environmentId, isEditMode, retryAttempt])

  const handleChange =
    (key: keyof BenchmarkFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value
      setValues((prev) => ({ ...prev, [key]: nextValue }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
      setSubmitError(null)
    }

  const heading = useMemo(
    () => (isEditMode ? 'Edit benchmark' : 'Create benchmark'),
    [isEditMode],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!environmentId.trim()) {
      setSubmitError('Environment ID is missing or invalid.')
      return
    }

    const validation = validate(values)
    setErrors(validation)
    setSubmitError(null)

      if (Object.keys(validation).length > 0) {
        return
      }

      if (isEditMode && benchmarkId) {
        try {
          const activeRuns = await listActiveEnvironmentRuns(environmentId)
          const hasActiveRun = activeRuns.some((run) => run.benchmarkId === benchmarkId)
          if (hasActiveRun) {
            setSubmitError('This benchmark is currently running and cannot be edited.')
            return
          }
        } catch {
          setSubmitError(
            'Unable to verify benchmark run status right now. Please try again.',
          )
          return
        }
      }

      setIsSubmitting(true)

    try {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        k6Instructions: values.k6Instructions.trim(),
      }

      const saved =
        isEditMode && benchmarkId
          ? await updateBenchmark(environmentId, benchmarkId, payload)
          : await createBenchmark(environmentId, payload)

      navigate(`/environments/${environmentId}`, {
        replace: true,
        state: {
          benchmarkNotice: {
            type: isEditMode ? 'updated' : 'created',
            name: saved.name,
          },
        },
      })
    } catch (error: unknown) {
      if (error instanceof CreateBenchmarkError || error instanceof UpdateBenchmarkError) {
        setSubmitError(error.message)
      } else {
        setSubmitError(
          isEditMode
            ? 'Unable to update benchmark right now.'
            : 'Unable to create benchmark right now.',
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="shell-page">
      <h1>{heading}</h1>
      <p className="auth-text">
        {isEditMode
          ? 'Update benchmark metadata and K6 instructions.'
          : 'Create a benchmark to define your load-testing scenario.'}
      </p>

      <AsyncStateView
        isLoading={isLoading}
        error={loadError}
        isEmpty={false}
        onRetry={() => {
          if (isEditMode) {
            setRetryAttempt((current) => current + 1)
          }
        }}
        loadingTitle="Loading benchmark"
      >
        <form className="benchmark-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="benchmark-name">
            Name
          </label>
          <input
            id="benchmark-name"
            className="auth-input"
            value={values.name}
            onChange={handleChange('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'benchmark-name-error' : undefined}
            disabled={isSubmitting}
          />
          {errors.name ? (
            <p id="benchmark-name-error" className="benchmark-field-error" role="alert">
              {errors.name}
            </p>
          ) : null}

          <label className="auth-label" htmlFor="benchmark-description">
            Description (optional)
          </label>
          <textarea
            id="benchmark-description"
            className="auth-input benchmark-textarea"
            value={values.description}
            onChange={handleChange('description')}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'benchmark-description-error' : undefined}
            disabled={isSubmitting}
            rows={4}
          />
          {errors.description ? (
            <p id="benchmark-description-error" className="benchmark-field-error" role="alert">
              {errors.description}
            </p>
          ) : null}

          <div className="benchmark-k6-section">
            <div className="benchmark-k6-field">
              <label className="auth-label" htmlFor="benchmark-k6-instructions">
                K6 instructions
              </label>
              <textarea
                id="benchmark-k6-instructions"
                ref={k6TextareaRef}
                className="auth-input benchmark-textarea"
                value={values.k6Instructions}
                onChange={handleChange('k6Instructions')}
                onFocus={() => {
                  k6HasFocusedRef.current = true
                }}
                onSelect={(e) => {
                  const t = e.currentTarget
                  k6SelectionRef.current = { start: t.selectionStart, end: t.selectionEnd }
                }}
                onKeyUp={(e) => {
                  const t = e.currentTarget
                  k6SelectionRef.current = { start: t.selectionStart, end: t.selectionEnd }
                }}
                aria-invalid={Boolean(errors.k6Instructions)}
                aria-describedby={
                  errors.k6Instructions ? 'benchmark-k6-instructions-error' : undefined
                }
                disabled={isSubmitting}
                rows={8}
              />
              {errors.k6Instructions ? (
                <p
                  id="benchmark-k6-instructions-error"
                  className="benchmark-field-error"
                  role="alert"
                >
                  {errors.k6Instructions}
                </p>
              ) : null}
            </div>
            <ServicePickerPanel
              environmentId={environmentId}
              onServiceClick={handleInsertService}
              copiedService={copiedService}
            />
          </div>

          {submitError ? (
            <p className="auth-notice auth-notice-error" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="benchmark-form-actions">
            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save benchmark'
                  : 'Create benchmark'}
            </button>
            <button
              type="button"
              className="shell-alert-dismiss"
              onClick={() => navigate(`/environments/${environmentId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </AsyncStateView>
    </article>
  )
}
