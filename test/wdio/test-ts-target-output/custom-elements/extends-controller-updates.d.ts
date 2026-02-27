import type { Components, JSX } from "../../dist/types/components";

interface ExtendsControllerUpdates extends Components.ExtendsControllerUpdates, HTMLElement {}
export const ExtendsControllerUpdates: {
    prototype: ExtendsControllerUpdates;
    new (): ExtendsControllerUpdates;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
