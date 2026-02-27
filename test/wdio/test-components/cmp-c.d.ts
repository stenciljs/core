import type { Components, JSX } from "../dist/types/components";

interface CmpC extends Components.CmpC, HTMLElement {}
export const CmpC: {
    prototype: CmpC;
    new (): CmpC;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
