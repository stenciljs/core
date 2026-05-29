# slot-list-light-root



<!-- Auto Generated Below -->


## `slot-dynamic-shadow-list`

### Properties

| Property | Attribute | Description | Type       | Default |
| -------- | --------- | ----------- | ---------- | ------- |
| `items`  | --        |             | `string[]` | `[]`    |


### Dependencies

### Used by

 - [slot-list-light-root](.)

### Depends on

- [slot-light-list](.)

### Graph
```mermaid
graph TD;
  slot-dynamic-shadow-list --> slot-light-list
  slot-list-light-root --> slot-dynamic-shadow-list
  style slot-dynamic-shadow-list fill:#f9f,stroke:#333,stroke-width:4px
```


## `slot-light-list`

### Dependencies

### Used by

 - [slot-dynamic-shadow-list](.)

### Graph
```mermaid
graph TD;
  slot-dynamic-shadow-list --> slot-light-list
  style slot-light-list fill:#f9f,stroke:#333,stroke-width:4px
```


## `slot-list-light-root`

### Properties

| Property | Attribute | Description | Type       | Default |
| -------- | --------- | ----------- | ---------- | ------- |
| `items`  | --        |             | `string[]` | `[]`    |


### Dependencies

### Depends on

- [slot-dynamic-shadow-list](.)

### Graph
```mermaid
graph TD;
  slot-list-light-root --> slot-dynamic-shadow-list
  slot-dynamic-shadow-list --> slot-light-list
  style slot-list-light-root fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
