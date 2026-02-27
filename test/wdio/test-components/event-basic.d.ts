import type { Components, JSX } from "../dist/types/components";

interface EventBasic extends Components.EventBasic, HTMLElement {}
export const EventBasic: {
    prototype: EventBasic;
    new (): EventBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
