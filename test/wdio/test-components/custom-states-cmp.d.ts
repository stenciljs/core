import type { Components, JSX } from "../dist/types/components";

interface CustomStatesCmp extends Components.CustomStatesCmp, HTMLElement {}
export const CustomStatesCmp: {
    prototype: CustomStatesCmp;
    new (): CustomStatesCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
