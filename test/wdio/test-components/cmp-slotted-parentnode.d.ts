import type { Components, JSX } from "../dist/types/components";

interface CmpSlottedParentnode extends Components.CmpSlottedParentnode, HTMLElement {}
export const CmpSlottedParentnode: {
    prototype: CmpSlottedParentnode;
    new (): CmpSlottedParentnode;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
