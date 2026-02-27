import type { Components, JSX } from "../dist/types/components";

interface SlotHtml extends Components.SlotHtml, HTMLElement {}
export const SlotHtml: {
    prototype: SlotHtml;
    new (): SlotHtml;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
