import type { Components, JSX } from "../dist/types/components";

interface ExtendsWatch extends Components.ExtendsWatch, HTMLElement {}
export const ExtendsWatch: {
    prototype: ExtendsWatch;
    new (): ExtendsWatch;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
