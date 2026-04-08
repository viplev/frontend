import { ResponseError } from '../../../../generated/openapi/runtime'
import type { BenchmarkDomainErrorMetadata } from '../errors'

export function toResponseErrorMetadata(
  error: ResponseError,
): BenchmarkDomainErrorMetadata {
  const statusCode = error.response.status
  if (statusCode === 400) {
    return { kind: 'validation', statusCode, cause: error }
  }
  if (statusCode === 404) {
    return { kind: 'not_found', statusCode, cause: error }
  }
  if (statusCode === 409) {
    return { kind: 'conflict', statusCode, cause: error }
  }
  if (statusCode >= 500) {
    return { kind: 'server', statusCode, cause: error }
  }

  return { kind: 'unknown', statusCode, cause: error }
}

export function readLoadErrorMessage(error: ResponseError, subject: string): string {
  if (error.response.status === 404) {
    return `${subject} endpoint was not found.`
  }

  if (error.response.status >= 500) {
    return `Server error while loading ${subject}.`
  }

  return `Unable to load ${subject} right now.`
}

export function readMutationErrorMessage(
  error: ResponseError,
  action: 'create' | 'get' | 'update',
): string {
  if ((action === 'create' || action === 'update') && error.response.status === 400) {
    return 'There was a problem with your benchmark data. Please review the form and try again.'
  }

  if (error.response.status === 404) {
    return action === 'get'
      ? 'Benchmark was not found.'
      : 'Benchmark target was not found.'
  }

  const actionLabel =
    action === 'create' ? 'create' : action === 'update' ? 'update' : 'load'
  if (error.response.status >= 500) {
    return `Server error while trying to ${actionLabel} benchmark.`
  }

  return `Unable to ${actionLabel} benchmark right now.`
}

