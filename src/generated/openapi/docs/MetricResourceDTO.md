
# MetricResourceDTO

Wrapper for resource metrics sent by the agent

## Properties

Name | Type
------------ | -------------
`hosts` | [Array&lt;MetricResourceNodeDTO&gt;](MetricResourceNodeDTO.md)

## Example

```typescript
import type { MetricResourceDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "hosts": null,
} satisfies MetricResourceDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricResourceDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


