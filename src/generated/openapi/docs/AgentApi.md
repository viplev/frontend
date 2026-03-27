# AgentApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**listMessages**](AgentApi.md#listmessages) | **GET** /v1/environments/{environmentId}/message | Get list of pending messages for current environment |
| [**registerServices**](AgentApi.md#registerservices) | **POST** /v1/environments/{environmentId}/services | Agent can post a list of services |
| [**storePerformanceMetrics**](AgentApi.md#storeperformancemetrics) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/metrics/performance | Store performance metrics |
| [**storeResourceMetrics**](AgentApi.md#storeresourcemetrics) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/metrics/resource | Store resource metrics |
| [**updateBenchmarkRunStatus**](AgentApi.md#updatebenchmarkrunstatus) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/status | Update run with a status |



## listMessages

> Array&lt;MessageDTO&gt; listMessages(environmentId)

Get list of pending messages for current environment

This endpoint is used by the agent, to see if there are any benchmarks to start or stop.

### Example

```ts
import {
  Configuration,
  AgentApi,
} from '';
import type { ListMessagesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies ListMessagesRequest;

  try {
    const data = await api.listMessages(body);
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

### Return type

[**Array&lt;MessageDTO&gt;**](MessageDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of pending messages |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## registerServices

> registerServices(environmentId, serviceRegistrationDTO)

Agent can post a list of services

### Example

```ts
import {
  Configuration,
  AgentApi,
} from '';
import type { RegisterServicesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // ServiceRegistrationDTO
    serviceRegistrationDTO: ...,
  } satisfies RegisterServicesRequest;

  try {
    const data = await api.registerServices(body);
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
| **serviceRegistrationDTO** | [ServiceRegistrationDTO](ServiceRegistrationDTO.md) |  | |

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
| **201** | Services created |  -  |
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
  AgentApi,
} from '';
import type { StorePerformanceMetricsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentApi(config);

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
  AgentApi,
} from '';
import type { StoreResourceMetricsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentApi(config);

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
  AgentApi,
} from '';
import type { UpdateBenchmarkRunStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AgentApi(config);

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

