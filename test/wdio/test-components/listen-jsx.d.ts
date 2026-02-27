import type { Components, JSX } from "../dist/types/components";

interface ListenJsx extends Components.ListenJsx, HTMLElement {}
export const ListenJsx: {
    prototype: ListenJsx;
    new (): ListenJsx;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
