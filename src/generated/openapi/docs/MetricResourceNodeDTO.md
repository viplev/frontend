
# MetricResourceNodeDTO


## Properties

Name | Type
------------ | -------------
`machineId` | string
`metrics` | [Array&lt;MetricDataPointDTO&gt;](MetricDataPointDTO.md)
`services` | [Array&lt;MetricResourceServiceDTO&gt;](MetricResourceServiceDTO.md)

## Example

```typescript
import type { MetricResourceNodeDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "machineId": null,
  "metrics": null,
  "services": null,
} satisfies MetricResourceNodeDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricResourceNodeDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


