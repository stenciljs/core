import type { Components, JSX } from "../dist/types/components";

interface SlotReorderRoot extends Components.SlotReorderRoot, HTMLElement {}
export const SlotReorderRoot: {
    prototype: SlotReorderRoot;
    new (): SlotReorderRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
