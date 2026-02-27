import type { Components, JSX } from "../dist/types/components";

interface AutoLoaderRoot extends Components.AutoLoaderRoot, HTMLElement {}
export const AutoLoaderRoot: {
    prototype: AutoLoaderRoot;
    new (): AutoLoaderRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
