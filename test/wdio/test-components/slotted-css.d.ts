import type { Components, JSX } from "../dist/types/components";

interface SlottedCss extends Components.SlottedCss, HTMLElement {}
export const SlottedCss: {
    prototype: SlottedCss;
    new (): SlottedCss;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
