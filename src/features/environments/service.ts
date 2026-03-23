import { ResponseError } from '../../generated/openapi/runtime'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
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

function readErrorMessage(
  error: ResponseError,
  action: 'load' | 'create',
): string {
  if (action === 'create' && error.response.status === 400) {
    return 'Please fix the highlighted fields and try again.'
  }

  if (error.response.status === 404) {
    return 'Environments endpoint was not found.'
  }

  if (error.response.status >= 500) {
    return `Server error while ${action === 'load' ? 'loading' : 'creating'} environment.`
  }

  return `Unable to ${action === 'load' ? 'load environments' : 'create environment'} right now.`
}

export async function listEnvironments(): Promise<Array<EnvironmentDTO>> {
  const environmentApi = createEnvironmentApi()

  try {
    return await environmentApi.listEnvironments()
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      const message = readErrorMessage(error, 'load')
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
      throw new CreateEnvironmentError(readErrorMessage(error, 'create'))
    }

    throw new CreateEnvironmentError(
      'Network error while creating environment. Please try again.',
    )
  }
}

