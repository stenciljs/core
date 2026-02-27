import type { Components, JSX } from "../dist/types/components";

interface PageList extends Components.PageList, HTMLElement {}
export const PageList: {
    prototype: PageList;
    new (): PageList;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
