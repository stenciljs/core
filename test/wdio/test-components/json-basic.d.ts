import type { Components, JSX } from "../dist/types/components";

interface JsonBasic extends Components.JsonBasic, HTMLElement {}
export const JsonBasic: {
    prototype: JsonBasic;
    new (): JsonBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
