import type { Components, JSX } from "../dist/types/components";

interface InheritanceRadioGroup extends Components.InheritanceRadioGroup, HTMLElement {}
export const InheritanceRadioGroup: {
    prototype: InheritanceRadioGroup;
    new (): InheritanceRadioGroup;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
