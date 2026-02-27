import type { Components, JSX } from "../dist/types/components";

interface ComplexProperties extends Components.ComplexProperties, HTMLElement {}
export const ComplexProperties: {
    prototype: ComplexProperties;
    new (): ComplexProperties;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
