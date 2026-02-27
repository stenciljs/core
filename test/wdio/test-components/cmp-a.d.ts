import type { Components, JSX } from "../dist/types/components";

interface CmpA extends Components.CmpA, HTMLElement {}
export const CmpA: {
    prototype: CmpA;
    new (): CmpA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
