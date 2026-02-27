import type { Components, JSX } from "../dist/types/components";

interface ConditionalRerender extends Components.ConditionalRerender, HTMLElement {}
export const ConditionalRerender: {
    prototype: ConditionalRerender;
    new (): ConditionalRerender;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
