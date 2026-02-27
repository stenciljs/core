import type { Components, JSX } from "../dist/types/components";

interface CmpLevel2 extends Components.CmpLevel2, HTMLElement {}
export const CmpLevel2: {
    prototype: CmpLevel2;
    new (): CmpLevel2;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
