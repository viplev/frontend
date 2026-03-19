
# DerivedServiceSummaryDTO

Aggregated resource stats for a single service running on a host

## Properties

Name | Type
------------ | -------------
`serviceId` | string
`serviceName` | string
`resource` | [DerivedResourceSummaryDTO](DerivedResourceSummaryDTO.md)

## Example

```typescript
import type { DerivedServiceSummaryDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "serviceId": null,
  "serviceName": null,
  "resource": null,
} satisfies DerivedServiceSummaryDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DerivedServiceSummaryDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


