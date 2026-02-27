import type { Components, JSX } from "../dist/types/components";

interface PageListItem extends Components.PageListItem, HTMLElement {}
export const PageListItem: {
    prototype: PageListItem;
    new (): PageListItem;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
