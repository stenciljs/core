import type { Components, JSX } from "../dist/types/components";

interface PropSerializer extends Components.PropSerializer, HTMLElement {}
export const PropSerializer: {
    prototype: PropSerializer;
    new (): PropSerializer;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
