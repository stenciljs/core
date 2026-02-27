import type { Components, JSX } from "../dist/types/components";

interface InitCssRoot extends Components.InitCssRoot, HTMLElement {}
export const InitCssRoot: {
    prototype: InitCssRoot;
    new (): InitCssRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
