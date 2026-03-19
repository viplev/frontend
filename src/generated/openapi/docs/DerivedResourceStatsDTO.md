
# DerivedResourceStatsDTO

Statistics for a single resource metric (e.g. CPU or memory). Percentiles are a dynamic map based on query parameter

## Properties

Name | Type
------------ | -------------
`avg` | number
`max` | number
`percentiles` | { [key: string]: number; }

## Example

```typescript
import type { DerivedResourceStatsDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "avg": null,
  "max": null,
  "percentiles": null,
} satisfies DerivedResourceStatsDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DerivedResourceStatsDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


