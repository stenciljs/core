import type { Components, JSX } from "../dist/types/components";

interface ExternalImportC extends Components.ExternalImportC, HTMLElement {}
export const ExternalImportC: {
    prototype: ExternalImportC;
    new (): ExternalImportC;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
