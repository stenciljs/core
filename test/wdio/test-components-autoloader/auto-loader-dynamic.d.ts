import type { Components, JSX } from "../dist/types/components";

interface AutoLoaderDynamic extends Components.AutoLoaderDynamic, HTMLElement {}
export const AutoLoaderDynamic: {
    prototype: AutoLoaderDynamic;
    new (): AutoLoaderDynamic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
