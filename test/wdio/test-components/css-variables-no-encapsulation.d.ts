import type { Components, JSX } from "../dist/types/components";

interface CssVariablesNoEncapsulation extends Components.CssVariablesNoEncapsulation, HTMLElement {}
export const CssVariablesNoEncapsulation: {
    prototype: CssVariablesNoEncapsulation;
    new (): CssVariablesNoEncapsulation;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
