import type { Components, JSX } from "../dist/types/components";

interface AutoLoaderChild extends Components.AutoLoaderChild, HTMLElement {}
export const AutoLoaderChild: {
    prototype: AutoLoaderChild;
    new (): AutoLoaderChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
