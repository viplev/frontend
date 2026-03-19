
# EnvironmentRunSummaryDTO

Summary of a single run within an environment

## Properties

Name | Type
------------ | -------------
`benchmarkId` | string
`runId` | string
`status` | string
`startedAt` | Date
`finishedAt` | Date

## Example

```typescript
import type { EnvironmentRunSummaryDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "benchmarkId": null,
  "runId": null,
  "status": null,
  "startedAt": null,
  "finishedAt": null,
} satisfies EnvironmentRunSummaryDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EnvironmentRunSummaryDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


