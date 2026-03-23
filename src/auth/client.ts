import { AgentApi } from '../generated/openapi/apis/AgentApi'
import { AuthApi } from '../generated/openapi/apis/AuthApi'
import { BenchmarkActionsApi } from '../generated/openapi/apis/BenchmarkActionsApi'
import { BenchmarkApi } from '../generated/openapi/apis/BenchmarkApi'
import { BenchmarkRunsApi } from '../generated/openapi/apis/BenchmarkRunsApi'
import { EnvironmentApi } from '../generated/openapi/apis/EnvironmentApi'
import { Configuration } from '../generated/openapi/runtime'
import type { Middleware } from '../generated/openapi/runtime'
import { clearAuthSession, loadAuthSession } from './storage'
import { getApiBaseUrl } from '../config/api'

type ApiConstructor<TApi> = new (configuration?: Configuration) => TApi

function createAuthMiddleware(): Middleware {
  return {
    pre: async ({ url, init }) => {
      const session = loadAuthSession()
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

