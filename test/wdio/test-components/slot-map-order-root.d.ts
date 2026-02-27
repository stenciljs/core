import type { Components, JSX } from "../dist/types/components";

interface SlotMapOrderRoot extends Components.SlotMapOrderRoot, HTMLElement {}
export const SlotMapOrderRoot: {
    prototype: SlotMapOrderRoot;
    new (): SlotMapOrderRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
