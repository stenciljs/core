import type { Components, JSX } from "../../dist/types/components";

interface ExtendsExternal extends Components.ExtendsExternal, HTMLElement {}
export const ExtendsExternal: {
    prototype: ExtendsExternal;
    new (): ExtendsExternal;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
