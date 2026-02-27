import type { Components, JSX } from "../dist/types/components";

interface SerializeDeserializer extends Components.SerializeDeserializer, HTMLElement {}
export const SerializeDeserializer: {
    prototype: SerializeDeserializer;
    new (): SerializeDeserializer;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
