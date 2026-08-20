# ssr-order-wrap-cmp



<!-- Auto Generated Below -->


## `part-ssr-shadow-cmp`

### Properties

| Property   | Attribute  | Description | Type      | Default     |
| ---------- | ---------- | ----------- | --------- | ----------- |
| `selected` | `selected` |             | `boolean` | `undefined` |


### Slots

| Slot            | Description      |
| --------------- | ---------------- |
|                 | The default slot |
| `"client-only"` |                  |
| `"top"`         |                  |


### Shadow Parts

| Part          | Description |
| ------------- | ----------- |
| `"container"` |             |


### Dependencies

### Used by

 - [part-wrap-ssr-shadow-cmp](.)

### Graph
```mermaid
graph TD;
  part-wrap-ssr-shadow-cmp --> part-ssr-shadow-cmp
  style part-ssr-shadow-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `part-wrap-ssr-shadow-cmp`

### Properties

| Property   | Attribute  | Description | Type      | Default     |
| ---------- | ---------- | ----------- | --------- | ----------- |
| `selected` | `selected` |             | `boolean` | `undefined` |


### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


### Dependencies

### Depends on

- [part-ssr-shadow-cmp](.)

### Graph
```mermaid
graph TD;
  part-wrap-ssr-shadow-cmp --> part-ssr-shadow-cmp
  style part-wrap-ssr-shadow-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `scoped-ssr-child-cmp`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


### Dependencies

### Used by

 - [shadow-ssr-parent-cmp](.)

### Graph
```mermaid
graph TD;
  shadow-ssr-parent-cmp --> scoped-ssr-child-cmp
  style scoped-ssr-child-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `scoped-ssr-parent-cmp`

### Slots

| Slot       | Description      |
| ---------- | ---------------- |
|            | The default slot |
| `"things"` |                  |


### Dependencies

### Depends on

- [shadow-ssr-child-cmp](.)

### Graph
```mermaid
graph TD;
  scoped-ssr-parent-cmp --> shadow-ssr-child-cmp
  shadow-ssr-child-cmp --> ssr-order-cmp
  style scoped-ssr-parent-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `shadow-ssr-child-cmp`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


### Dependencies

### Used by

 - [scoped-ssr-parent-cmp](.)

### Depends on

- [ssr-order-cmp](.)

### Graph
```mermaid
graph TD;
  shadow-ssr-child-cmp --> ssr-order-cmp
  scoped-ssr-parent-cmp --> shadow-ssr-child-cmp
  style shadow-ssr-child-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `shadow-ssr-parent-cmp`

### Slots

| Slot       | Description      |
| ---------- | ---------------- |
|            | The default slot |
| `"things"` |                  |


### Dependencies

### Depends on

- [scoped-ssr-child-cmp](.)

### Graph
```mermaid
graph TD;
  shadow-ssr-parent-cmp --> scoped-ssr-child-cmp
  style shadow-ssr-parent-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `slow-ssr-prop`

### Properties

| Property  | Attribute | Description | Type       | Default |
| --------- | --------- | ----------- | ---------- | ------- |
| `anArray` | --        |             | `string[]` | `[]`    |



## `ssr-order-cmp`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


### Dependencies

### Used by

 - [shadow-ssr-child-cmp](.)
 - [ssr-order-wrap-cmp](.)

### Graph
```mermaid
graph TD;
  shadow-ssr-child-cmp --> ssr-order-cmp
  ssr-order-wrap-cmp --> ssr-order-cmp
  style ssr-order-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `ssr-order-wrap-cmp`

### Slots

| Slot       | Description      |
| ---------- | ---------------- |
|            | The default slot |
| `"things"` |                  |


### Dependencies

### Depends on

- [ssr-order-cmp](.)

### Graph
```mermaid
graph TD;
  ssr-order-wrap-cmp --> ssr-order-cmp
  style ssr-order-wrap-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
