import type { Components, JSX } from "../dist/types/components";

interface TextContentPatchScopedWithSlot extends Components.TextContentPatchScopedWithSlot, HTMLElement {}
export const TextContentPatchScopedWithSlot: {
    prototype: TextContentPatchScopedWithSlot;
    new (): TextContentPatchScopedWithSlot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
