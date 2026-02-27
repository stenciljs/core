import type { Components, JSX } from "../dist/types/components";

interface CustomEventRoot extends Components.CustomEventRoot, HTMLElement {}
export const CustomEventRoot: {
    prototype: CustomEventRoot;
    new (): CustomEventRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
