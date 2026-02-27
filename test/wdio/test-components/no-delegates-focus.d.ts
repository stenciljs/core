import type { Components, JSX } from "../dist/types/components";

interface NoDelegatesFocus extends Components.NoDelegatesFocus, HTMLElement {}
export const NoDelegatesFocus: {
    prototype: NoDelegatesFocus;
    new (): NoDelegatesFocus;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
