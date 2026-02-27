import type { Components, JSX } from "../dist/types/components";

interface ReparentStyleWithVars extends Components.ReparentStyleWithVars, HTMLElement {}
export const ReparentStyleWithVars: {
    prototype: ReparentStyleWithVars;
    new (): ReparentStyleWithVars;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
