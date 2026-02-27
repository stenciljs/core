import type { Components, JSX } from "../dist/types/components";

interface StaticStyles extends Components.StaticStyles, HTMLElement {}
export const StaticStyles: {
    prototype: StaticStyles;
    new (): StaticStyles;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
