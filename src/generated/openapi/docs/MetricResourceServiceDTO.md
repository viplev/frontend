
# MetricResourceServiceDTO


## Properties

Name | Type
------------ | -------------
`id` | string
`serviceId` | string
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
import type { MetricResourceServiceDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "serviceId": null,
  "collectedAt": null,
  "cpuPercentage": null,
  "memoryUsageBytes": null,
  "memoryLimitBytes": null,
  "networkInBytes": null,
  "networkOutBytes": null,
  "blockInBytes": null,
  "blockOutBytes": null,
} satisfies MetricResourceServiceDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricResourceServiceDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


