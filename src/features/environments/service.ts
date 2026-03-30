import { ResponseError } from '../../generated/openapi/runtime'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import type { ServiceDTO } from '../../generated/openapi/models/ServiceDTO'
import { createEnvironmentApi } from '../../auth/client'

export class EnvironmentsLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentsLoadError'
  }
}

export class CreateEnvironmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CreateEnvironmentError'
  }
}

export class EnvironmentDetailsError extends Error {
  notFound: boolean

  constructor(message: string, notFound = false) {
    super(message)
    this.name = 'EnvironmentDetailsError'
    this.notFound = notFound
  }
}

function readErrorMessage(
  error: ResponseError,
  action: 'load' | 'create' | 'load-details',
  subject?: string,
): string {
  if (action === 'create' && error.response.status === 400) {
    return 'There was a problem with your request. Please review the form and try again.'
  }

  if (error.response.status === 404) {
    return `${subject ?? 'Resource'} endpoint was not found.`
  }

  if (error.response.status >= 500) {
    if (action === 'load') {
      return `Server error while loading ${subject ?? 'data'}.`
    } else if (action === 'load-details') {
      return `Server error while loading ${subject ?? 'details'}.`
    } else {
      return `Server error while creating ${subject ?? 'resource'}.`
    }
  }

  if (action === 'load') {
    return `Unable to load ${subject ?? 'data'} right now.`
  } else if (action === 'load-details') {
    return `Unable to load ${subject ?? 'details'} right now.`
  } else {
    return `Unable to create ${subject ?? 'resource'} right now.`
  }
}

export async function listEnvironments(): Promise<Array<EnvironmentDTO>> {
  const environmentApi = createEnvironmentApi()

  try {
    return await environmentApi.listEnvironments()
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      const message = readErrorMessage(error, 'load', 'environments')
      throw new EnvironmentsLoadError(message)
    }

    throw new EnvironmentsLoadError(
      'Network error while loading environments. Please try again.',
    )
  }
}

type CreateEnvironmentInput = Pick<EnvironmentDTO, 'name' | 'description' | 'type'>

export async function createEnvironment(
  input: CreateEnvironmentInput,
): Promise<EnvironmentDTO> {
  const environmentApi = createEnvironmentApi()

  try {
    return await environmentApi.createEnvironment({ environmentDTO: input })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new CreateEnvironmentError(
        readErrorMessage(error, 'create', 'environment'),
      )
    }

    throw new CreateEnvironmentError(
      'Network error while creating environment. Please try again.',
    )
  }
}

export async function getEnvironmentDetails(
  environmentId: string,
  signal?: AbortSignal,
): Promise<EnvironmentDTO> {
  const environmentApi = createEnvironmentApi()

  try {
    return await environmentApi.getEnvironment({ environmentId }, { signal })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 404) {
        throw new EnvironmentDetailsError('Environment not found.', true)
      }

      throw new EnvironmentDetailsError(
        readErrorMessage(error, 'load-details', 'environment details'),
      )
    }

    throw new EnvironmentDetailsError(
      'Network error while loading environment details. Please try again.',
    )
  }
}

export async function getEnvironmentServices(
  environmentId: string,
): Promise<Array<ServiceDTO>> {
  const environmentApi = createEnvironmentApi()

  try {
    return await environmentApi.listServices({ environmentId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 404) {
        throw new EnvironmentDetailsError('Environment not found.', true)
      }

      throw new EnvironmentDetailsError('Unable to load services right now.')
    }

    throw new EnvironmentDetailsError(
      'Network error while loading services. Please try again.',
    )
  }
}

