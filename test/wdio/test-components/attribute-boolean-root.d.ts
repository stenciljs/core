import type { Components, JSX } from "../dist/types/components";

interface AttributeBooleanRoot extends Components.AttributeBooleanRoot, HTMLElement {}
export const AttributeBooleanRoot: {
    prototype: AttributeBooleanRoot;
    new (): AttributeBooleanRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
