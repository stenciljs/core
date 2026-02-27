import type { Components, JSX } from "../dist/types/components";

interface SlotDynamicNameChangeScoped extends Components.SlotDynamicNameChangeScoped, HTMLElement {}
export const SlotDynamicNameChangeScoped: {
    prototype: SlotDynamicNameChangeScoped;
    new (): SlotDynamicNameChangeScoped;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
