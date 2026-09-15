# slow-fetch-cmp



<!-- Auto Generated Below -->


## Overview

Used by hydrate-timeout.e2e.ts to reproduce stenciljs/core#6864: a
component whose `componentWillLoad` is still awaiting `fetch()` when the
render's `opts.timeout` fires.

## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `url`    | `url`     |             | `string` | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
