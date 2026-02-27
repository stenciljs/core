import type { Components, JSX } from "../dist/types/components";

interface ReflectNanAttributeHyphen extends Components.ReflectNanAttributeHyphen, HTMLElement {}
export const ReflectNanAttributeHyphen: {
    prototype: ReflectNanAttributeHyphen;
    new (): ReflectNanAttributeHyphen;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
