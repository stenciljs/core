# composition-text-input



<!-- Auto Generated Below -->


## `composition-checkbox-group`

### Events

| Event         | Description | Type                    |
| ------------- | ----------- | ----------------------- |
| `valueChange` |             | `CustomEvent<string[]>` |


### Dependencies

### Used by

 - [composition-scaling-demo](.)

### Graph
```mermaid
graph TD;
  composition-scaling-demo --> composition-checkbox-group
  style composition-checkbox-group fill:#f9f,stroke:#333,stroke-width:4px
```


## `composition-radio-group`

### Events

| Event         | Description | Type                  |
| ------------- | ----------- | --------------------- |
| `valueChange` |             | `CustomEvent<string>` |


### Dependencies

### Used by

 - [composition-scaling-demo](.)

### Graph
```mermaid
graph TD;
  composition-scaling-demo --> composition-radio-group
  style composition-radio-group fill:#f9f,stroke:#333,stroke-width:4px
```


## `composition-scaling-demo`

### Overview

Main component that demonstrates composition-based scaling
with 3 components and 2 controllers (ValidationController and FocusController)

### Dependencies

### Depends on

- [composition-text-input](.)
- [composition-radio-group](.)
- [composition-checkbox-group](.)

### Graph
```mermaid
graph TD;
  composition-scaling-demo --> composition-text-input
  composition-scaling-demo --> composition-radio-group
  composition-scaling-demo --> composition-checkbox-group
  style composition-scaling-demo fill:#f9f,stroke:#333,stroke-width:4px
```


## `composition-text-input`

### Dependencies

### Used by

 - [composition-scaling-demo](.)

### Graph
```mermaid
graph TD;
  composition-scaling-demo --> composition-text-input
  style composition-text-input fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
