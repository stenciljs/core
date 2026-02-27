import type { Components, JSX } from "../dist/types/components";

interface SlowSsrProp extends Components.SlowSsrProp, HTMLElement {}
export const SlowSsrProp: {
    prototype: SlowSsrProp;
    new (): SlowSsrProp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
