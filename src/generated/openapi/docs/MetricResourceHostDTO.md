
# MetricResourceHostDTO


## Properties

Name | Type
------------ | -------------
`machineId` | string
`metrics` | [Array&lt;MetricDataPointDTO&gt;](MetricDataPointDTO.md)

## Example

```typescript
import type { MetricResourceHostDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "machineId": null,
  "metrics": null,
} satisfies MetricResourceHostDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricResourceHostDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


