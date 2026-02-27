import type { Components, JSX } from "../dist/types/components";

interface InputBasicRoot extends Components.InputBasicRoot, HTMLElement {}
export const InputBasicRoot: {
    prototype: InputBasicRoot;
    new (): InputBasicRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
