
# MetricResourceServiceReplicaDTO


## Properties

Name | Type
------------ | -------------
`containerId` | string
`startedAt` | Date
`metrics` | [Array&lt;MetricDataPointDTO&gt;](MetricDataPointDTO.md)

## Example

```typescript
import type { MetricResourceServiceReplicaDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "containerId": null,
  "startedAt": null,
  "metrics": null,
} satisfies MetricResourceServiceReplicaDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricResourceServiceReplicaDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


