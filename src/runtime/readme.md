## Lifecycle Order Of Operations

Component lifecycle events fire `componentWillLoad` from top to bottom, then fire `componentDidLoad` from bottom to top. It should take into account each component can finish lazy-loaded requests in any random order. Additionally, any `componentWillLoad` can return a promise that all child components should wait on until it's resolved, while still keeping the correct firing order.

```
<cmp-a>
  <cmp-b>
    <cmp-c></cmp-c>
  </cmp-b>
</cmp-a>

cmp-a - componentWillLoad
cmp-b - componentWillLoad
cmp-c - componentWillLoad
cmp-c - componentDidLoad
cmp-b - componentDidLoad
cmp-a - componentDidLoad
```


## Hydrated CSS Visibility

By default, components are assigned `visibility: hidden` using their tag name as the css selector. Therefore, before the components and their descendants have finished hydrating, each component is hidden by default. This is done to prevent janky flickering as components hydrate asynchronously. As each component fully loads the `hydrated` css class is then added.

The `hydrated` css class that's added to the component assigns `visibility: inherit` style to the element. If any parent component is still hydrating then this component will not show until the top most component has added the `hydrated` css class.



## Lifecycle Process

- **Connect**: Synchronously within `connectedCallback`, each component looks for an ancestor component and adds itself as a child component if an ancestor is found.

  - Climb up the parent elements with a while loop.

  - Stop at the first element that has an `s-init` function.

  - If the ancestor component we found hasn't ran its lifecycle update yet, then add this component to the ancestor's `s-al` set. The `s-al` is a set of child components that are actively loading.

  - If no ancestor component is found then continue without the component setting an ancestor component.


- **Initialize Component**: Initialize the component for the first time within `initializeComponent`.

  - If the component has already initialized loading then do nothing. Data to know if the component has started to initialize is in the host ref data, which ensures it doesn't try to initialize more than once.

  - Async request the lazy-loaded component constructor and await the response.

  - After the component implementation constructor request has been received, create a new instance of the component with the lazy-loaded constructor.

  - The constructor will directly wire the host element and lazy-loaded component instance together with the host ref data.

  - If the component has an ancestor component, but the ancestor hasn't ran its lifecycle update yet, then this component should not be initialized at this moment and shouldn't fire its `componentWillLoad` yet. Instead, this component should be added to the ancestor component's array of render callbacks `s-rc`, which would call `initializeComponent` again after its ready. Once the ancestor component has ran its lifecycle update, it'll then call all of its child render callbacks so that the `componentWillLoad` lifecycle events are in the correct order.

  - If there is no ancestor component, or the ancestor component has already rendered, then fire off the first update.

  - When ready, `updateComponent` will be added as an async write task and ran asynchronously.


- **First Update**: The first component update and render from within `updateComponent`.

  - Set the lifecycle ready value `s-lr` to `false` signifying that the lifecycle update is not ready for this component.

  - Fire off `componentWillLoad` lifecycle.

  - Fire off `componentWillRender` lifecycle.

  - Add scoped css data and classes for scoped encapsulation or shadow dom encapsulation without shadow dom browser support.

  - Attach shadow root for shadow dom components.

  - Attach styles to shadow root or document depending on encapsulation.

  - First render.

  - Set the lifecycle ready value `s-lr` to `true` signifying that the lifecycle update has happened and the component is now ready for child component lifecycles.

  - Fire off all of this component's child render callbacks within `s-rc`. Each of the child render callbacks will fire off their own initialize component process.

  - All component descendants should fire `componentWillLoad` lifecycle in the correct order, top to bottom.

  - Fire `postUpdateComponent`. The bottom most component will not have any child render callbacks, so at this point the `componentDidLoad` lifecycle events should start firing from bottom to top.

  - Fire off `componentDidLoad` lifecycle.

  - Fire off `componentDidRender` lifecycle.

  - Add `hydrated` css class signifying the component has finished loading. At this point this component has finished updating.

  - If the component has an ancestor component, then remove this component from its set of actively loading children in `s-al`.

  - After removing this component from the ancestor component's `s-al` set, if the set is now empty then fire the ancestor component's `s-init`.

  - Firing `s-init` on the ancestor component allows the ancestor to complete its first update and fire its own `componentDidLoad` lifecycle event, allowing for `componentDidLoad` lifecycles to fire bottom to top.

  - Fire all `componentOnReady` resolves.


- **Subsequent Updates**: All subsequent component updates and re-renders from within `updateComponent`.

  - Somehow `setValue` is triggered, either through a `Prop` or `State` update, or calling `forceUpdate()` on a component. If there is a change or a forced update, then `setValue` will add `updateComponent` to an async write task.

  - Fire `updateComponent` from async task queue.

  - Fire off `componentWillUpdate` lifecycle.

  - Fire off `componentWillRender` lifecycle.

  - Patch render.

  - Fire `postUpdateComponent`.

  - Fire off `componentDidUpdate` lifecycle.

  - Fire off `componentDidRender` lifecycle.



## Property Descriptions

`s-al`: A component's `Set` of child components that are actively loading.

`s-init`: A function to be called by child components to finish initializing the component.

`s-lr`: The component's lifecycle ready status. `true` if the component has finished its lifecycle update, falsy if it is actively updating and has not fired off either `componentWillLoad` or `componentWillUpdate`.

`s-rc`: A component's array of child component render callbacks. After a component renders, it should then fire off all of its child component render callbacks.