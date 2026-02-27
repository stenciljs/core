import type { Components, JSX } from "../dist/types/components";

interface SlotLightDomRoot extends Components.SlotLightDomRoot, HTMLElement {}
export const SlotLightDomRoot: {
    prototype: SlotLightDomRoot;
    new (): SlotLightDomRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
