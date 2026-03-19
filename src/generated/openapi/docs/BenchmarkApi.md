# BenchmarkApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createBenchmark**](BenchmarkApi.md#createbenchmark) | **POST** /v1/environments/{environmentId}/benchmarks | Create benchmark |
| [**deleteBenchmark**](BenchmarkApi.md#deletebenchmark) | **DELETE** /v1/environments/{environmentId}/benchmarks/{benchmarkId} | Delete a benchmark |
| [**getBenchmark**](BenchmarkApi.md#getbenchmark) | **GET** /v1/environments/{environmentId}/benchmarks/{benchmarkId} | Get a benchmark |
| [**listBenchmarks**](BenchmarkApi.md#listbenchmarks) | **GET** /v1/environments/{environmentId}/benchmarks | Get all benchmarks |
| [**updateBenchmark**](BenchmarkApi.md#updatebenchmark) | **PUT** /v1/environments/{environmentId}/benchmarks/{benchmarkId} | Update a benchmark |



## createBenchmark

> BenchmarkDTO createBenchmark(environmentId, benchmarkDTO)

Create benchmark

### Example

```ts
import {
  Configuration,
  BenchmarkApi,
} from '';
import type { CreateBenchmarkRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // BenchmarkDTO
    benchmarkDTO: ...,
  } satisfies CreateBenchmarkRequest;

  try {
    const data = await api.createBenchmark(body);
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
| **benchmarkDTO** | [BenchmarkDTO](BenchmarkDTO.md) |  | |

### Return type

[**BenchmarkDTO**](BenchmarkDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Benchmark created |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteBenchmark

> deleteBenchmark(benchmarkId, environmentId)

Delete a benchmark

### Example

```ts
import {
  Configuration,
  BenchmarkApi,
} from '';
import type { DeleteBenchmarkRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkApi(config);

  const body = {
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteBenchmarkRequest;

  try {
    const data = await api.deleteBenchmark(body);
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
| **benchmarkId** | `string` |  | [Defaults to `undefined`] |
| **environmentId** | `string` |  | [Defaults to `undefined`] |

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
| **204** | Benchmark deleted |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getBenchmark

> BenchmarkDTO getBenchmark(benchmarkId, environmentId)

Get a benchmark

Shows meta data about the benchmark, as well a list of all runs for the current benchmark.

### Example

```ts
import {
  Configuration,
  BenchmarkApi,
} from '';
import type { GetBenchmarkRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkApi(config);

  const body = {
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetBenchmarkRequest;

  try {
    const data = await api.getBenchmark(body);
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
| **benchmarkId** | `string` |  | [Defaults to `undefined`] |
| **environmentId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**BenchmarkDTO**](BenchmarkDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Benchmark found |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listBenchmarks

> Array&lt;BenchmarkDTO&gt; listBenchmarks(environmentId)

Get all benchmarks

### Example

```ts
import {
  Configuration,
  BenchmarkApi,
} from '';
import type { ListBenchmarksRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies ListBenchmarksRequest;

  try {
    const data = await api.listBenchmarks(body);
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

[**Array&lt;BenchmarkDTO&gt;**](BenchmarkDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of all benchmarks |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateBenchmark

> BenchmarkDTO updateBenchmark(benchmarkId, environmentId, benchmarkDTO)

Update a benchmark

### Example

```ts
import {
  Configuration,
  BenchmarkApi,
} from '';
import type { UpdateBenchmarkRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new BenchmarkApi(config);

  const body = {
    // string
    benchmarkId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // BenchmarkDTO
    benchmarkDTO: ...,
  } satisfies UpdateBenchmarkRequest;

  try {
    const data = await api.updateBenchmark(body);
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
| **benchmarkId** | `string` |  | [Defaults to `undefined`] |
| **environmentId** | `string` |  | [Defaults to `undefined`] |
| **benchmarkDTO** | [BenchmarkDTO](BenchmarkDTO.md) |  | |

### Return type

[**BenchmarkDTO**](BenchmarkDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Benchmark updated |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

