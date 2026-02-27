import type { Components, JSX } from "../dist/types/components";

interface CmpLabelWithSlotSibling extends Components.CmpLabelWithSlotSibling, HTMLElement {}
export const CmpLabelWithSlotSibling: {
    prototype: CmpLabelWithSlotSibling;
    new (): CmpLabelWithSlotSibling;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
