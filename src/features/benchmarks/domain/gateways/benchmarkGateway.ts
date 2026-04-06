import type { BenchmarkDTO } from '../../../../generated/openapi/models/BenchmarkDTO'
import { createBenchmarkApi } from '../../../../auth/client'
import { ResponseError } from '../../../../generated/openapi/runtime'
import type { BenchmarkMutationInput } from '../contracts'
import {
  BenchmarksLoadError,
  CreateBenchmarkError,
  GetBenchmarkError,
  UpdateBenchmarkError,
} from '../errors'
import {
  readLoadErrorMessage,
  readMutationErrorMessage,
  toResponseErrorMetadata,
} from './messageMapping'

export async function listBenchmarksGateway(
  environmentId: string,
): Promise<Array<BenchmarkDTO>> {
  const benchmarkApi = createBenchmarkApi()

  try {
    return await benchmarkApi.listBenchmarks({ environmentId })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new BenchmarksLoadError(readLoadErrorMessage(error, 'benchmarks'), {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new BenchmarksLoadError(
      'Network error while loading benchmarks. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function createBenchmarkGateway(
  environmentId: string,
  input: BenchmarkMutationInput,
): Promise<BenchmarkDTO> {
  const benchmarkApi = createBenchmarkApi()

  try {
    return await benchmarkApi.createBenchmark({ environmentId, benchmarkDTO: input })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new CreateBenchmarkError(readMutationErrorMessage(error, 'create'), {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new CreateBenchmarkError(
      'Network error while creating benchmark. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function getBenchmarkGateway(
  environmentId: string,
  benchmarkId: string,
  signal?: AbortSignal,
): Promise<BenchmarkDTO> {
  const benchmarkApi = createBenchmarkApi()

  try {
    return await benchmarkApi.getBenchmark({ environmentId, benchmarkId }, { signal })
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      throw new GetBenchmarkError(readMutationErrorMessage(error, 'get'), {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new GetBenchmarkError(
      'Network error while loading benchmark details. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

export async function updateBenchmarkGateway(
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
      throw new UpdateBenchmarkError(readMutationErrorMessage(error, 'update'), {
        ...toResponseErrorMetadata(error),
      })
    }

    throw new UpdateBenchmarkError(
      'Network error while updating benchmark. Please try again.',
      {
        kind: 'network',
        cause: error,
      },
    )
  }
}

