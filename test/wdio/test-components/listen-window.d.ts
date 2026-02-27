import type { Components, JSX } from "../dist/types/components";

interface ListenWindow extends Components.ListenWindow, HTMLElement {}
export const ListenWindow: {
    prototype: ListenWindow;
    new (): ListenWindow;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
