import { ResponseError } from '../../generated/openapi/runtime'
import type { BenchmarkDTO } from '../../generated/openapi/models/BenchmarkDTO'
import type { BenchmarkRunDerivedDTO } from '../../generated/openapi/models/BenchmarkRunDerivedDTO'
import type { BenchmarkStatusDTO } from '../../generated/openapi/models/BenchmarkStatusDTO'
import {
  EnvironmentRunSummaryDTOStatusEnum,
  type EnvironmentRunSummaryDTO,
} from '../../generated/openapi/models/EnvironmentRunSummaryDTO'
import {
  createBenchmarkActionsApi,
  createBenchmarkApi,
  createBenchmarkRunsApi,
} from '../../auth/client'

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

export class CreateBenchmarkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CreateBenchmarkError'
  }
}

export class GetBenchmarkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GetBenchmarkError'
  }
}

export class UpdateBenchmarkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UpdateBenchmarkError'
  }
}

export class StartBenchmarkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StartBenchmarkError'
  }
}

export class BenchmarkRunDetailsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BenchmarkRunDetailsError'
  }
}

async function findEnvironmentRunSummary(
  environmentId: string,
  runId: string,
): Promise<EnvironmentRunSummaryDTO | null> {
  const runsApi = createBenchmarkRunsApi()
  const size = 100
  let page = 0

  while (page < 20) {
    const response = await runsApi.listEnvironmentRuns({
      environmentId,
      page,
      size,
      sort: 'startedAt,desc',
    })

    const match = (response.runs ?? []).find((run) => run.runId === runId)
    if (match) {
      return match
    }

    const totalPages = response.pagination?.totalPages ?? 0
    page += 1
    if (totalPages === 0 || page >= totalPages) {
      break
    }
  }

  return null
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

function readMutationErrorMessage(
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

type BenchmarkMutationInput = Pick<
  BenchmarkDTO,
  'name' | 'description' | 'k6Instructions'
>

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

export async function createBenchmark(
  environmentId: string,
  input: BenchmarkMutationInput,
): Promise<BenchmarkDTO> {
  const benchmarkApi = createBenchmarkApi()

  try {
    return await benchmarkApi.createBenchmark({ environmentId, benchmarkDTO: input })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new CreateBenchmarkError(readMutationErrorMessage(error, 'create'))
    }

    throw new CreateBenchmarkError(
      'Network error while creating benchmark. Please try again.',
    )
  }
}

export async function getBenchmark(
  environmentId: string,
  benchmarkId: string,
): Promise<BenchmarkDTO> {
  const benchmarkApi = createBenchmarkApi()

  try {
    return await benchmarkApi.getBenchmark({ environmentId, benchmarkId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new GetBenchmarkError(readMutationErrorMessage(error, 'get'))
    }

    throw new GetBenchmarkError(
      'Network error while loading benchmark details. Please try again.',
    )
  }
}

export async function updateBenchmark(
  environmentId: string,
  benchmarkId: string,
  input: BenchmarkMutationInput,
): Promise<BenchmarkDTO> {
  const benchmarkApi = createBenchmarkApi()

  try {
    return await benchmarkApi.updateBenchmark({
      environmentId,
      benchmarkId,
      benchmarkDTO: input,
    })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new UpdateBenchmarkError(readMutationErrorMessage(error, 'update'))
    }

    throw new UpdateBenchmarkError(
      'Network error while updating benchmark. Please try again.',
    )
  }
}

export async function startBenchmark(
  environmentId: string,
  benchmarkId: string,
): Promise<BenchmarkStatusDTO> {
  const benchmarkActionsApi = createBenchmarkActionsApi()

  try {
    return await benchmarkActionsApi.startBenchmark({ environmentId, benchmarkId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 400) {
        throw new StartBenchmarkError(
          'Benchmark could not be started with the current configuration.',
        )
      }
      if (error.response.status === 404) {
        throw new StartBenchmarkError('Benchmark was not found.')
      }
      if (error.response.status === 409) {
        throw new StartBenchmarkError(
          'This benchmark already has an active run in this environment.',
        )
      }
      if (error.response.status >= 500) {
        throw new StartBenchmarkError('Server error while trying to start benchmark.')
      }

      throw new StartBenchmarkError('Unable to start benchmark right now.')
    }

    throw new StartBenchmarkError(
      'Network error while starting benchmark. Please try again.',
    )
  }
}

export async function getBenchmarkRunDetails(
  environmentId: string,
  benchmarkId: string,
  runId: string,
): Promise<BenchmarkRunDerivedDTO> {
  const runsApi = createBenchmarkRunsApi()

  try {
    return await runsApi.getBenchmarkRun({ environmentId, benchmarkId, runId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 404) {
        throw new BenchmarkRunDetailsError('Benchmark run was not found.')
      }

      try {
        const summary = await findEnvironmentRunSummary(environmentId, runId)
        if (summary) {
          return {
            run: {
              id: summary.runId,
              status: summary.status,
              startedAt: summary.startedAt,
              finishedAt: summary.finishedAt,
            },
          }
        }
      } catch {
        // Keep original API error handling below if fallback lookup also fails.
      }

      throw new BenchmarkRunDetailsError(
        readLoadErrorMessage(error, 'benchmark run details'),
      )
    }

    try {
      const summary = await findEnvironmentRunSummary(environmentId, runId)
      if (summary) {
        return {
          run: {
            id: summary.runId,
            status: summary.status,
            startedAt: summary.startedAt,
            finishedAt: summary.finishedAt,
          },
        }
      }
    } catch {
      // Keep original network error below if fallback lookup also fails.
    }

    throw new BenchmarkRunDetailsError(
      'Network error while loading benchmark run details. Please try again.',
    )
  }
}

const ACTIVE_STATUS_SET = new Set([
  EnvironmentRunSummaryDTOStatusEnum.PendingStart,
  EnvironmentRunSummaryDTOStatusEnum.Started,
  EnvironmentRunSummaryDTOStatusEnum.PendingStop,
])

export async function listActiveEnvironmentRuns(
  environmentId: string,
): Promise<Array<EnvironmentRunSummaryDTO>> {
  const runsApi = createBenchmarkRunsApi()

  try {
    const response = await runsApi.listEnvironmentRuns({
      environmentId,
      page: 0,
      size: 50,
      sort: 'startedAt,desc',
    })

    const runs = response.runs ?? []
    return runs.filter(
      (run) =>
        run.status != null &&
        ACTIVE_STATUS_SET.has(
          run.status as
            | typeof EnvironmentRunSummaryDTOStatusEnum.PendingStart
            | typeof EnvironmentRunSummaryDTOStatusEnum.Started
            | typeof EnvironmentRunSummaryDTOStatusEnum.PendingStop,
        ),
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
