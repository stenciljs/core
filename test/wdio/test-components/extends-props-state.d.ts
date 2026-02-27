import type { Components, JSX } from "../dist/types/components";

interface ExtendsPropsState extends Components.ExtendsPropsState, HTMLElement {}
export const ExtendsPropsState: {
    prototype: ExtendsPropsState;
    new (): ExtendsPropsState;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
