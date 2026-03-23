import { AuthApi } from '../generated/openapi/apis/AuthApi'
import { ResponseError } from '../generated/openapi/runtime'
import type { LoginCredentials, AuthSession } from './types'
import { createApiConfiguration } from './client'

export class LoginError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LoginError'
  }
}

export async function loginWithCredentials(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  const authApi = new AuthApi(createApiConfiguration(null))

  try {
    const response = await authApi.login({ loginDTO: credentials })
    if (!response.token) {
      throw new LoginError('Login succeeded but no token was returned.')
    }

    return {
      token: response.token,
      email: credentials.email,
      userId: response.userId,
    }
  } catch (error: unknown) {
    if (error instanceof LoginError) {
      throw error
    }

    if (error instanceof ResponseError) {
      if (error.response.status === 400 || error.response.status === 401) {
        throw new LoginError('Invalid email or password.')
      }

      throw new LoginError('Unable to sign in right now. Please try again.')
    }

    throw new LoginError('Network error while signing in. Please try again.')
  }
}

