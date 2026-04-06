import type { BenchmarkDTO } from '../../../../generated/openapi/models/BenchmarkDTO'
import type { BenchmarkMutationInput } from '../contracts'
import {
  createBenchmarkGateway,
  getBenchmarkGateway,
  listBenchmarksGateway,
  updateBenchmarkGateway,
} from '../gateways/benchmarkGateway'

export async function listBenchmarks(
  environmentId: string,
): Promise<Array<BenchmarkDTO>> {
  return await listBenchmarksGateway(environmentId)
}

export async function createBenchmark(
  environmentId: string,
  input: BenchmarkMutationInput,
): Promise<BenchmarkDTO> {
  return await createBenchmarkGateway(environmentId, input)
}

export async function getBenchmark(
  environmentId: string,
  benchmarkId: string,
  signal?: AbortSignal,
): Promise<BenchmarkDTO> {
  return await getBenchmarkGateway(environmentId, benchmarkId, signal)
}

export async function updateBenchmark(
  environmentId: string,
  benchmarkId: string,
  input: BenchmarkMutationInput,
): Promise<BenchmarkDTO> {
  return await updateBenchmarkGateway(environmentId, benchmarkId, input)
}

