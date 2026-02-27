import type { Components, JSX } from "../dist/types/components";

interface CmpTextGreen extends Components.CmpTextGreen, HTMLElement {}
export const CmpTextGreen: {
    prototype: CmpTextGreen;
    new (): CmpTextGreen;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
