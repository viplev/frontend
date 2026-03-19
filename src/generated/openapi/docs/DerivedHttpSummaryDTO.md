
# DerivedHttpSummaryDTO

Aggregated HTTP metrics for a single request group

## Properties

Name | Type
------------ | -------------
`requestGroup` | string
`url` | string
`totalRequests` | number
`requestsPerSecond` | number
`errorRate` | number
`totalDataReceivedBytes` | number
`totalDataSentBytes` | number
`duration` | [DerivedHttpTimingDTO](DerivedHttpTimingDTO.md)
`waiting` | [DerivedHttpTimingDTO](DerivedHttpTimingDTO.md)

## Example

```typescript
import type { DerivedHttpSummaryDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "requestGroup": null,
  "url": null,
  "totalRequests": null,
  "requestsPerSecond": null,
  "errorRate": null,
  "totalDataReceivedBytes": null,
  "totalDataSentBytes": null,
  "duration": null,
  "waiting": null,
} satisfies DerivedHttpSummaryDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DerivedHttpSummaryDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


