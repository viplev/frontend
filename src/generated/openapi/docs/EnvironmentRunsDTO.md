
# EnvironmentRunsDTO

Paginated list of runs across all benchmarks in an environment

## Properties

Name | Type
------------ | -------------
`runs` | [Array&lt;EnvironmentRunSummaryDTO&gt;](EnvironmentRunSummaryDTO.md)
`pagination` | [PaginationDTO](PaginationDTO.md)

## Example

```typescript
import type { EnvironmentRunsDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "runs": null,
  "pagination": null,
} satisfies EnvironmentRunsDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EnvironmentRunsDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


