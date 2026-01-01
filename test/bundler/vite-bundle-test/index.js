import { defineCustomElements } from 'component-library/loader';

// defineCustomElements is synchronous, but components load asynchronously
// Use customElements.whenDefined() to wait for the component to be ready
if (typeof window !== 'undefined') {
  try {
    defineCustomElements();

    // Function to check and set readiness flag
    const checkAndSetReady = () => {
      const isDefined = !!customElements.get('my-component');
      window.__STENCIL_COMPONENT_LIBRARY_READY__ = isDefined;
      return isDefined;
    };

    // Check if component is already defined (might happen if loaded synchronously)
    if (checkAndSetReady()) {
      // Component already defined, we're done
      console.log('[vite-bundle] Component my-component already defined');
    } else {
      // Wait for the component to be defined
      let resolved = false;
      const setReady = () => {
        if (!resolved) {
          resolved = true;
          const isDefined = checkAndSetReady();
          if (isDefined) {
            console.log('[vite-bundle] Component my-component is now defined');
          } else {
            console.warn('[vite-bundle] Component my-component still not defined after wait');
          }
        }
      };

      // Use whenDefined with a timeout fallback
      customElements
        .whenDefined('my-component')
        .then(() => {
          setReady();
        })
        .catch((err) => {
          console.error('[vite-bundle] whenDefined failed:', err);
          // Still check if component is defined despite the error
          setReady();
        });

      // Timeout fallback - check periodically and set flag
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('[vite-bundle] Timeout waiting for component definition, checking anyway');
          setReady();
        }
      }, 10000); // 10 second timeout

      // Also poll periodically as a backup
      const pollInterval = setInterval(() => {
        if (checkAndSetReady()) {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          if (!resolved) {
            resolved = true;
            console.log('[vite-bundle] Component my-component defined (via polling)');
          }
        }
      }, 100); // Check every 100ms

      // Clean up polling after timeout
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 10000);
    }
  } catch (err) {
    window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;
    console.error('[vite-bundle] defineCustomElements failed:', err);
  }
}
