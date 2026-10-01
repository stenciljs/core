# extends-mixed-decorators



<!-- Auto Generated Below -->


## Overview

Tests mixed decorator type conflicts between base class and component.
- Base has

## Properties

| Property         | Attribute          | Description | Type     | Default                  |
| ---------------- | ------------------ | ----------- | -------- | ------------------------ |
| `baseOnlyProp`   | `base-only-prop`   |             | `string` | `'base only prop value'` |
| `mixedStateName` | `mixed-state-name` |             | `string` | `'component prop value'` |


## Methods

### `baseOnlyMethod() => Promise<string>`

Non-conflicting method for comparison

#### Returns

Type: `Promise<string>`



### `getMethodCallLog() => Promise<string[]>`

Method to get the call log for testing

#### Returns

Type: `Promise<string[]>`



### `mixedMethodName() => Promise<string>`

Method that will conflict with

#### Returns

Type: `Promise<string>`



### `resetMethodCallLog() => Promise<void>`

Method to reset call log for testing

#### Returns

Type: `Promise<void>`



### `updateComponentOnlyState(value: string) => Promise<void>`

Method to update component-only state

#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `value` | `string` |             |

#### Returns

Type: `Promise<void>`



### `updateMixedName(value: string) => Promise<void>`

Method to update mixedName state for testing

#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `value` | `string` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
