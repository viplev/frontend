import type { BenchmarkDTO } from '../../../generated/openapi/models/BenchmarkDTO'

export type BenchmarkMutationInput = Pick<
  BenchmarkDTO,
  'name' | 'description' | 'k6Instructions'
>

export interface ListEnvironmentRunsPageInput {
  environmentId: string
  page: number
  size: number
  sort?: string
  signal?: AbortSignal
}

