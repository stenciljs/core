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
      const whenDefinedPromise = customElements.whenDefined('my-component');
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          // Check if component is defined after timeout
          if (customElements.get('my-component')) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, 10000); // 10 second timeout
      });

      Promise.race([whenDefinedPromise, timeoutPromise])
        .then(() => {
          window.__STENCIL_COMPONENT_LIBRARY_READY__ = !!customElements.get('my-component');
        })
        .catch((err) => {
          // Even if whenDefined fails, check if component is defined
          window.__STENCIL_COMPONENT_LIBRARY_READY__ = !!customElements.get('my-component');
          if (!window.__STENCIL_COMPONENT_LIBRARY_READY__) {
            console.error('Failed to define custom element', err);
          }
        });
    }
  } catch (err) {
    window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;
    console.error('defineCustomElements failed', err);
  }
}
