import type { Components, JSX } from "../dist/types/components";

interface SlotBasic extends Components.SlotBasic, HTMLElement {}
export const SlotBasic: {
    prototype: SlotBasic;
    new (): SlotBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
