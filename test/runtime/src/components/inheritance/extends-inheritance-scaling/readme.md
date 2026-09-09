# inheritance-text-input



<!-- Auto Generated Below -->


## `inheritance-checkbox-group`

### Events

| Event         | Description | Type                    |
| ------------- | ----------- | ----------------------- |
| `valueChange` |             | `CustomEvent<string[]>` |


### Dependencies

### Used by

 - [inheritance-scaling-demo](.)

### Graph
```mermaid
graph TD;
  inheritance-scaling-demo --> inheritance-checkbox-group
  style inheritance-checkbox-group fill:#f9f,stroke:#333,stroke-width:4px
```


## `inheritance-radio-group`

### Events

| Event         | Description | Type                  |
| ------------- | ----------- | --------------------- |
| `valueChange` |             | `CustomEvent<string>` |


### Dependencies

### Used by

 - [inheritance-scaling-demo](.)

### Graph
```mermaid
graph TD;
  inheritance-scaling-demo --> inheritance-radio-group
  style inheritance-radio-group fill:#f9f,stroke:#333,stroke-width:4px
```


## `inheritance-scaling-demo`

### Overview

Main component that demonstrates inheritance-based scaling
with 3 components and 2 controllers (ValidationController and FocusController)

### Dependencies

### Depends on

- [inheritance-text-input](.)
- [inheritance-radio-group](.)
- [inheritance-checkbox-group](.)

### Graph
```mermaid
graph TD;
  inheritance-scaling-demo --> inheritance-text-input
  inheritance-scaling-demo --> inheritance-radio-group
  inheritance-scaling-demo --> inheritance-checkbox-group
  style inheritance-scaling-demo fill:#f9f,stroke:#333,stroke-width:4px
```


## `inheritance-text-input`

### Dependencies

### Used by

 - [inheritance-scaling-demo](.)

### Graph
```mermaid
graph TD;
  inheritance-scaling-demo --> inheritance-text-input
  style inheritance-text-input fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
