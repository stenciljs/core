import type { Components, JSX } from "../dist/types/components";

interface CmpChildFail extends Components.CmpChildFail, HTMLElement {}
export const CmpChildFail: {
    prototype: CmpChildFail;
    new (): CmpChildFail;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
