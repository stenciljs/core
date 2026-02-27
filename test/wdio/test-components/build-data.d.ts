import type { Components, JSX } from "../dist/types/components";

interface BuildData extends Components.BuildData, HTMLElement {}
export const BuildData: {
    prototype: BuildData;
    new (): BuildData;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
