import type { Components, JSX } from "../dist/types/components";

interface SvgClass extends Components.SvgClass, HTMLElement {}
export const SvgClass: {
    prototype: SvgClass;
    new (): SvgClass;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
