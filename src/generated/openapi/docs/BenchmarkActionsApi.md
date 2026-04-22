# BenchmarkActionsApi

All URIs are relative to *http://api.viplev.ringhus.dk*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**startBenchmark**](BenchmarkActionsApi.md#startbenchmark) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/start | Start a benchmark |
| [**stopBenchmarkRun**](BenchmarkActionsApi.md#stopbenchmarkrun) | **POST** /v1/environments/{environmentId}/benchmarks/{benchmarkId}/runs/{runId}/stop | Stop a benchmark run |



## startBenchmark

> BenchmarkStatusDTO startBenchmark(environmentId, benchmarkId)

Start a benchmark

When this is called, a new run is created with a status of PENDING_START.  This will be blocked if there is an ongoing run for the benchmark. 

### Example

```ts
import {
  Configuration,
  BenchmarkActionsApi,
} from '';
import type { StartBenchmarkRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new BenchmarkActionsApi();

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies StartBenchmarkRequest;

  try {
    const data = await api.startBenchmark(body);
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

[**BenchmarkStatusDTO**](BenchmarkStatusDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Benchmark run created |  -  |
| **400** | Invalid request |  -  |
| **409** | Resource state conflict |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## stopBenchmarkRun

> BenchmarkStatusDTO stopBenchmarkRun(environmentId, benchmarkId, runId)

Stop a benchmark run

Stops an ongoing benchmark run. Returns 409 if the run is not in a stoppable state.

### Example

```ts
import {
  Configuration,
  BenchmarkActionsApi,
} from '';
import type { StopBenchmarkRunRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new BenchmarkActionsApi();

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    runId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies StopBenchmarkRunRequest;

  try {
    const data = await api.stopBenchmarkRun(body);
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

[**BenchmarkStatusDTO**](BenchmarkStatusDTO.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Benchmark run stopped |  -  |
| **400** | Invalid request |  -  |
| **409** | Resource state conflict |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

