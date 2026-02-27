import type { Components, JSX } from "../dist/types/components";

interface CssVariablesShadowDom extends Components.CssVariablesShadowDom, HTMLElement {}
export const CssVariablesShadowDom: {
    prototype: CssVariablesShadowDom;
    new (): CssVariablesShadowDom;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
