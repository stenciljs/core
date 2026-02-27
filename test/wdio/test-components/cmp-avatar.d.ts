import type { Components, JSX } from "../dist/types/components";

interface CmpAvatar extends Components.CmpAvatar, HTMLElement {}
export const CmpAvatar: {
    prototype: CmpAvatar;
    new (): CmpAvatar;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
