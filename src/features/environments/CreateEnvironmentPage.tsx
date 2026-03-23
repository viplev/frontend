import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EnvironmentDTOTypeEnum } from '../../generated/openapi/models/EnvironmentDTO'
import { createEnvironment, CreateEnvironmentError } from './service'

interface FormValues {
  name: string
  description: string
  type: EnvironmentDTOTypeEnum
}

interface FormErrors {
  name?: string
  description?: string
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Environment name is required.'
  } else if (values.name.trim().length < 3) {
    errors.name = 'Environment name must be at least 3 characters.'
  }

  if (values.description.trim().length > 500) {
    errors.description = 'Description must be 500 characters or fewer.'
  }

  return errors
}

export function CreateEnvironmentPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<FormValues>({
    name: '',
    description: '',
    type: 'docker',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange =
    (key: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const nextValue = event.target.value
      setValues((prev) => ({ ...prev, [key]: nextValue }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
      setSubmitError(null)
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validate(values)
    setErrors(validation)
    setSubmitError(null)

    if (Object.keys(validation).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createEnvironment({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        type: values.type,
      })

      navigate('/environments', {
        replace: true,
        state: {
          createdEnvironment: {
            name: created.name,
            token: created.token ?? null,
            agentCommand: created.agentCommand ?? null,
          },
        },
      })
    } catch (error: unknown) {
      if (error instanceof CreateEnvironmentError) {
        setSubmitError(error.message)
      } else {
        setSubmitError('Unable to create environment right now.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="shell-page">
      <h1>Create environment</h1>
      <p className="auth-text">
        Create a new environment to onboard an agent and start benchmarking.
      </p>

      <form className="environment-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-label" htmlFor="environment-name">
          Name
        </label>
        <input
          id="environment-name"
          className="auth-input"
          value={values.name}
          onChange={handleChange('name')}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'environment-name-error' : undefined}
          disabled={isSubmitting}
        />
        {errors.name ? (
          <p id="environment-name-error" className="environment-field-error" role="alert">
            {errors.name}
          </p>
        ) : null}

        <label className="auth-label" htmlFor="environment-type">
          Platform
        </label>
        <select
          id="environment-type"
          className="auth-input"
          value={values.type}
          onChange={handleChange('type')}
          disabled={isSubmitting}
        >
          <option value="docker">Docker</option>
          <option value="kubernetes">Kubernetes</option>
        </select>

        <label className="auth-label" htmlFor="environment-description">
          Description (optional)
        </label>
        <textarea
          id="environment-description"
          className="auth-input environment-textarea"
          value={values.description}
          onChange={handleChange('description')}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? 'environment-description-error' : undefined
          }
          disabled={isSubmitting}
          rows={4}
        />
        {errors.description ? (
          <p
            id="environment-description-error"
            className="environment-field-error"
            role="alert"
          >
            {errors.description}
          </p>
        ) : null}

        {submitError ? (
          <p className="auth-notice auth-notice-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="environment-form-actions">
          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create environment'}
          </button>
          <button
            type="button"
            className="shell-alert-dismiss"
            onClick={() => navigate('/environments')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </article>
  )
}

