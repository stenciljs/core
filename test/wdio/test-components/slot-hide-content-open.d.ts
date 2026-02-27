import type { Components, JSX } from "../dist/types/components";

interface SlotHideContentOpen extends Components.SlotHideContentOpen, HTMLElement {}
export const SlotHideContentOpen: {
    prototype: SlotHideContentOpen;
    new (): SlotHideContentOpen;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
