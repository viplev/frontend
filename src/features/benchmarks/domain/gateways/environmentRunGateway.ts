import type { EnvironmentRunsDTO } from '../../../../generated/openapi/models/EnvironmentRunsDTO'
import {
  EnvironmentRunSummaryDTOStatusEnum,
  type EnvironmentRunSummaryDTO,
} from '../../../../generated/openapi/models/EnvironmentRunSummaryDTO'
import { createBenchmarkRunsApi } from '../../../../auth/client'
import { ResponseError } from '../../../../generated/openapi/runtime'
import type { ListEnvironmentRunsPageInput } from '../contracts'
import { BenchmarkRunsLoadError } from '../errors'
import { readLoadErrorMessage, toResponseErrorMetadata } from './messageMapping'

const DEFAULT_ENVIRONMENT_RUN_SORT = 'startedAt,desc'
const FALLBACK_RUN_LOOKUP_PAGE_SIZE = 100
const MAX_RUN_LOOKUP_PAGES = 20

const ACTIVE_STATUS_SET = new Set([
  EnvironmentRunSummaryDTOStatusEnum.PendingStart,
  EnvironmentRunSummaryDTOStatusEnum.Started,
  EnvironmentRunSummaryDTOStatusEnum.PendingStop,
])

type BenchmarkRunsApiClient = ReturnType<typeof createBenchmarkRunsApi>

async function listEnvironmentRunsPage(
  runsApi: BenchmarkRunsApiClient,
  input: ListEnvironmentRunsPageInput,
): Promise<EnvironmentRunsDTO> {
  const { environmentId, page, size, sort = DEFAULT_ENVIRONMENT_RUN_SORT, signal } = input

  try {
    return await runsApi.listEnvironmentRuns(
      {
        environmentId,
        page,
        size,
        sort,
      },
      { signal },
    )
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new BenchmarkRunsLoadError(readLoadErrorMessage(error, 'environment runs'), {
        operation: 'list-environment-runs',
        ...toResponseErrorMetadata(error),
      })
    }

    throw new BenchmarkRunsLoadError(
      'Network error while loading environment runs. Please try again.',
      {
        kind: 'network',
        operation: 'list-environment-runs',
        cause: error,
      },
    )
  }
}

export async function listEnvironmentRunsPageGateway(
  input: ListEnvironmentRunsPageInput,
): Promise<EnvironmentRunsDTO> {
  const runsApi = createBenchmarkRunsApi()
  return await listEnvironmentRunsPage(runsApi, input)
}

export async function findEnvironmentRunSummaryGateway(
  environmentId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<EnvironmentRunSummaryDTO | null> {
  const runsApi = createBenchmarkRunsApi()
  let page = 0

  while (page < MAX_RUN_LOOKUP_PAGES) {
    const response = await listEnvironmentRunsPage(runsApi, {
      environmentId,
      page,
      size: FALLBACK_RUN_LOOKUP_PAGE_SIZE,
      sort: DEFAULT_ENVIRONMENT_RUN_SORT,
      signal,
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

export async function listActiveEnvironmentRunsGateway(
  environmentId: string,
  signal?: AbortSignal,
): Promise<Array<EnvironmentRunSummaryDTO>> {
  const runsApi = createBenchmarkRunsApi()
  const response = await listEnvironmentRunsPage(runsApi, {
    environmentId,
    page: 0,
    size: 50,
    sort: DEFAULT_ENVIRONMENT_RUN_SORT,
    signal,
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
}

