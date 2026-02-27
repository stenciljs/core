import type { Components, JSX } from "../dist/types/components";

interface ComputedPropertiesPropDecorator extends Components.ComputedPropertiesPropDecorator, HTMLElement {}
export const ComputedPropertiesPropDecorator: {
    prototype: ComputedPropertiesPropDecorator;
    new (): ComputedPropertiesPropDecorator;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
