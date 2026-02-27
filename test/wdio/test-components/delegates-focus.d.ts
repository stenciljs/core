import type { Components, JSX } from "../dist/types/components";

interface DelegatesFocus extends Components.DelegatesFocus, HTMLElement {}
export const DelegatesFocus: {
    prototype: DelegatesFocus;
    new (): DelegatesFocus;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
