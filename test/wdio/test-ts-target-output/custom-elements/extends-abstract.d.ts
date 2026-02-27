import type { Components, JSX } from "../../dist/types/components";

interface ExtendsAbstract extends Components.ExtendsAbstract, HTMLElement {}
export const ExtendsAbstract: {
    prototype: ExtendsAbstract;
    new (): ExtendsAbstract;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
