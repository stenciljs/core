# lifecycle-unload-root



<!-- Auto Generated Below -->


## `lifecycle-unload-a`

### Dependencies

### Used by

 - [lifecycle-unload-root](.)

### Depends on

- [lifecycle-unload-b](.)

### Graph
```mermaid
graph TD;
  lifecycle-unload-a --> lifecycle-unload-b
  lifecycle-unload-root --> lifecycle-unload-a
  style lifecycle-unload-a fill:#f9f,stroke:#333,stroke-width:4px
```


## `lifecycle-unload-b`

### Dependencies

### Used by

 - [lifecycle-unload-a](.)

### Graph
```mermaid
graph TD;
  lifecycle-unload-a --> lifecycle-unload-b
  style lifecycle-unload-b fill:#f9f,stroke:#333,stroke-width:4px
```


## `lifecycle-unload-root`

### Dependencies

### Depends on

- [lifecycle-unload-a](.)

### Graph
```mermaid
graph TD;
  lifecycle-unload-root --> lifecycle-unload-a
  lifecycle-unload-a --> lifecycle-unload-b
  style lifecycle-unload-root fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
