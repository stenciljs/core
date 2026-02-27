import type { Components, JSX } from "../dist/types/components";

interface DynamicImport extends Components.DynamicImport, HTMLElement {}
export const DynamicImport: {
    prototype: DynamicImport;
    new (): DynamicImport;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
