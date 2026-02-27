import type { Components, JSX } from "../dist/types/components";

interface SlotNgIf extends Components.SlotNgIf, HTMLElement {}
export const SlotNgIf: {
    prototype: SlotNgIf;
    new (): SlotNgIf;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
