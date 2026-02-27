import type { Components, JSX } from "../dist/types/components";

interface ComputedPropertiesWatchDecorator extends Components.ComputedPropertiesWatchDecorator, HTMLElement {}
export const ComputedPropertiesWatchDecorator: {
    prototype: ComputedPropertiesWatchDecorator;
    new (): ComputedPropertiesWatchDecorator;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
