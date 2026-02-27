import type { Components, JSX } from "../dist/types/components";

interface CustomElementChild extends Components.CustomElementChild, HTMLElement {}
export const CustomElementChild: {
    prototype: CustomElementChild;
    new (): CustomElementChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
