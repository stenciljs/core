import type { Components, JSX } from "../dist/types/components";

interface ImportAliasing extends Components.ImportAliasing, HTMLElement {}
export const ImportAliasing: {
    prototype: ImportAliasing;
    new (): ImportAliasing;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
