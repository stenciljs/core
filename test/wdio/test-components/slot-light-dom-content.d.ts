import type { Components, JSX } from "../dist/types/components";

interface SlotLightDomContent extends Components.SlotLightDomContent, HTMLElement {}
export const SlotLightDomContent: {
    prototype: SlotLightDomContent;
    new (): SlotLightDomContent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
