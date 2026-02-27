import type { Components, JSX } from "../dist/types/components";

interface IonHost extends Components.IonHost, HTMLElement {}
export const IonHost: {
    prototype: IonHost;
    new (): IonHost;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
