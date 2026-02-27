import type { Components, JSX } from "../dist/types/components";

interface AppRoot extends Components.AppRoot, HTMLElement {}
export const AppRoot: {
    prototype: AppRoot;
    new (): AppRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
