import type { Components, JSX } from "../dist/types/components";

interface CustomSvgElement extends Components.CustomSvgElement, HTMLElement {}
export const CustomSvgElement: {
    prototype: CustomSvgElement;
    new (): CustomSvgElement;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
