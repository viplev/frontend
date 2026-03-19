
# ServiceDTO


## Properties

Name | Type
------------ | -------------
`id` | string
`serviceName` | string
`imageSha` | string
`imageName` | string
`cpuLimit` | number
`cpuReservation` | number
`memoryLimitBytes` | number
`memoryReservationBytes` | number

## Example

```typescript
import type { ServiceDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "serviceName": null,
  "imageSha": null,
  "imageName": null,
  "cpuLimit": null,
  "cpuReservation": null,
  "memoryLimitBytes": null,
  "memoryReservationBytes": null,
} satisfies ServiceDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ServiceDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


