import type { Components, JSX } from "../dist/types/components";

interface DomReattach extends Components.DomReattach, HTMLElement {}
export const DomReattach: {
    prototype: DomReattach;
    new (): DomReattach;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
