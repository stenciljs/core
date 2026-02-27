import type { Components, JSX } from "../../dist/types/components";

interface CompositionCheckboxGroup extends Components.CompositionCheckboxGroup, HTMLElement {}
export const CompositionCheckboxGroup: {
    prototype: CompositionCheckboxGroup;
    new (): CompositionCheckboxGroup;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
