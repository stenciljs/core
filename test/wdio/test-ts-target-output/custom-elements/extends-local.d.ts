import type { Components, JSX } from "../../dist/types/components";

interface ExtendsLocal extends Components.ExtendsLocal, HTMLElement {}
export const ExtendsLocal: {
    prototype: ExtendsLocal;
    new (): ExtendsLocal;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
