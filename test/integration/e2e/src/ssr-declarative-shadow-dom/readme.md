# wrap-ssr-shadow-cmp



<!-- Auto Generated Below -->


## `another-car-detail`

### Properties

| Property | Attribute | Description | Type      | Default     |
| -------- | --------- | ----------- | --------- | ----------- |
| `car`    | `car`     |             | `CarData` | `undefined` |


### Dependencies

### Used by

 - [another-car-list](.)
 - [scoped-car-list](.)

### Graph
```mermaid
graph TD;
  another-car-list --> another-car-detail
  scoped-car-list --> another-car-detail
  style another-car-detail fill:#f9f,stroke:#333,stroke-width:4px
```


## `another-car-list`

### Overview

Component that helps display a list of cars

### Properties

| Property   | Attribute | Description | Type        | Default     |
| ---------- | --------- | ----------- | ----------- | ----------- |
| `cars`     | `cars`    |             | `CarData[]` | `undefined` |
| `selected` | --        |             | `CarData`   | `undefined` |


### Events

| Event         | Description | Type                   |
| ------------- | ----------- | ---------------------- |
| `carSelected` |             | `CustomEvent<CarData>` |


### Slots

| Slot       | Description                      |
| ---------- | -------------------------------- |
| `"header"` | The slot for the header content. |


### Shadow Parts

| Part    | Description                                 |
| ------- | ------------------------------------------- |
| `"car"` | The shadow part to target to style the car. |


### Dependencies

### Depends on

- [another-car-detail](.)

### Graph
```mermaid
graph TD;
  another-car-list --> another-car-detail
  style another-car-list fill:#f9f,stroke:#333,stroke-width:4px
```


## `cmp-dsd`

### Properties

| Property         | Attribute         | Description | Type     | Default |
| ---------------- | ----------------- | ----------- | -------- | ------- |
| `initialCounter` | `initial-counter` |             | `number` | `0`     |



## `nested-cmp-parent`

### Dependencies

### Depends on

- [nested-scope-cmp](.)

### Graph
```mermaid
graph TD;
  nested-cmp-parent --> nested-scope-cmp
  style nested-cmp-parent fill:#f9f,stroke:#333,stroke-width:4px
```


## `nested-scope-cmp`

### Dependencies

### Used by

 - [nested-cmp-parent](.)

### Graph
```mermaid
graph TD;
  nested-cmp-parent --> nested-scope-cmp
  style nested-scope-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `scoped-car-detail`

### Properties

| Property | Attribute | Description | Type      | Default     |
| -------- | --------- | ----------- | --------- | ----------- |
| `car`    | `car`     |             | `CarData` | `undefined` |



## `scoped-car-list`

### Overview

Component that helps display a list of cars

### Properties

| Property   | Attribute | Description | Type        | Default     |
| ---------- | --------- | ----------- | ----------- | ----------- |
| `cars`     | `cars`    |             | `CarData[]` | `undefined` |
| `selected` | --        |             | `CarData`   | `undefined` |


### Events

| Event         | Description | Type                   |
| ------------- | ----------- | ---------------------- |
| `carSelected` |             | `CustomEvent<CarData>` |


### Slots

| Slot       | Description                      |
| ---------- | -------------------------------- |
| `"header"` | The slot for the header content. |


### Shadow Parts

| Part    | Description                                 |
| ------- | ------------------------------------------- |
| `"car"` | The shadow part to target to style the car. |


### Dependencies

### Depends on

- [another-car-detail](.)

### Graph
```mermaid
graph TD;
  scoped-car-list --> another-car-detail
  style scoped-car-list fill:#f9f,stroke:#333,stroke-width:4px
```


## `ssr-shadow-cmp`

### Properties

| Property   | Attribute  | Description | Type      | Default     |
| ---------- | ---------- | ----------- | --------- | ----------- |
| `selected` | `selected` |             | `boolean` | `undefined` |


### Dependencies

### Used by

 - [wrap-ssr-shadow-cmp](.)

### Graph
```mermaid
graph TD;
  wrap-ssr-shadow-cmp --> ssr-shadow-cmp
  style ssr-shadow-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


## `wrap-ssr-shadow-cmp`

### Properties

| Property   | Attribute  | Description | Type      | Default     |
| ---------- | ---------- | ----------- | --------- | ----------- |
| `selected` | `selected` |             | `boolean` | `undefined` |


### Dependencies

### Depends on

- [ssr-shadow-cmp](.)

### Graph
```mermaid
graph TD;
  wrap-ssr-shadow-cmp --> ssr-shadow-cmp
  style wrap-ssr-shadow-cmp fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
