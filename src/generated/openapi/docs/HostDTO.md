
# HostDTO


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`ipAddress` | string
`os` | string
`osVersion` | string
`cpuModel` | string
`cpuCores` | number
`cpuThreads` | number
`ramTotalBytes` | number
`ramSpeedMhz` | number
`ramType` | string

## Example

```typescript
import type { HostDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "ipAddress": null,
  "os": null,
  "osVersion": null,
  "cpuModel": null,
  "cpuCores": null,
  "cpuThreads": null,
  "ramTotalBytes": null,
  "ramSpeedMhz": null,
  "ramType": null,
} satisfies HostDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as HostDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


