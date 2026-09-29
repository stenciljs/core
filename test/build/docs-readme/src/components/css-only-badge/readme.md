# css-only-badge



<!-- Auto Generated Below -->


## Overview

A CSS-only badge - no JS class, no shadow DOM, never registered via `customElements.define()`. Verifies the generated docs-readme output for this kind of component: description, Properties table, and CSS Custom Properties table.

## Properties

| Attribute     | Description                         | Type                                     | Default |
| ------------- | ----------------------------------- | ---------------------------------------- | ------- |
| `dismissible` | Whether the badge can be dismissed. | `boolean`                                | --      |
| `variant`     |                                     | `"danger" \| "warning" \| (string & {})` | --      |


## Slots

| Slot           | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
|                | The badge's label.                                                 |
| `"icon-end"`   | Content shown after the label.                                     |
| `"icon-start"` | Content shown before the label - gazumps the inline comment below. |


## CSS Custom Properties

| Name              | Description             |
| ----------------- | ----------------------- |
| `--badge-color`   | The badge's text color. |
| `--badge-padding` | Inner spacing.          |
| `--badge-radius`  | Corner radius.          |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
