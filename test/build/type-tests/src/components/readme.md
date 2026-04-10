# typed-props



<!-- Auto Generated Below -->


## Overview

A component with various typed props for testing JSX type inference.

## Properties

| Property                   | Attribute           | Description               | Type                                            | Default     |
| -------------------------- | ------------------- | ------------------------- | ----------------------------------------------- | ----------- |
| `arrProp`                  | --                  | Array prop                | `string[] \| undefined`                         | `undefined` |
| `boolOptional`             | `bool-optional`     | Optional boolean prop     | `boolean \| undefined`                          | `undefined` |
| `boolWithDefault`          | `bool-with-default` | Boolean prop with default | `boolean`                                       | `false`     |
| `numOptional`              | `num-optional`      | Optional number prop      | `number \| undefined`                           | `undefined` |
| `numWithDefault`           | `num-with-default`  | Number prop with default  | `number`                                        | `42`        |
| `objProp`                  | --                  | Object prop               | `undefined \| { name: string; value: number; }` | `undefined` |
| `strOptional`              | `str-optional`      | Optional string prop      | `string \| undefined`                           | `undefined` |
| `strRequired` _(required)_ | `str-required`      | Required string prop      | `string`                                        | `undefined` |
| `strWithDefault`           | `str-with-default`  | String prop with default  | `string`                                        | `'hello'`   |
| `unionProp`                | `union-prop`        | Union type prop           | `"large" \| "medium" \| "small" \| undefined`   | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
