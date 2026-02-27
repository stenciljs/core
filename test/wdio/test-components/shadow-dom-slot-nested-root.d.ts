import type { Components, JSX } from "../dist/types/components";

interface ShadowDomSlotNestedRoot extends Components.ShadowDomSlotNestedRoot, HTMLElement {}
export const ShadowDomSlotNestedRoot: {
    prototype: ShadowDomSlotNestedRoot;
    new (): ShadowDomSlotNestedRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
