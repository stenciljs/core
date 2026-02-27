import type { Components, JSX } from "../dist/types/components";

interface ConditionalBasic extends Components.ConditionalBasic, HTMLElement {}
export const ConditionalBasic: {
    prototype: ConditionalBasic;
    new (): ConditionalBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
