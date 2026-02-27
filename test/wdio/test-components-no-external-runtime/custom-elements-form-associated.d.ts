import type { Components, JSX } from "../dist/types/components";

interface CustomElementsFormAssociated extends Components.CustomElementsFormAssociated, HTMLElement {}
export const CustomElementsFormAssociated: {
    prototype: CustomElementsFormAssociated;
    new (): CustomElementsFormAssociated;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
