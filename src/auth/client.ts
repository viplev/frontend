import { AgentApi } from '../generated/openapi/apis/AgentApi'
import { AuthApi } from '../generated/openapi/apis/AuthApi'
import { BenchmarkActionsApi } from '../generated/openapi/apis/BenchmarkActionsApi'
import { BenchmarkApi } from '../generated/openapi/apis/BenchmarkApi'
import { BenchmarkRunsApi } from '../generated/openapi/apis/BenchmarkRunsApi'
import { EnvironmentApi } from '../generated/openapi/apis/EnvironmentApi'
import { Configuration } from '../generated/openapi/runtime'
import type { Middleware } from '../generated/openapi/runtime'
import { loadAuthSession } from './storage'
import { getApiBaseUrl } from '../config/api'
import { publishAuthFailure } from './failure'
import { performLogoutTeardown } from './logout'

type ApiConstructor<TApi> = new (configuration?: Configuration) => TApi

function createAuthMiddleware(): Middleware {
  return {
    pre: async ({ url, init }) => {
      const session = loadAuthSession()
      const headers = new Headers(init.headers)
      if (session?.token) {
        headers.set('Authorization', `Bearer ${session.token}`)
      } else {
        const hasStaleAuthorization = headers.has('Authorization')
        if (hasStaleAuthorization) {
          performLogoutTeardown()
          publishAuthFailure('unauthorized')
          headers.delete('Authorization')
        }
      }

      return {
        url,
        init: {
          ...init,
          headers,
        },
      }
    },
    post: async ({ response, init }) => {
      if (response.status === 401 || response.status === 403) {
        const hadAuthenticatedRequest = new Headers(init.headers).has(
          'Authorization',
        )
        if (hadAuthenticatedRequest) {
          performLogoutTeardown()
          publishAuthFailure(response.status === 403 ? 'forbidden' : 'unauthorized')
        }
      }

      return response
    },
  }
}

export function createApiConfiguration(): Configuration {
  return new Configuration({
    basePath: getApiBaseUrl(),
    middleware: [createAuthMiddleware()],
  })
}

export function createApiClient<TApi>(ApiClass: ApiConstructor<TApi>): TApi {
  return new ApiClass(createApiConfiguration())
}

export function createAuthApi(): AuthApi {
  return createApiClient(AuthApi)
}

export function createEnvironmentApi(): EnvironmentApi {
  return createApiClient(EnvironmentApi)
}

export function createBenchmarkApi(): BenchmarkApi {
  return createApiClient(BenchmarkApi)
}

export function createBenchmarkActionsApi(): BenchmarkActionsApi {
  return createApiClient(BenchmarkActionsApi)
}

export function createBenchmarkRunsApi(): BenchmarkRunsApi {
  return createApiClient(BenchmarkRunsApi)
}

export function createAgentApi(): AgentApi {
  return createApiClient(AgentApi)
}

