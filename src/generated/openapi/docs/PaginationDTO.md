
# PaginationDTO

Pagination metadata for paginated responses

## Properties

Name | Type
------------ | -------------
`page` | number
`size` | number
`totalElements` | number
`totalPages` | number

## Example

```typescript
import type { PaginationDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "page": null,
  "size": null,
  "totalElements": null,
  "totalPages": null,
} satisfies PaginationDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginationDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


