import { defineCustomElements } from 'component-library/loader';

// defineCustomElements is synchronous, but components load asynchronously
// Use customElements.whenDefined() to wait for the component to be ready
if (typeof window !== 'undefined') {
  try {
    defineCustomElements();
    // Check if component is already defined (might happen if loaded synchronously)
    if (customElements.get('my-component')) {
      window.__STENCIL_COMPONENT_LIBRARY_READY__ = true;
    } else {
      // Wait for the component to be defined, then set the readiness flag
      customElements
        .whenDefined('my-component')
        .then(() => {
          window.__STENCIL_COMPONENT_LIBRARY_READY__ = true;
        })
        .catch((err) => {
          window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;
          console.error('Failed to define custom element', err);
        });
    }
  } catch (err) {
    window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;
    console.error('defineCustomElements failed', err);
  }
}
