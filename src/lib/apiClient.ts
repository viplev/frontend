import { Configuration } from '../generated/openapi/runtime';
import {
  AuthApi,
  BenchmarkApi,
  BenchmarkActionsApi,
  BenchmarkRunsApi,
  EnvironmentApi,
} from '../generated/openapi/apis';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

function getConfiguration() {
  const basePath =
    import.meta.env.VITE_API_BASE_URL ?? 'https://api.viblev.ringhus.dk';
  return new Configuration({
    basePath,
    accessToken: authToken ? () => Promise.resolve(authToken!) : undefined,
    middleware: [
      {
        post: async (context) => {
          if (
            (context.response.status === 401 || context.response.status === 403) &&
            onUnauthorized
          ) {
            onUnauthorized();
          }
          return context.response;
        },
      },
    ],
  });
}

export function getAuthApi() {
  return new AuthApi(getConfiguration());
}

export function getEnvironmentApi() {
  return new EnvironmentApi(getConfiguration());
}

export function getBenchmarkApi() {
  return new BenchmarkApi(getConfiguration());
}

export function getBenchmarkActionsApi() {
  return new BenchmarkActionsApi(getConfiguration());
}

export function getBenchmarkRunsApi() {
  return new BenchmarkRunsApi(getConfiguration());
}
