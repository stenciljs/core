import type { Components, JSX } from "../dist/types/components";

interface CustomElementsNoDelegatesFocus extends Components.CustomElementsNoDelegatesFocus, HTMLElement {}
export const CustomElementsNoDelegatesFocus: {
    prototype: CustomElementsNoDelegatesFocus;
    new (): CustomElementsNoDelegatesFocus;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
