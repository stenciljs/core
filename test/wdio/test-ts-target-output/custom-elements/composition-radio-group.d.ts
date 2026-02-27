import type { Components, JSX } from "../../dist/types/components";

interface CompositionRadioGroup extends Components.CompositionRadioGroup, HTMLElement {}
export const CompositionRadioGroup: {
    prototype: CompositionRadioGroup;
    new (): CompositionRadioGroup;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
