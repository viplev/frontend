
# RawK6TimeSeriesDTO

Time-series data for K6 performance metrics

## Properties

Name | Type
------------ | -------------
`dataPoints` | [Array&lt;RawK6DataPointDTO&gt;](RawK6DataPointDTO.md)

## Example

```typescript
import type { RawK6TimeSeriesDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "dataPoints": null,
} satisfies RawK6TimeSeriesDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RawK6TimeSeriesDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


