import type { BenchmarkDTO, BenchmarkRunDerivedDTO } from '../generated/openapi/models';
import { BenchmarkRunDTOStatusEnum } from '../generated/openapi/models';
import {
  getBenchmarkApi,
  getBenchmarkActionsApi,
  getBenchmarkRunsApi,
} from '../lib/apiClient';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function wrapError(err: unknown): never {
  const status = (err as { status?: number })?.status ?? 0;
  const message =
    status === 404
      ? 'Not found.'
      : status === 400
        ? 'Invalid request.'
        : status === 401 || status === 403
          ? 'Unauthorized.'
          : 'An unexpected error occurred.';
  throw new ApiError(status, message);
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

export async function listBenchmarks(environmentId: string): Promise<BenchmarkDTO[]> {
  try {
    return await getBenchmarkApi().listBenchmarks({ environmentId });
  } catch (err) {
    wrapError(err);
  }
}

export async function getBenchmark(environmentId: string, benchmarkId: string): Promise<BenchmarkDTO> {
  try {
    return await getBenchmarkApi().getBenchmark({ environmentId, benchmarkId });
  } catch (err) {
    wrapError(err);
  }
}

export async function createBenchmark(
  environmentId: string,
  data: Omit<BenchmarkDTO, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<BenchmarkDTO> {
  try {
    return await getBenchmarkApi().createBenchmark({
      environmentId,
      benchmarkDTO: data,
    });
  } catch (err) {
    wrapError(err);
  }
}

export async function updateBenchmark(
  environmentId: string,
  benchmarkId: string,
  data: Omit<BenchmarkDTO, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<BenchmarkDTO> {
  try {
    return await getBenchmarkApi().updateBenchmark({
      environmentId,
      benchmarkId,
      benchmarkDTO: data,
    });
  } catch (err) {
    wrapError(err);
  }
}

export async function deleteBenchmark(environmentId: string, benchmarkId: string): Promise<void> {
  try {
    await getBenchmarkApi().deleteBenchmark({ environmentId, benchmarkId });
  } catch (err) {
    wrapError(err);
  }
}

// ── Benchmark actions ─────────────────────────────────────────────────────────

export async function startBenchmark(environmentId: string, benchmarkId: string) {
  try {
    return await getBenchmarkActionsApi().startBenchmark({ environmentId, benchmarkId });
  } catch (err) {
    wrapError(err);
  }
}

export async function stopBenchmarkRun(
  environmentId: string,
  benchmarkId: string,
  runId: string,
) {
  try {
    return await getBenchmarkActionsApi().stopBenchmarkRun({
      environmentId,
      benchmarkId,
      runId,
    });
  } catch (err) {
    wrapError(err);
  }
}

// ── Runs ──────────────────────────────────────────────────────────────────────

export async function listBenchmarkRuns(environmentId: string, benchmarkId: string) {
  try {
    return await getBenchmarkRunsApi().listBenchmarkRuns({ environmentId, benchmarkId });
  } catch (err) {
    wrapError(err);
  }
}

export async function getBenchmarkRun(
  environmentId: string,
  benchmarkId: string,
  runId: string,
  percentiles?: string,
): Promise<BenchmarkRunDerivedDTO> {
  try {
    return await getBenchmarkRunsApi().getBenchmarkRun({ environmentId, benchmarkId, runId, percentiles });
  } catch (err) {
    wrapError(err);
  }
}

export async function getBenchmarkRunRawData(
  environmentId: string,
  benchmarkId: string,
  runId: string,
) {
  try {
    // Use the *Raw variant to avoid the naming collision in the generated client
    const response = await getBenchmarkRunsApi().getBenchmarkRunRawRaw({ environmentId, benchmarkId, runId });
    return response.value();
  } catch (err) {
    wrapError(err);
  }
}

export async function listEnvironmentRuns(environmentId: string) {
  try {
    return await getBenchmarkRunsApi().listEnvironmentRuns({ environmentId });
  } catch (err) {
    wrapError(err);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  BenchmarkRunDTOStatusEnum.PendingStart,
  BenchmarkRunDTOStatusEnum.Started,
  BenchmarkRunDTOStatusEnum.PendingStop,
]);

export function isRunActive(status?: string): boolean {
  return status != null && ACTIVE_STATUSES.has(status);
}
