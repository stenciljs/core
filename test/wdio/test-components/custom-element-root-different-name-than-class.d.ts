import type { Components, JSX } from "../dist/types/components";

interface CustomElementRootDifferentNameThanClass extends Components.CustomElementRootDifferentNameThanClass, HTMLElement {}
export const CustomElementRootDifferentNameThanClass: {
    prototype: CustomElementRootDifferentNameThanClass;
    new (): CustomElementRootDifferentNameThanClass;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
