import type { Components, JSX } from "../dist/types/components";

interface GlobalStyles extends Components.GlobalStyles, HTMLElement {}
export const GlobalStyles: {
    prototype: GlobalStyles;
    new (): GlobalStyles;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
