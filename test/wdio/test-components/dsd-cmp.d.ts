import type { Components, JSX } from "../dist/types/components";

interface DsdCmp extends Components.DsdCmp, HTMLElement {}
export const DsdCmp: {
    prototype: DsdCmp;
    new (): DsdCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
