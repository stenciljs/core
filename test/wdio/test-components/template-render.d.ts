import type { Components, JSX } from "../dist/types/components";

interface TemplateRender extends Components.TemplateRender, HTMLElement {}
export const TemplateRender: {
    prototype: TemplateRender;
    new (): TemplateRender;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
