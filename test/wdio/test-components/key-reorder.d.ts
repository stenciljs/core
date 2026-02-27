import type { Components, JSX } from "../dist/types/components";

interface KeyReorder extends Components.KeyReorder, HTMLElement {}
export const KeyReorder: {
    prototype: KeyReorder;
    new (): KeyReorder;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
