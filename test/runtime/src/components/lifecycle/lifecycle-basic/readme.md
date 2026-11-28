# lifecycle-basic-c



<!-- Auto Generated Below -->


## `lifecycle-basic-a`

### Dependencies

### Depends on

- [lifecycle-basic-b](.)

### Graph
```mermaid
graph TD;
  lifecycle-basic-a --> lifecycle-basic-b
  lifecycle-basic-b --> lifecycle-basic-c
  style lifecycle-basic-a fill:#f9f,stroke:#333,stroke-width:4px
```


## `lifecycle-basic-b`

### Properties

| Property | Attribute | Description | Type     | Default |
| -------- | --------- | ----------- | -------- | ------- |
| `value`  | `value`   |             | `string` | `''`    |


### Events

| Event             | Description | Type               |
| ----------------- | ----------- | ------------------ |
| `lifecycleLoad`   |             | `CustomEvent<any>` |
| `lifecycleUpdate` |             | `CustomEvent<any>` |


### Dependencies

### Used by

 - [lifecycle-basic-a](.)

### Depends on

- [lifecycle-basic-c](.)

### Graph
```mermaid
graph TD;
  lifecycle-basic-b --> lifecycle-basic-c
  lifecycle-basic-a --> lifecycle-basic-b
  style lifecycle-basic-b fill:#f9f,stroke:#333,stroke-width:4px
```


## `lifecycle-basic-c`

### Properties

| Property | Attribute | Description | Type     | Default |
| -------- | --------- | ----------- | -------- | ------- |
| `value`  | `value`   |             | `string` | `''`    |


### Events

| Event             | Description | Type               |
| ----------------- | ----------- | ------------------ |
| `lifecycleLoad`   |             | `CustomEvent<any>` |
| `lifecycleUpdate` |             | `CustomEvent<any>` |


### Dependencies

### Used by

 - [lifecycle-basic-b](.)

### Graph
```mermaid
graph TD;
  lifecycle-basic-b --> lifecycle-basic-c
  style lifecycle-basic-c fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
