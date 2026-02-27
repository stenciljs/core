import type { Components, JSX } from "../dist/types/components";

interface CmpLevel3 extends Components.CmpLevel3, HTMLElement {}
export const CmpLevel3: {
    prototype: CmpLevel3;
    new (): CmpLevel3;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
