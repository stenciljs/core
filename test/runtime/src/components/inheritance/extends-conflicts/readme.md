# extends-conflicts



<!-- Auto Generated Below -->


## Overview

Tests conflict resolution when component has duplicate

## Properties

| Property        | Attribute        | Description | Type     | Default                  |
| --------------- | ---------------- | ----------- | -------- | ------------------------ |
| `baseOnlyProp`  | `base-only-prop` |             | `string` | `'base only prop value'` |
| `duplicateProp` | `duplicate-prop` |             | `string` | `'component prop value'` |


## Methods

### `baseOnlyMethod() => Promise<string>`

Non-duplicate method for comparison

#### Returns

Type: `Promise<string>`



### `duplicateMethod() => Promise<string>`

Duplicate method - same name as base, should override
Component version should be called, not base version

#### Returns

Type: `Promise<string>`



### `getComponentMethodCallLog() => Promise<string[]>`

Method to get component method call log

#### Returns

Type: `Promise<string[]>`



### `getMethodCallLog() => Promise<string[]>`

Method to get the call log for testing

#### Returns

Type: `Promise<string[]>`



### `resetComponentMethodCallLog() => Promise<void>`

Method to reset component call log

#### Returns

Type: `Promise<void>`



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



### `updateDuplicateState(value: string) => Promise<void>`

Method to update duplicate state for testing

#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `value` | `string` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
