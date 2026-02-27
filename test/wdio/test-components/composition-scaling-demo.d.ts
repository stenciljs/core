import type { Components, JSX } from "../dist/types/components";

interface CompositionScalingDemo extends Components.CompositionScalingDemo, HTMLElement {}
export const CompositionScalingDemo: {
    prototype: CompositionScalingDemo;
    new (): CompositionScalingDemo;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
