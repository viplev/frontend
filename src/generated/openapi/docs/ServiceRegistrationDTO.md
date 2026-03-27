
# ServiceRegistrationDTO


## Properties

Name | Type
------------ | -------------
`host` | [HostDTO](HostDTO.md)
`services` | [Array&lt;ServiceDTO&gt;](ServiceDTO.md)

## Example

```typescript
import type { ServiceRegistrationDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "host": null,
  "services": null,
} satisfies ServiceRegistrationDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ServiceRegistrationDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


