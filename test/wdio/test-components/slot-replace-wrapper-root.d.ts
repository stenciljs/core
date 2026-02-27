import type { Components, JSX } from "../dist/types/components";

interface SlotReplaceWrapperRoot extends Components.SlotReplaceWrapperRoot, HTMLElement {}
export const SlotReplaceWrapperRoot: {
    prototype: SlotReplaceWrapperRoot;
    new (): SlotReplaceWrapperRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
