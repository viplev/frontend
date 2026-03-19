
# DerivedHttpTimingDTO

Timing statistics for HTTP metrics (duration or waiting/TTFB). Percentiles are a dynamic map based on query parameter

## Properties

Name | Type
------------ | -------------
`avg` | number
`min` | number
`max` | number
`median` | number
`percentiles` | { [key: string]: number; }

## Example

```typescript
import type { DerivedHttpTimingDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "avg": null,
  "min": null,
  "max": null,
  "median": null,
  "percentiles": null,
} satisfies DerivedHttpTimingDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DerivedHttpTimingDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


