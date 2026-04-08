import type { BenchmarkRunDerivedDTO } from '../../../../generated/openapi/models/BenchmarkRunDerivedDTO'
import type { BenchmarkRunDTO } from '../../../../generated/openapi/models/BenchmarkRunDTO'
import type { BenchmarkRunRawDTO } from '../../../../generated/openapi/models/BenchmarkRunRawDTO'
import type { BenchmarkStatusDTO } from '../../../../generated/openapi/models/BenchmarkStatusDTO'
import type { EnvironmentRunSummaryDTO } from '../../../../generated/openapi/models/EnvironmentRunSummaryDTO'
import { BenchmarkRunDetailsError, BenchmarkRunsLoadError } from '../errors'
import {
  deleteBenchmarkRunGateway,
  getBenchmarkRunDetailsGateway,
  getBenchmarkRunRawGateway,
  listBenchmarkRunsGateway,
  startBenchmarkGateway,
  stopBenchmarkRunGateway,
} from '../gateways/benchmarkRunGateway'
import {
  listActiveEnvironmentRunsGateway,
  listEnvironmentRunsPageGateway,
} from '../gateways/environmentRunGateway'

async function findEnvironmentRunSummary(
  environmentId: string,
  runId: string,
): Promise<EnvironmentRunSummaryDTO | null> {
  const size = 100
  const maxPages = 20
  const response = await listEnvironmentRunsPageGateway({
    environmentId,
    page: 0,
    size: size * maxPages,
    sort: 'startedAt,desc',
  })

  return (response.runs ?? []).find((run) => run.runId === runId) ?? null
}

export async function startBenchmark(
  environmentId: string,
  benchmarkId: string,
): Promise<BenchmarkStatusDTO> {
  return await startBenchmarkGateway(environmentId, benchmarkId)
}

export async function stopBenchmarkRun(
  environmentId: string,
  benchmarkId: string,
  runId: string,
): Promise<BenchmarkStatusDTO> {
  return await stopBenchmarkRunGateway(environmentId, benchmarkId, runId)
}

export async function deleteBenchmarkRun(
  environmentId: string,
  benchmarkId: string,
  runId: string,
): Promise<void> {
  await deleteBenchmarkRunGateway(environmentId, benchmarkId, runId)
}

export async function getBenchmarkRunDetails(
  environmentId: string,
  benchmarkId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<BenchmarkRunDerivedDTO> {
  try {
    return await getBenchmarkRunDetailsGateway(environmentId, benchmarkId, runId, signal)
  } catch (error: unknown) {
    if (error instanceof BenchmarkRunDetailsError && error.statusCode === 404) {
      throw error
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

    if (error instanceof BenchmarkRunDetailsError) {
      throw error
    }

    throw new BenchmarkRunDetailsError(
      'Network error while loading benchmark run details. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function getBenchmarkRunRaw(
  environmentId: string,
  benchmarkId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<BenchmarkRunRawDTO> {
  return await getBenchmarkRunRawGateway(environmentId, benchmarkId, runId, signal)
}

export async function listBenchmarkRuns(
  environmentId: string,
  benchmarkId: string,
  signal?: AbortSignal,
): Promise<Array<BenchmarkRunDTO>> {
  return await listBenchmarkRunsGateway(environmentId, benchmarkId, signal)
}

export async function listActiveEnvironmentRuns(
  environmentId: string,
  signal?: AbortSignal,
): Promise<Array<EnvironmentRunSummaryDTO>> {
  try {
    return await listActiveEnvironmentRunsGateway(environmentId, signal)
  } catch (error: unknown) {
    if (error instanceof BenchmarkRunsLoadError) {
      throw error
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

