import type { Components, JSX } from "../dist/types/components";

interface CmpB extends Components.CmpB, HTMLElement {}
export const CmpB: {
    prototype: CmpB;
    new (): CmpB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
