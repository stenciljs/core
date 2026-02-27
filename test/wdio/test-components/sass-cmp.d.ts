import type { Components, JSX } from "../dist/types/components";

interface SassCmp extends Components.SassCmp, HTMLElement {}
export const SassCmp: {
    prototype: SassCmp;
    new (): SassCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
