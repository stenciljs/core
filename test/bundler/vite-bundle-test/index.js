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
      let timeoutId;
      let pollInterval;

      const handleDefinitionCheck = () => {
        const isDefined = checkAndSetReady();
        if (isDefined && !resolved) {
          resolved = true;
          console.log('[vite-bundle] Component my-component is now defined');
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
        return isDefined;
      };

      // Use whenDefined with a timeout fallback
      customElements
        .whenDefined('my-component')
        .then(() => {
          handleDefinitionCheck();
        })
        .catch((err) => {
          console.error('[vite-bundle] whenDefined failed:', err);
          // Still check if component is defined despite the error
          handleDefinitionCheck();
        });

      // Timeout fallback - check periodically and set flag
      timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('[vite-bundle] Timeout waiting for component definition, checking anyway');
          handleDefinitionCheck();
        }
      }, 10000); // 10 second timeout

      // Also poll periodically as a backup
      pollInterval = setInterval(() => {
        handleDefinitionCheck();
      }, 100); // Check every 100ms

      // Clean up polling after timeout
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }, 10000);
    }
  } catch (err) {
    window.__STENCIL_COMPONENT_LIBRARY_READY__ = false;
    console.error('[vite-bundle] defineCustomElements failed:', err);
  }
}
