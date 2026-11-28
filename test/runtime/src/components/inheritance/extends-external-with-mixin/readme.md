# extends-external-with-mixin



<!-- Auto Generated Below -->


## Overview

A component that extends from an external library's component which itself uses a mixin pattern.
This tests Bug A: a project importing/rendering from a lib whose component utilises a mixin/abstract
class pattern - the decorated class members should be properly merged and have reactivity.

## Properties

| Property     | Attribute     | Description | Type     | Default                    |
| ------------ | ------------- | ----------- | -------- | -------------------------- |
| `getterProp` | `getter-prop` |             | `string` | `'getter default value'`   |
| `prop1`      | `prop-1`      |             | `string` | `'default text'`           |
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
