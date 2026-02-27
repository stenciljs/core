import type { Components, JSX } from "../dist/types/components";

interface ExternalImportA extends Components.ExternalImportA, HTMLElement {}
export const ExternalImportA: {
    prototype: ExternalImportA;
    new (): ExternalImportA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
