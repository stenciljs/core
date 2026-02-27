import type { Components, JSX } from "../dist/types/components";

interface IonRadio extends Components.IonRadio, HTMLElement {}
export const IonRadio: {
    prototype: IonRadio;
    new (): IonRadio;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
