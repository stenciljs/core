import type { Components, JSX } from "../../dist/types/components";

interface ExtendsRender extends Components.ExtendsRender, HTMLElement {}
export const ExtendsRender: {
    prototype: ExtendsRender;
    new (): ExtendsRender;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
