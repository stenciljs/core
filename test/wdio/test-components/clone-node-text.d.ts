import type { Components, JSX } from "../dist/types/components";

interface CloneNodeText extends Components.CloneNodeText, HTMLElement {}
export const CloneNodeText: {
    prototype: CloneNodeText;
    new (): CloneNodeText;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
