
# BenchmarkRunDerivedDTO

Top-level wrapper for aggregated summary stats for a benchmark run. Percentiles are dynamic via ?percentiles query param (default p90, p95)

## Properties

Name | Type
------------ | -------------
`run` | [BenchmarkRunDTO](BenchmarkRunDTO.md)
`http` | [Array&lt;DerivedHttpSummaryDTO&gt;](DerivedHttpSummaryDTO.md)
`vus` | [DerivedVusSummaryDTO](DerivedVusSummaryDTO.md)
`hosts` | [Array&lt;DerivedHostSummaryDTO&gt;](DerivedHostSummaryDTO.md)

## Example

```typescript
import type { BenchmarkRunDerivedDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "run": null,
  "http": null,
  "vus": null,
  "hosts": null,
} satisfies BenchmarkRunDerivedDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BenchmarkRunDerivedDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


