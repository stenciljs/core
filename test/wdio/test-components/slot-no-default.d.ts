import type { Components, JSX } from "../dist/types/components";

interface SlotNoDefault extends Components.SlotNoDefault, HTMLElement {}
export const SlotNoDefault: {
    prototype: SlotNoDefault;
    new (): SlotNoDefault;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
