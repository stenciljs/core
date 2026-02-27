import type { Components, JSX } from "../dist/types/components";

interface CmpLevel1 extends Components.CmpLevel1, HTMLElement {}
export const CmpLevel1: {
    prototype: CmpLevel1;
    new (): CmpLevel1;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
