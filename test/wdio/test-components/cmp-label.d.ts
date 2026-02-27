import type { Components, JSX } from "../dist/types/components";

interface CmpLabel extends Components.CmpLabel, HTMLElement {}
export const CmpLabel: {
    prototype: CmpLabel;
    new (): CmpLabel;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
