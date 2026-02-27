import type { Components, JSX } from "../../dist/types/components";

interface SiblingWithMixin extends Components.SiblingWithMixin, HTMLElement {}
export const SiblingWithMixin: {
    prototype: SiblingWithMixin;
    new (): SiblingWithMixin;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
