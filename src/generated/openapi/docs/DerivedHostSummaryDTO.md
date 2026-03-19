
# DerivedHostSummaryDTO

Aggregated resource stats for a single host, with nested service summaries

## Properties

Name | Type
------------ | -------------
`hostId` | string
`hostName` | string
`resource` | [DerivedResourceSummaryDTO](DerivedResourceSummaryDTO.md)
`services` | [Array&lt;DerivedServiceSummaryDTO&gt;](DerivedServiceSummaryDTO.md)

## Example

```typescript
import type { DerivedHostSummaryDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "hostId": null,
  "hostName": null,
  "resource": null,
  "services": null,
} satisfies DerivedHostSummaryDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DerivedHostSummaryDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


