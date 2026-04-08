import type { BenchmarkRunDerivedDTO } from '../../../../generated/openapi/models/BenchmarkRunDerivedDTO'
import type { BenchmarkRunDTO } from '../../../../generated/openapi/models/BenchmarkRunDTO'
import type { BenchmarkRunRawDTO } from '../../../../generated/openapi/models/BenchmarkRunRawDTO'
import type { BenchmarkStatusDTO } from '../../../../generated/openapi/models/BenchmarkStatusDTO'
import { createBenchmarkActionsApi, createBenchmarkRunsApi } from '../../../../auth/client'
import { ResponseError } from '../../../../generated/openapi/runtime'
import {
  BenchmarkRunDetailsError,
  BenchmarkRunRawError,
  BenchmarkRunsLoadError,
  DeleteBenchmarkRunError,
  StartBenchmarkError,
  StopBenchmarkRunError,
} from '../errors'
import { readLoadErrorMessage, toResponseErrorMetadata } from './messageMapping'

export async function startBenchmarkGateway(
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
          { ...toResponseErrorMetadata(error) },
        )
      }
      if (error.response.status === 404) {
        throw new StartBenchmarkError('Benchmark was not found.', {
          ...toResponseErrorMetadata(error),
        })
      }
      if (error.response.status === 409) {
        throw new StartBenchmarkError(
          'This benchmark already has an active run in this environment.',
          { ...toResponseErrorMetadata(error) },
        )
      }
      if (error.response.status >= 500) {
        throw new StartBenchmarkError(
          'Server error while trying to start benchmark.',
          { ...toResponseErrorMetadata(error) },
        )
      }

      throw new StartBenchmarkError('Unable to start benchmark right now.', {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new StartBenchmarkError(
      'Network error while starting benchmark. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function stopBenchmarkRunGateway(
  environmentId: string,
  benchmarkId: string,
  runId: string,
): Promise<BenchmarkStatusDTO> {
  const benchmarkActionsApi = createBenchmarkActionsApi()

  try {
    return await benchmarkActionsApi.stopBenchmarkRun({ environmentId, benchmarkId, runId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 400) {
        throw new StopBenchmarkRunError(
          'This run is not in a stoppable state right now.',
          { ...toResponseErrorMetadata(error) },
        )
      }
      if (error.response.status === 409) {
        throw new StopBenchmarkRunError(
          'This run is already stopping and cannot be cancelled again.',
          { ...toResponseErrorMetadata(error) },
        )
      }
      if (error.response.status === 404) {
        throw new StopBenchmarkRunError('Benchmark run was not found.', {
          ...toResponseErrorMetadata(error),
        })
      }
      if (error.response.status >= 500) {
        throw new StopBenchmarkRunError(
          'Server error while trying to stop benchmark run.',
          { ...toResponseErrorMetadata(error) },
        )
      }
      throw new StopBenchmarkRunError('Unable to stop benchmark run right now.', {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new StopBenchmarkRunError(
      'Network error while stopping benchmark run. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function deleteBenchmarkRunGateway(
  environmentId: string,
  benchmarkId: string,
  runId: string,
): Promise<void> {
  const runsApi = createBenchmarkRunsApi()

  try {
    await runsApi.deleteBenchmarkRun({ environmentId, benchmarkId, runId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 400) {
        throw new DeleteBenchmarkRunError(
          'This run cannot be deleted in its current state.',
          { ...toResponseErrorMetadata(error) },
        )
      }
      if (error.response.status === 404) {
        throw new DeleteBenchmarkRunError('Benchmark run was not found.', {
          ...toResponseErrorMetadata(error),
        })
      }
      if (error.response.status === 409) {
        throw new DeleteBenchmarkRunError(
          'Active runs cannot be deleted. Cancel the run first.',
          { ...toResponseErrorMetadata(error) },
        )
      }
      if (error.response.status >= 500) {
        throw new DeleteBenchmarkRunError(
          'Server error while trying to delete benchmark run.',
          { ...toResponseErrorMetadata(error) },
        )
      }
      throw new DeleteBenchmarkRunError('Unable to delete benchmark run right now.', {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new DeleteBenchmarkRunError(
      'Network error while deleting benchmark run. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function getBenchmarkRunDetailsGateway(
  environmentId: string,
  benchmarkId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<BenchmarkRunDerivedDTO> {
  const runsApi = createBenchmarkRunsApi()

  try {
    return await runsApi.getBenchmarkRun(
      { environmentId, benchmarkId, runId },
      { signal },
    )
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 404) {
        throw new BenchmarkRunDetailsError('Benchmark run was not found.', {
          ...toResponseErrorMetadata(error),
        })
      }

      throw new BenchmarkRunDetailsError(
        readLoadErrorMessage(error, 'benchmark run details'),
        { ...toResponseErrorMetadata(error) },
      )
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

export async function getBenchmarkRunRawGateway(
  environmentId: string,
  benchmarkId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<BenchmarkRunRawDTO> {
  const runsApi = createBenchmarkRunsApi()

  try {
    const response = await runsApi.getBenchmarkRunDataRaw(
      {
        environmentId,
        benchmarkId,
        runId,
      },
      { signal },
    )
    return await response.value()
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 404) {
        throw new BenchmarkRunRawError('Benchmark run was not found.', {
          ...toResponseErrorMetadata(error),
        })
      }

      throw new BenchmarkRunRawError(
        readLoadErrorMessage(error, 'benchmark run raw data'),
        { ...toResponseErrorMetadata(error) },
      )
    }

    throw new BenchmarkRunRawError(
      'Network error while loading benchmark run raw data. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function listBenchmarkRunsGateway(
  environmentId: string,
  benchmarkId: string,
  signal?: AbortSignal,
): Promise<Array<BenchmarkRunDTO>> {
  const runsApi = createBenchmarkRunsApi()

  try {
    return await runsApi.listBenchmarkRuns({ environmentId, benchmarkId }, { signal })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      if (error.response.status === 404) {
        throw new BenchmarkRunsLoadError('Benchmark was not found.', {
          ...toResponseErrorMetadata(error),
        })
      }

      throw new BenchmarkRunsLoadError(readLoadErrorMessage(error, 'benchmark runs'), {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new BenchmarkRunsLoadError(
      'Network error while loading benchmark runs. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

