# shadow-wrapper



<!-- Auto Generated Below -->


## `hydrated-sibling-accessors`

### Slots

| Slot            | Description      |
| --------------- | ---------------- |
|                 | The default slot |
| `"second-slot"` |                  |



## `non-shadow-child`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |



## `non-shadow-forwarded-slot`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


### Dependencies

### Depends on

- [shadow-child](.)

### Graph
```mermaid
graph TD;
  non-shadow-forwarded-slot --> shadow-child
  style non-shadow-forwarded-slot fill:#f9f,stroke:#333,stroke-width:4px
```


## `non-shadow-multi-slots`

### Slots

| Slot            | Description      |
| --------------- | ---------------- |
|                 | The default slot |
| `"second-slot"` |                  |



## `non-shadow-wrapper`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |



## `shadow-child`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |


### Dependencies

### Used by

 - [non-shadow-forwarded-slot](.)

### Graph
```mermaid
graph TD;
  non-shadow-forwarded-slot --> shadow-child
  style shadow-child fill:#f9f,stroke:#333,stroke-width:4px
```


## `shadow-wrapper`

### Slots

| Slot | Description      |
| ---- | ---------------- |
|      | The default slot |



----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
