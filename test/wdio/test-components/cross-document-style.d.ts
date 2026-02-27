import type { Components, JSX } from "../dist/types/components";

interface CrossDocumentStyle extends Components.CrossDocumentStyle, HTMLElement {}
export const CrossDocumentStyle: {
    prototype: CrossDocumentStyle;
    new (): CrossDocumentStyle;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
