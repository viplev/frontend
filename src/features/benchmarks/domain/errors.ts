export type BenchmarkDomainErrorKind =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'server'
  | 'network'
  | 'unknown'

export type BenchmarkDomainOperation =
  | 'list-benchmarks'
  | 'create-benchmark'
  | 'get-benchmark'
  | 'update-benchmark'
  | 'start-run'
  | 'stop-run'
  | 'delete-run'
  | 'get-run-details'
  | 'get-run-raw'
  | 'list-runs'
  | 'list-environment-runs'
  | 'unknown'

export interface BenchmarkDomainErrorMetadata {
  kind?: BenchmarkDomainErrorKind
  operation?: BenchmarkDomainOperation
  statusCode?: number
  cause?: unknown
}

export class BenchmarkDomainError extends Error {
  readonly kind: BenchmarkDomainErrorKind
  readonly operation: BenchmarkDomainOperation
  readonly statusCode?: number
  readonly cause?: unknown

  constructor(
    name: string,
    message: string,
    metadata: BenchmarkDomainErrorMetadata = {},
  ) {
    super(message)
    this.name = name
    this.kind = metadata.kind ?? 'unknown'
    this.operation = metadata.operation ?? 'unknown'
    this.statusCode = metadata.statusCode
    this.cause = metadata.cause
  }
}

export function isBenchmarkDomainError(
  error: unknown,
): error is BenchmarkDomainError {
  return error instanceof BenchmarkDomainError
}

export class BenchmarksLoadError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('BenchmarksLoadError', message, {
      operation: 'list-benchmarks',
      ...metadata,
    })
  }
}

export class BenchmarkRunsLoadError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('BenchmarkRunsLoadError', message, {
      operation: 'list-runs',
      ...metadata,
    })
  }
}

export class CreateBenchmarkError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('CreateBenchmarkError', message, {
      operation: 'create-benchmark',
      ...metadata,
    })
  }
}

export class GetBenchmarkError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('GetBenchmarkError', message, {
      operation: 'get-benchmark',
      ...metadata,
    })
  }
}

export class UpdateBenchmarkError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('UpdateBenchmarkError', message, {
      operation: 'update-benchmark',
      ...metadata,
    })
  }
}

export class StartBenchmarkError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('StartBenchmarkError', message, {
      operation: 'start-run',
      ...metadata,
    })
  }
}

export class StopBenchmarkRunError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('StopBenchmarkRunError', message, {
      operation: 'stop-run',
      ...metadata,
    })
  }
}

export class DeleteBenchmarkRunError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('DeleteBenchmarkRunError', message, {
      operation: 'delete-run',
      ...metadata,
    })
  }
}

export class BenchmarkRunDetailsError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('BenchmarkRunDetailsError', message, {
      operation: 'get-run-details',
      ...metadata,
    })
  }
}

export class BenchmarkRunRawError extends BenchmarkDomainError {
  constructor(message: string, metadata: BenchmarkDomainErrorMetadata = {}) {
    super('BenchmarkRunRawError', message, {
      operation: 'get-run-raw',
      ...metadata,
    })
  }
}

