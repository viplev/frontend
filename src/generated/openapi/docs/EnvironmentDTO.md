
# EnvironmentDTO


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`description` | string
`type` | string
`token` | string
`agentCommand` | string
`agentLastSeenAt` | Date
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { EnvironmentDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "description": null,
  "type": null,
  "token": null,
  "agentCommand": null,
  "agentLastSeenAt": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies EnvironmentDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EnvironmentDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


