import type { Components, JSX } from "../dist/types/components";

interface ShadowDomSlotNested extends Components.ShadowDomSlotNested, HTMLElement {}
export const ShadowDomSlotNested: {
    prototype: ShadowDomSlotNested;
    new (): ShadowDomSlotNested;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
