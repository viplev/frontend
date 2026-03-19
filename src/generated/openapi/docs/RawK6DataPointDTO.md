
# RawK6DataPointDTO

A single K6 data point at a given timestamp

## Properties

Name | Type
------------ | -------------
`timestamp` | Date
`httpResponseTimeMs` | number
`httpWaitingMs` | number
`vus` | number

## Example

```typescript
import type { RawK6DataPointDTO } from ''

// TODO: Update the object below with actual values
const example = {
  "timestamp": null,
  "httpResponseTimeMs": null,
  "httpWaitingMs": null,
  "vus": null,
} satisfies RawK6DataPointDTO

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RawK6DataPointDTO
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


