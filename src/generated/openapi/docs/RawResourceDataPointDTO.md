
# RawResourceDataPointDTO

A single resource metric data point at a given timestamp, used by both host and service time-series

## Properties

Name | Type
------------ | -------------
`timestamp` | Date
`cpuPercentage` | number
`memoryUsageBytes` | number
`memoryLimitBytes` | number
`networkInBytes` | number
`networkOutBytes` | number
`blockInBytes` | number
`blockOutBytes` | number

## Example

```typescript
import type { RawResourceDataPointDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "timestamp": null,
  "cpuPercentage": null,
  "memoryUsageBytes": null,
  "memoryLimitBytes": null,
  "networkInBytes": null,
  "networkOutBytes": null,
  "blockInBytes": null,
  "blockOutBytes": null,
} satisfies RawResourceDataPointDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RawResourceDataPointDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


