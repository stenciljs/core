import type { Components, JSX } from "../dist/types/components";

interface WatchNativeAttributes extends Components.WatchNativeAttributes, HTMLElement {}
export const WatchNativeAttributes: {
    prototype: WatchNativeAttributes;
    new (): WatchNativeAttributes;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
