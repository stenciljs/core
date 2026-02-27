import type { Components, JSX } from "../dist/types/components";

interface IonChild extends Components.IonChild, HTMLElement {}
export const IonChild: {
    prototype: IonChild;
    new (): IonChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
