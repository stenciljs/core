import type { Components, JSX } from "../dist/types/components";

interface SlotReorder extends Components.SlotReorder, HTMLElement {}
export const SlotReorder: {
    prototype: SlotReorder;
    new (): SlotReorder;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
