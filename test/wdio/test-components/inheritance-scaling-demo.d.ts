import type { Components, JSX } from "../dist/types/components";

interface InheritanceScalingDemo extends Components.InheritanceScalingDemo, HTMLElement {}
export const InheritanceScalingDemo: {
    prototype: InheritanceScalingDemo;
    new (): InheritanceScalingDemo;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
