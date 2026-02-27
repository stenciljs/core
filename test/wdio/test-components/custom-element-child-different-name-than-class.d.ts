import type { Components, JSX } from "../dist/types/components";

interface CustomElementChildDifferentNameThanClass extends Components.CustomElementChildDifferentNameThanClass, HTMLElement {}
export const CustomElementChildDifferentNameThanClass: {
    prototype: CustomElementChildDifferentNameThanClass;
    new (): CustomElementChildDifferentNameThanClass;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
