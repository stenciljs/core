import type { Components, JSX } from "../dist/types/components";

interface CustomElementRoot extends Components.CustomElementRoot, HTMLElement {}
export const CustomElementRoot: {
    prototype: CustomElementRoot;
    new (): CustomElementRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
