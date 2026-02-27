import type { Components, JSX } from "../dist/types/components";

interface SlotArrayComplexRoot extends Components.SlotArrayComplexRoot, HTMLElement {}
export const SlotArrayComplexRoot: {
    prototype: SlotArrayComplexRoot;
    new (): SlotArrayComplexRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
