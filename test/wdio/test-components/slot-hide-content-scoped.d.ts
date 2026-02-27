import type { Components, JSX } from "../dist/types/components";

interface SlotHideContentScoped extends Components.SlotHideContentScoped, HTMLElement {}
export const SlotHideContentScoped: {
    prototype: SlotHideContentScoped;
    new (): SlotHideContentScoped;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
