import type { Components, JSX } from "../dist/types/components";

interface CustomElementsHierarchyLifecycleChild extends Components.CustomElementsHierarchyLifecycleChild, HTMLElement {}
export const CustomElementsHierarchyLifecycleChild: {
    prototype: CustomElementsHierarchyLifecycleChild;
    new (): CustomElementsHierarchyLifecycleChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
