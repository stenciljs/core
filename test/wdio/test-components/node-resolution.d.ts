import type { Components, JSX } from "../dist/types/components";

interface NodeResolution extends Components.NodeResolution, HTMLElement {}
export const NodeResolution: {
    prototype: NodeResolution;
    new (): NodeResolution;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
