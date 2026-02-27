import type { Components, JSX } from "../dist/types/components";

interface ScopedConditional extends Components.ScopedConditional, HTMLElement {}
export const ScopedConditional: {
    prototype: ScopedConditional;
    new (): ScopedConditional;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
