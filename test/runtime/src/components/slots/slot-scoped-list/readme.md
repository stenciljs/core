# slot-list-light-scoped-root



<!-- Auto Generated Below -->


## `slot-dynamic-scoped-list`

### Properties

| Property | Attribute | Description | Type       | Default |
| -------- | --------- | ----------- | ---------- | ------- |
| `items`  | --        |             | `string[]` | `[]`    |


### Dependencies

### Used by

 - [slot-list-light-scoped-root](.)

### Depends on

- [slot-light-scoped-list](.)

### Graph
```mermaid
graph TD;
  slot-dynamic-scoped-list --> slot-light-scoped-list
  slot-list-light-scoped-root --> slot-dynamic-scoped-list
  style slot-dynamic-scoped-list fill:#f9f,stroke:#333,stroke-width:4px
```


## `slot-light-scoped-list`

### Dependencies

### Used by

 - [slot-dynamic-scoped-list](.)

### Graph
```mermaid
graph TD;
  slot-dynamic-scoped-list --> slot-light-scoped-list
  style slot-light-scoped-list fill:#f9f,stroke:#333,stroke-width:4px
```


## `slot-list-light-scoped-root`

### Properties

| Property | Attribute | Description | Type       | Default |
| -------- | --------- | ----------- | ---------- | ------- |
| `items`  | --        |             | `string[]` | `[]`    |


### Dependencies

### Depends on

- [slot-dynamic-scoped-list](.)

### Graph
```mermaid
graph TD;
  slot-list-light-scoped-root --> slot-dynamic-scoped-list
  slot-dynamic-scoped-list --> slot-light-scoped-list
  style slot-list-light-scoped-root fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
