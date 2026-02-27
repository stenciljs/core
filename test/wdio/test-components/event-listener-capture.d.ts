import type { Components, JSX } from "../dist/types/components";

interface EventListenerCapture extends Components.EventListenerCapture, HTMLElement {}
export const EventListenerCapture: {
    prototype: EventListenerCapture;
    new (): EventListenerCapture;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
