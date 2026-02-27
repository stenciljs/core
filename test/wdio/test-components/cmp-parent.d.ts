import type { Components, JSX } from "../dist/types/components";

interface CmpParent extends Components.CmpParent, HTMLElement {}
export const CmpParent: {
    prototype: CmpParent;
    new (): CmpParent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
