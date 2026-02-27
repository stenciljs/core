import type { Components, JSX } from "../dist/types/components";

interface CmpScopedA extends Components.CmpScopedA, HTMLElement {}
export const CmpScopedA: {
    prototype: CmpScopedA;
    new (): CmpScopedA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
