import type { Components, JSX } from "../dist/types/components";

interface IonParent extends Components.IonParent, HTMLElement {}
export const IonParent: {
    prototype: IonParent;
    new (): IonParent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
