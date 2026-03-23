import { Configuration } from '../generated/openapi/runtime'
import type { Middleware } from '../generated/openapi/runtime'
import { clearAuthSession } from './storage'
import { getApiBaseUrl } from '../config/api'
import type { AuthSession } from './types'

function createAuthMiddleware(session: AuthSession | null): Middleware {
  return {
    pre: async ({ url, init }) => {
      const headers = new Headers(init.headers)
      if (session?.token) {
        headers.set('Authorization', `Bearer ${session.token}`)
      }

      return {
        url,
        init: {
          ...init,
          headers,
        },
      }
    },
    post: async ({ response }) => {
      if (response.status === 401) {
        clearAuthSession()
      }

      return response
    },
  }
}

export function createApiConfiguration(session: AuthSession | null): Configuration {
  return new Configuration({
    basePath: getApiBaseUrl(),
    middleware: [createAuthMiddleware(session)],
  })
}

