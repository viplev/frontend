
# DerivedResourceSummaryDTO

Aggregated resource metrics (CPU, memory, network, block I/O). Used by both host and service summaries

## Properties

Name | Type
------------ | -------------
`cpu` | [DerivedResourceStatsDTO](DerivedResourceStatsDTO.md)
`memory` | [DerivedResourceStatsDTO](DerivedResourceStatsDTO.md)
`networkInTotalBytes` | number
`networkOutTotalBytes` | number
`blockInTotalBytes` | number
`blockOutTotalBytes` | number

## Example

```typescript
import type { DerivedResourceSummaryDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "cpu": null,
  "memory": null,
  "networkInTotalBytes": null,
  "networkOutTotalBytes": null,
  "blockInTotalBytes": null,
  "blockOutTotalBytes": null,
} satisfies DerivedResourceSummaryDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DerivedResourceSummaryDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


