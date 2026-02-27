import type { Components, JSX } from "../dist/types/components";

interface ExtendsExternalAbstract extends Components.ExtendsExternalAbstract, HTMLElement {}
export const ExtendsExternalAbstract: {
    prototype: ExtendsExternalAbstract;
    new (): ExtendsExternalAbstract;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
