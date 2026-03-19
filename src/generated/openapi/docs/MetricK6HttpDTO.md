
# MetricK6HttpDTO


## Properties

Name | Type
------------ | -------------
`id` | string
`collectedAt` | Date
`url` | string
`httpMethod` | string
`requestGroup` | string
`httpStatus` | number
`expectedStatus` | number
`dataReceivedByte` | number
`dataSentByte` | number
`httpReqDurationMs` | number
`httpReqWaitingMs` | number

## Example

```typescript
import type { MetricK6HttpDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "collectedAt": null,
  "url": null,
  "httpMethod": null,
  "requestGroup": null,
  "httpStatus": null,
  "expectedStatus": null,
  "dataReceivedByte": null,
  "dataSentByte": null,
  "httpReqDurationMs": null,
  "httpReqWaitingMs": null,
} satisfies MetricK6HttpDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MetricK6HttpDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


