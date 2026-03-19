
# BenchmarkRunRawDTO

Top-level wrapper for time-series data for a benchmark run, used for XY-chart visualisation

## Properties

Name | Type
------------ | -------------
`timeSeries` | [RawTimeSeriesDTO](RawTimeSeriesDTO.md)

## Example

```typescript
import type { BenchmarkRunRawDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "timeSeries": null,
} satisfies BenchmarkRunRawDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BenchmarkRunRawDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


