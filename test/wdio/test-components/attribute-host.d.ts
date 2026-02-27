import type { Components, JSX } from "../dist/types/components";

interface AttributeHost extends Components.AttributeHost, HTMLElement {}
export const AttributeHost: {
    prototype: AttributeHost;
    new (): AttributeHost;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
