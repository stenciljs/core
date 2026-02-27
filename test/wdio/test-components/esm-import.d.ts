import type { Components, JSX } from "../dist/types/components";

interface EsmImport extends Components.EsmImport, HTMLElement {}
export const EsmImport: {
    prototype: EsmImport;
    new (): EsmImport;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
