import type { Components, JSX } from "../../dist/types/components";

interface ExtendsEvents extends Components.ExtendsEvents, HTMLElement {}
export const ExtendsEvents: {
    prototype: ExtendsEvents;
    new (): ExtendsEvents;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
