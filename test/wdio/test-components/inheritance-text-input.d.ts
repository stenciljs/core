import type { Components, JSX } from "../dist/types/components";

interface InheritanceTextInput extends Components.InheritanceTextInput, HTMLElement {}
export const InheritanceTextInput: {
    prototype: InheritanceTextInput;
    new (): InheritanceTextInput;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
