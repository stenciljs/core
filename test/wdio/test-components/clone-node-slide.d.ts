import type { Components, JSX } from "../dist/types/components";

interface CloneNodeSlide extends Components.CloneNodeSlide, HTMLElement {}
export const CloneNodeSlide: {
    prototype: CloneNodeSlide;
    new (): CloneNodeSlide;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
