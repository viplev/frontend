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

const ACTIVE_STATUS_SET = new Set([
  EnvironmentRunSummaryDTOStatusEnum.PendingStart,
  EnvironmentRunSummaryDTOStatusEnum.Started,
  EnvironmentRunSummaryDTOStatusEnum.PendingStop,
])

export async function listEnvironmentRunsPageGateway(
  input: ListEnvironmentRunsPageInput,
): Promise<EnvironmentRunsDTO> {
  const runsApi = createBenchmarkRunsApi()
  const { environmentId, page, size, sort = 'startedAt,desc', signal } = input

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

export async function listActiveEnvironmentRunsGateway(
  environmentId: string,
  signal?: AbortSignal,
): Promise<Array<EnvironmentRunSummaryDTO>> {
  const response = await listEnvironmentRunsPageGateway({
    environmentId,
    page: 0,
    size: 50,
    sort: 'startedAt,desc',
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

