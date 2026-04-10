# sibling-with-mixin



<!-- Auto Generated Below -->


## Overview

A component that uses a mixin factory pattern internally.
This tests the scenario where a consumer project imports and renders a component
from an external library, and that component internally uses a mixin pattern.
The mixin's decorated members should be properly merged and reactive.

Used as the extendedTag in tests - renders `.extended-*` elements with mixin defaults.

## Properties

| Property     | Attribute     | Description | Type     | Default                    |
| ------------ | ------------- | ----------- | -------- | -------------------------- |
| `getterProp` | `getter-prop` |             | `string` | `'getter default value'`   |
| `prop1`      | `prop-1`      |             | `string` | `'ExtendedCmp text'`       |
| `prop2`      | `prop-2`      |             | `string` | `'ExtendedCmp prop2 text'` |


## Methods

### `method1() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `method2() => Promise<void>`



#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
