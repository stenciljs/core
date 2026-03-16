# custom-states-cmp



<!-- Auto Generated Below -->


## Methods

### `hasState(stateName: string) => Promise<boolean>`

Check if a custom state is currently set

#### Parameters

| Name        | Type     | Description                    |
| ----------- | -------- | ------------------------------ |
| `stateName` | `string` | the name of the state to check |

#### Returns

Type: `Promise<boolean>`

true if the state is set, false otherwise

### `toggleState(stateName: string, force?: boolean) => Promise<void>`

Toggle a custom state on or off

#### Parameters

| Name        | Type      | Description                                                  |
| ----------- | --------- | ------------------------------------------------------------ |
| `stateName` | `string`  | the name of the state to toggle                              |
| `force`     | `boolean` | optional boolean to force the state on (true) or off (false) |

#### Returns

Type: `Promise<void>`




## Custom States

| State              | Initial Value | Description |
| ------------------ | ------------- | ----------- |
| `:state(active)`   | `false`       |             |
| `:state(disabled)` | `false`       |             |
| `:state(open)`     | `true`        |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
