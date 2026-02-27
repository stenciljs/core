import type { Components, JSX } from "../dist/types/components";

interface DynamicCssVariable extends Components.DynamicCssVariable, HTMLElement {}
export const DynamicCssVariable: {
    prototype: DynamicCssVariable;
    new (): DynamicCssVariable;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
