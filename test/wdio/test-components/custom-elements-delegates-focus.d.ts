import type { Components, JSX } from "../dist/types/components";

interface CustomElementsDelegatesFocus extends Components.CustomElementsDelegatesFocus, HTMLElement {}
export const CustomElementsDelegatesFocus: {
    prototype: CustomElementsDelegatesFocus;
    new (): CustomElementsDelegatesFocus;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
