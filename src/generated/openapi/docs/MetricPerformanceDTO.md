
# MetricPerformanceDTO

Wrapper for K6 performance metrics sent by the agent

## Properties

Name | Type
------------ | -------------
`httpMetrics` | [Array&lt;MetricK6HttpDTO&gt;](MetricK6HttpDTO.md)
`vusMetrics` | [Array&lt;MetricK6VusDTO&gt;](MetricK6VusDTO.md)

## Example

```typescript
import type { MetricPerformanceDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "httpMetrics": null,
  "vusMetrics": null,
} satisfies MetricPerformanceDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricPerformanceDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


