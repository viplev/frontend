# BenchmarkRunsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**deleteBenchmarkRun**](BenchmarkRunsApi.md#deletebenchmarkrun) | **DELETE** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId} | Delete a run |
| [**getBenchmarkRun**](BenchmarkRunsApi.md#getbenchmarkrun) | **GET** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId} | Get a run |
| [**getBenchmarkRunRaw**](BenchmarkRunsApi.md#getbenchmarkrunraw) | **GET** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/raw | Get raw data for a run |
| [**listBenchmarkRuns**](BenchmarkRunsApi.md#listbenchmarkruns) | **GET** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs | Get all runs for a benchmark |
| [**listEnvironmentRuns**](BenchmarkRunsApi.md#listenvironmentruns) | **GET** /v1/environments/{environmentId}/runs | Get all runs across benchmarks for an environment |
| [**storePerformanceMetrics**](BenchmarkRunsApi.md#storeperformancemetrics) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/metrics/performance | Store performance metrics |
| [**storeResourceMetrics**](BenchmarkRunsApi.md#storeresourcemetrics) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/metrics/resource | Store resource metrics |
| [**updateBenchmarkRunStatus**](BenchmarkRunsApi.md#updatebenchmarkrunstatus) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/status | Update run with a status |



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
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

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

[bearerAuth](../README.md#bearerAuth)

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
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

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

[bearerAuth](../README.md#bearerAuth)

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


## getBenchmarkRunRaw

> BenchmarkRunRawDTO getBenchmarkRunRaw(environmentId, benchmarkId, runId)

Get raw data for a run

Returns all raw resource and performance metrics for a run as time-series data

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { GetBenchmarkRunRawRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetBenchmarkRunRawRequest;

  try {
    const data = await api.getBenchmarkRunRaw(body);
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

[bearerAuth](../README.md#bearerAuth)

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
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

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

[bearerAuth](../README.md#bearerAuth)

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
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

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

[bearerAuth](../README.md#bearerAuth)

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


## storePerformanceMetrics

> storePerformanceMetrics(environmentId, benchmarkId, runId, metricPerformanceDTO)

Store performance metrics

Used by the agent to send k6 performance metrics (response times, throughput, error rates etc.) when the test completes

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { StorePerformanceMetricsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // MetricPerformanceDTO
    metricPerformanceDTO: ...,
  } satisfies StorePerformanceMetricsRequest;

  try {
    const data = await api.storePerformanceMetrics(body);
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
| **metricPerformanceDTO** | [MetricPerformanceDTO](MetricPerformanceDTO.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Performance metrics stored |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## storeResourceMetrics

> storeResourceMetrics(environmentId, benchmarkId, runId, metricResourceDTO)

Store resource metrics

Used by the agent to send resource metrics (CPU, memory, disk, network etc.) during a benchmark run (every 5 seconds)

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { StoreResourceMetricsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // MetricResourceDTO
    metricResourceDTO: ...,
  } satisfies StoreResourceMetricsRequest;

  try {
    const data = await api.storeResourceMetrics(body);
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
| **metricResourceDTO** | [MetricResourceDTO](MetricResourceDTO.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Resource metrics stored |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateBenchmarkRunStatus

> BenchmarkRunDTO updateBenchmarkRunStatus(environmentId, benchmarkId, runId, benchmarkRunStatusUpdateDTO)

Update run with a status

This endpoint is used to update the run status, if failed, error messages must be included

### Example

```ts
import {
  Configuration,
  BenchmarkRunsApi,
} from '';
import type { UpdateBenchmarkRunStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkRunsApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // BenchmarkRunStatusUpdateDTO
    benchmarkRunStatusUpdateDTO: ...,
  } satisfies UpdateBenchmarkRunStatusRequest;

  try {
    const data = await api.updateBenchmarkRunStatus(body);
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
| **benchmarkRunStatusUpdateDTO** | [BenchmarkRunStatusUpdateDTO](BenchmarkRunStatusUpdateDTO.md) |  | |

### Return type

[**BenchmarkRunDTO**](BenchmarkRunDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Status updated |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

