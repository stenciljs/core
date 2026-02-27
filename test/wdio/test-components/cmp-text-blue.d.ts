import type { Components, JSX } from "../dist/types/components";

interface CmpTextBlue extends Components.CmpTextBlue, HTMLElement {}
export const CmpTextBlue: {
    prototype: CmpTextBlue;
    new (): CmpTextBlue;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
