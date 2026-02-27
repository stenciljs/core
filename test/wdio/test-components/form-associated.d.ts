import type { Components, JSX } from "../dist/types/components";

interface FormAssociated extends Components.FormAssociated, HTMLElement {}
export const FormAssociated: {
    prototype: FormAssociated;
    new (): FormAssociated;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
