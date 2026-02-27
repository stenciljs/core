import type { Components, JSX } from "../dist/types/components";

interface DomReattachClone extends Components.DomReattachClone, HTMLElement {}
export const DomReattachClone: {
    prototype: DomReattachClone;
    new (): DomReattachClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
