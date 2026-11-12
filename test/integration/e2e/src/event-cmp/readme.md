# event-cmp



<!-- Auto Generated Below -->


## Events

| Event                   | Description | Type                            |
| ----------------------- | ----------- | ------------------------------- |
| `my-event-with-options` |             | `CustomEvent<{ mph: number; }>` |
| `myDocumentEvent`       |             | `CustomEvent<any>`              |
| `myWindowEvent`         |             | `CustomEvent<number>`           |


## Methods

### `methodThatFiresEventWithOptions(mph: number) => Promise<void>`

this is some method that fires an event with options

#### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `mph` | `number` | some value  |

#### Returns

Type: `Promise<void>`



### `methodThatFiresMyDocumentEvent() => Promise<void>`

this is some method that fires a document event

#### Returns

Type: `Promise<void>`



### `methodThatFiresMyWindowEvent(value: number) => Promise<void>`

this is some method that fires a window event

#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `value` | `number` | some value  |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
