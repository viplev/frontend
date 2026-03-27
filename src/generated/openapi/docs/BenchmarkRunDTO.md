
# BenchmarkRunDTO


## Properties

Name | Type
------------ | -------------
`id` | string
`startedBy` | string
`status` | string
`statusReason` | string
`startedAt` | Date
`finishedAt` | Date
`createdAt` | Date

## Example

```typescript
import type { BenchmarkRunDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "startedBy": null,
  "status": null,
  "statusReason": null,
  "startedAt": null,
  "finishedAt": null,
  "createdAt": null,
} satisfies BenchmarkRunDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BenchmarkRunDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


