
# RawTimeSeriesDTO

Contains hosts (with nested services) and k6 time-series data

## Properties

Name | Type
------------ | -------------
`hosts` | [Array&lt;RawHostTimeSeriesDTO&gt;](RawHostTimeSeriesDTO.md)
`k6` | [RawK6TimeSeriesDTO](RawK6TimeSeriesDTO.md)

## Example

```typescript
import type { RawTimeSeriesDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "hosts": null,
  "k6": null,
} satisfies RawTimeSeriesDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RawTimeSeriesDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


