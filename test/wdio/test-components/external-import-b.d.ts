import type { Components, JSX } from "../dist/types/components";

interface ExternalImportB extends Components.ExternalImportB, HTMLElement {}
export const ExternalImportB: {
    prototype: ExternalImportB;
    new (): ExternalImportB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
