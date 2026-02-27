import type { Components, JSX } from "../dist/types/components";

interface CmpD extends Components.CmpD, HTMLElement {}
export const CmpD: {
    prototype: CmpD;
    new (): CmpD;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
