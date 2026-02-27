import type { Components, JSX } from "../dist/types/components";

interface TextContentPatchScoped extends Components.TextContentPatchScoped, HTMLElement {}
export const TextContentPatchScoped: {
    prototype: TextContentPatchScoped;
    new (): TextContentPatchScoped;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
