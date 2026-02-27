import type { Components, JSX } from "../dist/types/components";

interface SlotDynamicWrapperRoot extends Components.SlotDynamicWrapperRoot, HTMLElement {}
export const SlotDynamicWrapperRoot: {
    prototype: SlotDynamicWrapperRoot;
    new (): SlotDynamicWrapperRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
