import { ResponseError } from '../../generated/openapi/runtime'
import type { EnvironmentDTO } from '../../generated/openapi/models/EnvironmentDTO'
import { createEnvironmentApi } from '../../auth/client'

export class EnvironmentsLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentsLoadError'
  }
}

async function readErrorMessage(error: ResponseError): Promise<string> {
  if (error.response.status === 404) {
    return 'Environments endpoint was not found.'
  }

  if (error.response.status >= 500) {
    return 'Server error while loading environments.'
  }

  return 'Unable to load environments right now.'
}

export async function listEnvironments(): Promise<Array<EnvironmentDTO>> {
  const environmentApi = createEnvironmentApi()

  try {
    return await environmentApi.listEnvironments()
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      const message = await readErrorMessage(error)
      throw new EnvironmentsLoadError(message)
    }

    throw new EnvironmentsLoadError(
      'Network error while loading environments. Please try again.',
    )
  }
}

