import { ResponseError } from '../../generated/openapi/runtime'
import type { BenchmarkDTO } from '../../generated/openapi/models/BenchmarkDTO'
import type { EnvironmentRunSummaryDTO } from '../../generated/openapi/models/EnvironmentRunSummaryDTO'
import { createBenchmarkApi, createBenchmarkRunsApi } from '../../auth/client'

export class BenchmarksLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BenchmarksLoadError'
  }
}

export class BenchmarkRunsLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BenchmarkRunsLoadError'
  }
}

function readLoadErrorMessage(error: ResponseError, subject: string): string {
  if (error.response.status === 404) {
    return `${subject} endpoint was not found.`
  }

  if (error.response.status >= 500) {
    return `Server error while loading ${subject}.`
  }

  return `Unable to load ${subject} right now.`
}

export async function listBenchmarks(
  environmentId: string,
): Promise<Array<BenchmarkDTO>> {
  const benchmarkApi = createBenchmarkApi()

  try {
    return await benchmarkApi.listBenchmarks({ environmentId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new BenchmarksLoadError(readLoadErrorMessage(error, 'benchmarks'))
    }

    throw new BenchmarksLoadError(
      'Network error while loading benchmarks. Please try again.',
    )
  }
}

const ACTIVE_STATUS_SET = new Set(['PENDING_START', 'STARTED', 'PENDING_STOP'])

export async function listActiveEnvironmentRuns(
  environmentId: string,
): Promise<Array<EnvironmentRunSummaryDTO>> {
  const runsApi = createBenchmarkRunsApi()

  try {
    const response = await runsApi.listEnvironmentRuns({
      environmentId,
      page: 0,
      size: 50,
      sort: ['startedAt,desc'],
    })

    const runs = response.runs ?? []
    return runs.filter(
      (run) => run.status != null && ACTIVE_STATUS_SET.has(run.status),
    )
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new BenchmarkRunsLoadError(
        readLoadErrorMessage(error, 'environment runs'),
      )
    }

    throw new BenchmarkRunsLoadError(
      'Network error while loading environment runs. Please try again.',
    )
  }
}
