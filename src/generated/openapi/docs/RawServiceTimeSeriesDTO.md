
# RawServiceTimeSeriesDTO

Time-series resource data for a single service running on a host

## Properties

Name | Type
------------ | -------------
`serviceId` | string
`serviceName` | string
`replicas` | [Array&lt;RawReplicaTimeSeriesDTO&gt;](RawReplicaTimeSeriesDTO.md)

## Example

```typescript
import type { RawServiceTimeSeriesDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "serviceId": null,
  "serviceName": null,
  "replicas": null,
} satisfies RawServiceTimeSeriesDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RawServiceTimeSeriesDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


