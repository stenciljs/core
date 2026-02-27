import type { Components, JSX } from "../dist/types/components";

interface FactoryJsx extends Components.FactoryJsx, HTMLElement {}
export const FactoryJsx: {
    prototype: FactoryJsx;
    new (): FactoryJsx;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
