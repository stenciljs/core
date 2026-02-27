import type { Components, JSX } from "../../dist/types/components";

interface CompositionTextInput extends Components.CompositionTextInput, HTMLElement {}
export const CompositionTextInput: {
    prototype: CompositionTextInput;
    new (): CompositionTextInput;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
