import type { Components, JSX } from "../dist/types/components";

interface SlotConditionalRendering extends Components.SlotConditionalRendering, HTMLElement {}
export const SlotConditionalRendering: {
    prototype: SlotConditionalRendering;
    new (): SlotConditionalRendering;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
