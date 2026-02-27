import type { Components, JSX } from "../dist/types/components";

interface MultipleStylesCmp extends Components.MultipleStylesCmp, HTMLElement {}
export const MultipleStylesCmp: {
    prototype: MultipleStylesCmp;
    new (): MultipleStylesCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
