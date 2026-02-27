import type { Components, JSX } from "../dist/types/components";

interface ListenReattach extends Components.ListenReattach, HTMLElement {}
export const ListenReattach: {
    prototype: ListenReattach;
    new (): ListenReattach;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
