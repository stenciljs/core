import type { Components, JSX } from "../dist/types/components";

interface ReparentStyleNoVars extends Components.ReparentStyleNoVars, HTMLElement {}
export const ReparentStyleNoVars: {
    prototype: ReparentStyleNoVars;
    new (): ReparentStyleNoVars;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
