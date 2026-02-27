import type { Components, JSX } from "../dist/types/components";

interface CustomElementsHierarchyLifecycleParent extends Components.CustomElementsHierarchyLifecycleParent, HTMLElement {}
export const CustomElementsHierarchyLifecycleParent: {
    prototype: CustomElementsHierarchyLifecycleParent;
    new (): CustomElementsHierarchyLifecycleParent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
