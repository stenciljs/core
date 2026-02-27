import type { Components, JSX } from "../dist/types/components";

interface ComputedPropertiesStateDecorator extends Components.ComputedPropertiesStateDecorator, HTMLElement {}
export const ComputedPropertiesStateDecorator: {
    prototype: ComputedPropertiesStateDecorator;
    new (): ComputedPropertiesStateDecorator;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
