import type { Components, JSX } from "../../dist/types/components";

interface InheritanceCheckboxGroup extends Components.InheritanceCheckboxGroup, HTMLElement {}
export const InheritanceCheckboxGroup: {
    prototype: InheritanceCheckboxGroup;
    new (): InheritanceCheckboxGroup;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
