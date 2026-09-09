# ion-parent



<!-- Auto Generated Below -->


## `ion-child`

### Dependencies

### Used by

 - [ion-parent](.)

### Graph
```mermaid
graph TD;
  ion-parent --> ion-child
  style ion-child fill:#f9f,stroke:#333,stroke-width:4px
```


## `ion-host`

### Dependencies

### Depends on

- [ion-parent](.)

### Graph
```mermaid
graph TD;
  ion-host --> ion-parent
  ion-parent --> ion-child
  style ion-host fill:#f9f,stroke:#333,stroke-width:4px
```


## `ion-parent`

### Dependencies

### Used by

 - [ion-host](.)

### Depends on

- [ion-child](.)

### Graph
```mermaid
graph TD;
  ion-parent --> ion-child
  ion-host --> ion-parent
  style ion-parent fill:#f9f,stroke:#333,stroke-width:4px
```


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
