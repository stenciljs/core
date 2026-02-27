import type { Components, JSX } from "../dist/types/components";

interface CustomElementNestedChild extends Components.CustomElementNestedChild, HTMLElement {}
export const CustomElementNestedChild: {
    prototype: CustomElementNestedChild;
    new (): CustomElementNestedChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
