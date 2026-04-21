import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { EditorView } from '@codemirror/view'
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
import { K6Editor } from './K6Editor'

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

  const k6EditorViewRef = useRef<EditorView | null>(null)
  const k6HasFocusedRef = useRef(false)
  const [copiedService, setCopiedService] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending badge timer on unmount to avoid state updates after navigation.
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const showCopiedBadge = useCallback((serviceName: string) => {
    setCopiedService(serviceName)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopiedService(null), 2000)
  }, [])

  const insertAtCursor = useCallback((serviceName: string) => {
    const view = k6EditorViewRef.current
    if (!view) return
    view.focus()
    const selection = view.state.selection.main
    const nextPosition = selection.from + serviceName.length
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: serviceName },
      selection: { anchor: nextPosition, head: nextPosition },
      scrollIntoView: true,
    })
  }, [])

  const handleInsertService = useCallback(
    (serviceName: string) => {
      if (!k6HasFocusedRef.current) {
        navigator.clipboard.writeText(serviceName).then(
          () => showCopiedBadge(serviceName),
          () => {
            // Clipboard unavailable - fall back to inserting at position 0.
            k6HasFocusedRef.current = true
            const view = k6EditorViewRef.current
            if (!view) return
            view.dispatch({ selection: { anchor: 0, head: 0 } })
            insertAtCursor(serviceName)
          },
        )
        return
      }
      insertAtCursor(serviceName)
    },
    [insertAtCursor, showCopiedBadge],
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

  const handleK6InstructionsChange = useCallback((nextValue: string) => {
    setValues((prev) => ({ ...prev, k6Instructions: nextValue }))
    setErrors((prev) => ({ ...prev, k6Instructions: undefined }))
    setSubmitError(null)
  }, [])

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
              <K6Editor
                id="benchmark-k6-instructions"
                value={values.k6Instructions}
                onChange={handleK6InstructionsChange}
                onFocusChange={(hasFocus) => {
                  if (hasFocus) k6HasFocusedRef.current = true
                }}
                onEditorReady={(view) => {
                  k6EditorViewRef.current = view
                }}
                disabled={isSubmitting}
                hasError={Boolean(errors.k6Instructions)}
                ariaDescribedBy={
                  errors.k6Instructions ? 'benchmark-k6-instructions-error' : undefined
                }
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
              <p className="benchmark-k6-help-link">
                Need help writing K6 scripts?{' '}
                <a
                  href="https://grafana.com/docs/k6/latest/using-k6/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the K6 documentation
                </a>
                .
              </p>
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
