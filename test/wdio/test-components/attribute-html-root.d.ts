import type { Components, JSX } from "../dist/types/components";

interface AttributeHtmlRoot extends Components.AttributeHtmlRoot, HTMLElement {}
export const AttributeHtmlRoot: {
    prototype: AttributeHtmlRoot;
    new (): AttributeHtmlRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
