import { defineCustomElements } from 'component-library/loader';

// defineCustomElements is async - it awaits globalScripts() before defining components
// We need to await it to ensure components are defined before setting the readiness flag
if (typeof window !== 'undefined') {
  // Initialize the flag to false
  window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;

  // Use an async IIFE to properly await defineCustomElements
  (async () => {
    try {
      // Await defineCustomElements to ensure components are actually defined
      // Pass window and empty options object as expected by the loader
      await defineCustomElements(window, {});

      // After defineCustomElements completes, components should be defined
      // Verify and set the readiness flag
      const isDefined = !!customElements.get('my-component');
      window.__STENCIL_COMPONENT_LIBRARY_READY__ = isDefined;

      if (isDefined) {
        console.log('[vite-bundle] Component my-component is now defined');
      } else {
        console.warn('[vite-bundle] Component my-component still not defined after defineCustomElements');
        // Fallback: wait for component definition
        try {
          await customElements.whenDefined('my-component');
          window.__STENCIL_COMPONENT_LIBRARY_READY__ = true;
          console.log('[vite-bundle] Component my-component defined via whenDefined');
        } catch (err) {
          console.error('[vite-bundle] whenDefined failed:', err);
        }
      }
    } catch (err) {
      window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;
      console.error('[vite-bundle] defineCustomElements failed:', err);
    }
  })();
}
