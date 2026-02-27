import type { Components, JSX } from "../dist/types/components";

interface ListenJsxRoot extends Components.ListenJsxRoot, HTMLElement {}
export const ListenJsxRoot: {
    prototype: ListenJsxRoot;
    new (): ListenJsxRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
