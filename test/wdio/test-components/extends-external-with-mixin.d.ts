import type { Components, JSX } from "../dist/types/components";

interface ExtendsExternalWithMixin extends Components.ExtendsExternalWithMixin, HTMLElement {}
export const ExtendsExternalWithMixin: {
    prototype: ExtendsExternalWithMixin;
    new (): ExtendsExternalWithMixin;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
