# extends-reactive-controller-plain-cmp



<!-- Auto Generated Below -->


## Overview

Regression fixture for the `isPlain` fast-path optimization: this component has no props,
state, methods, listeners, or JSX in `render()` (it returns a plain string), so it would be
wrongly classified `isPlain: true` if `ReactiveControllerHost`'s inherited lifecycle methods
weren't accounted for - the native fast path would replace `connectedCallback` outright and
the controller's `hostConnected` would never fire.

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
