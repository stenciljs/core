import type { Components, JSX } from "../dist/types/components";

interface EventReRegister extends Components.EventReRegister, HTMLElement {}
export const EventReRegister: {
    prototype: EventReRegister;
    new (): EventReRegister;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
