# EnvironmentApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createEnvironment**](EnvironmentApi.md#createenvironment) | **POST** /v1/environments | Create environment |
| [**deleteEnvironment**](EnvironmentApi.md#deleteenvironment) | **DELETE** /v1/environments/{environmentId} | Delete an environment |
| [**getEnvironment**](EnvironmentApi.md#getenvironment) | **GET** /v1/environments/{environmentId} | Get an environment |
| [**getService**](EnvironmentApi.md#getservice) | **GET** /v1/environments/{environmentId}/services/{serviceId} | Get a single service |
| [**listEnvironments**](EnvironmentApi.md#listenvironments) | **GET** /v1/environments | Get all environments |
| [**listServices**](EnvironmentApi.md#listservices) | **GET** /v1/environments/{environmentId}/services | Get all services on an Environment |
| [**registerServices**](EnvironmentApi.md#registerservices) | **POST** /v1/environments/{environmentId}/services | Agent can post a list of services |
| [**updateEnvironment**](EnvironmentApi.md#updateenvironment) | **PUT** /v1/environments/{environmentId} | Update an environment |



## createEnvironment

> EnvironmentDTO createEnvironment(environmentDTO)

Create environment

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { CreateEnvironmentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  const body = {
    // EnvironmentDTO
    environmentDTO: ...,
  } satisfies CreateEnvironmentRequest;

  try {
    const data = await api.createEnvironment(body);
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
| **environmentDTO** | [EnvironmentDTO](EnvironmentDTO.md) |  | |

### Return type

[**EnvironmentDTO**](EnvironmentDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Environment created |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteEnvironment

> deleteEnvironment(environmentId)

Delete an environment

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { DeleteEnvironmentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteEnvironmentRequest;

  try {
    const data = await api.deleteEnvironment(body);
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

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Environment deleted |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getEnvironment

> EnvironmentDTO getEnvironment(environmentId)

Get an environment

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { GetEnvironmentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetEnvironmentRequest;

  try {
    const data = await api.getEnvironment(body);
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

[**EnvironmentDTO**](EnvironmentDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Environment found |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getService

> ServiceDTO getService(environmentId, serviceId)

Get a single service

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { GetServiceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    serviceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetServiceRequest;

  try {
    const data = await api.getService(body);
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
| **serviceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**ServiceDTO**](ServiceDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Service found |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listEnvironments

> Array&lt;EnvironmentDTO&gt; listEnvironments()

Get all environments

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { ListEnvironmentsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  try {
    const data = await api.listEnvironments();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;EnvironmentDTO&gt;**](EnvironmentDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of all environments |  -  |
| **401** | Authentication required |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listServices

> Array&lt;ServiceDTO&gt; listServices(environmentId)

Get all services on an Environment

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { ListServicesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies ListServicesRequest;

  try {
    const data = await api.listServices(body);
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

[**Array&lt;ServiceDTO&gt;**](ServiceDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of all services |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## registerServices

> registerServices(environmentId, serviceDTO)

Agent can post a list of services

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { RegisterServicesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // Array<ServiceDTO>
    serviceDTO: ...,
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
| **serviceDTO** | `Array<ServiceDTO>` |  | |

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


## updateEnvironment

> EnvironmentDTO updateEnvironment(environmentId, environmentDTO)

Update an environment

### Example

```ts
import {
  Configuration,
  EnvironmentApi,
} from '';
import type { UpdateEnvironmentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnvironmentApi(config);

  const body = {
    // string
    environmentId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // EnvironmentDTO
    environmentDTO: ...,
  } satisfies UpdateEnvironmentRequest;

  try {
    const data = await api.updateEnvironment(body);
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
| **environmentDTO** | [EnvironmentDTO](EnvironmentDTO.md) |  | |

### Return type

[**EnvironmentDTO**](EnvironmentDTO.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Environment updated |  -  |
| **400** | Invalid request |  -  |
| **401** | Authentication required |  -  |
| **404** | Resource not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

