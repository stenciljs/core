/**
 * Start the auto-loader, scanning the DOM and watching for changes.
 * The loader uses MutationObserver to detect when custom elements are added
 * to the DOM and lazily loads their definitions.
 * @param root - The root element to observe (default: document.body)
 */
export declare function start(root?: Element): void;

/**
 * Stop the auto-loader and disconnect the MutationObserver.
 */
export declare function stop(): void;
