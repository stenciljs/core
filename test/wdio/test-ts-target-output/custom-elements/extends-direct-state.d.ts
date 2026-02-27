import type { Components, JSX } from "../../dist/types/components";

interface ExtendsDirectState extends Components.ExtendsDirectState, HTMLElement {}
export const ExtendsDirectState: {
    prototype: ExtendsDirectState;
    new (): ExtendsDirectState;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
