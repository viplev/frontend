# BenchmarkRunsApi

All URIs are relative to *http://api.viplev.ringhus.dk*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**deleteBenchmarkRun**](BenchmarkRunsApi.md#deletebenchmarkrun) | **DELETE** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId} | Delete a run |
| [**getBenchmarkRun**](BenchmarkRunsApi.md#getbenchmarkrun) | **GET** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId} | Get a run |
| [**getBenchmarkRunData**](BenchmarkRunsApi.md#getbenchmarkrundata) | **GET** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/raw | Get raw data for a run |
| [**listBenchmarkRuns**](BenchmarkRunsApi.md#listbenchmarkruns) | **GET** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs | Get all runs for a benchmark |
| [**listEnvironmentRuns**](BenchmarkRunsApi.md#listenvironmentruns) | **GET** /v1/environments/{environmentId}/runs | Get all runs across benchmarks for an environment |



## deleteBenchmarkRun

> deleteBenchmarkRun(environmentId, benchmarkId, runId)

Delete a run

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { DeleteBenchmarkRunRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new BenchmarkRunsApi();

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteBenchmarkRunRequest;

  try {
    const data = await api.deleteBenchmarkRun(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **environmentId** | `string` |  | [Defaults to `undefined`] |
| **benchmarkId** | `string` |  | [Defaults to `undefined`] |
| **runId** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Run deleted |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getBenchmarkRun

> BenchmarkRunDerivedDTO getBenchmarkRun(environmentId, benchmarkId, runId, percentiles)

Get a run

Returns run metadata and derived metrics

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { GetBenchmarkRunRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new BenchmarkRunsApi();

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string | Comma-separated list of percentiles to include (e.g. p99,p999) (optional)
    percentiles: percentiles_example,
  } satisfies GetBenchmarkRunRequest;

  try {
    const data = await api.getBenchmarkRun(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **environmentId** | `string` |  | [Defaults to `undefined`] |
| **benchmarkId** | `string` |  | [Defaults to `undefined`] |
| **runId** | `string` |  | [Defaults to `undefined`] |
| **percentiles** | `string` | Comma-separated list of percentiles to include (e.g. p99,p999) | [Optional] [Defaults to `&#39;p90,p95&#39;`] |

### Return type

[**BenchmarkRunDerivedDTO**](BenchmarkRunDerivedDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Run found |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getBenchmarkRunData

> BenchmarkRunRawDTO getBenchmarkRunData(environmentId, benchmarkId, runId)

Get raw data for a run

Returns all raw resource and performance metrics for a run as time-series data

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { GetBenchmarkRunDataRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new BenchmarkRunsApi();

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetBenchmarkRunDataRequest;

  try {
    const data = await api.getBenchmarkRunData(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **environmentId** | `string` |  | [Defaults to `undefined`] |
| **benchmarkId** | `string` |  | [Defaults to `undefined`] |
| **runId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**BenchmarkRunRawDTO**](BenchmarkRunRawDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Raw metrics found |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listBenchmarkRuns

> Array&lt;BenchmarkRunDTO&gt; listBenchmarkRuns(environmentId, benchmarkId)

Get all runs for a benchmark

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { ListBenchmarkRunsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new BenchmarkRunsApi();

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies ListBenchmarkRunsRequest;

  try {
    const data = await api.listBenchmarkRuns(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **environmentId** | `string` |  | [Defaults to `undefined`] |
| **benchmarkId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;BenchmarkRunDTO&gt;**](BenchmarkRunDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of all runs |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listEnvironmentRuns

> EnvironmentRunsDTO listEnvironmentRuns(environmentId, page, size, sort)

Get all runs across benchmarks for an environment

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { ListEnvironmentRunsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new BenchmarkRunsApi();

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // number | Page number (zero-based) (optional)
    page: 56,
    // number | Number of items per page (optional)
    size: 56,
    // string | Sort field and direction, e.g. startedAt,desc. Sortable fields: status, startedAt, finishedAt. Default: status,asc then startedAt,desc (optional)
    sort: sort_example,
  } satisfies ListEnvironmentRunsRequest;

  try {
    const data = await api.listEnvironmentRuns(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **environmentId** | `string` |  | [Defaults to `undefined`] |
| **page** | `number` | Page number (zero-based) | [Optional] [Defaults to `0`] |
| **size** | `number` | Number of items per page | [Optional] [Defaults to `20`] |
| **sort** | `string` | Sort field and direction, e.g. startedAt,desc. Sortable fields: status, startedAt, finishedAt. Default: status,asc then startedAt,desc | [Optional] [Defaults to `&#39;status,asc;startedAt,desc&#39;`] |

### Return type

[**EnvironmentRunsDTO**](EnvironmentRunsDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated list of runs |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

