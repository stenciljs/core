import type { Components, JSX } from "../dist/types/components";

interface AsyncRerender extends Components.AsyncRerender, HTMLElement {}
export const AsyncRerender: {
    prototype: AsyncRerender;
    new (): AsyncRerender;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
