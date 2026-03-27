
# MetricDataPointDTO


## Properties

Name | Type
------------ | -------------
`collectedAt` | Date
`cpuPercentage` | number
`memoryUsageBytes` | number
`memoryLimitBytes` | number
`networkInBytes` | number
`networkOutBytes` | number
`blockInBytes` | number
`blockOutBytes` | number

## Example

```typescript
import type { MetricDataPointDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "collectedAt": null,
  "cpuPercentage": null,
  "memoryUsageBytes": null,
  "memoryLimitBytes": null,
  "networkInBytes": null,
  "networkOutBytes": null,
  "blockInBytes": null,
  "blockOutBytes": null,
} satisfies MetricDataPointDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricDataPointDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


