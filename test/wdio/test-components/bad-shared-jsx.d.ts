import type { Components, JSX } from "../dist/types/components";

interface BadSharedJsx extends Components.BadSharedJsx, HTMLElement {}
export const BadSharedJsx: {
    prototype: BadSharedJsx;
    new (): BadSharedJsx;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
