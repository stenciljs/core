import type { Components, JSX } from "../dist/types/components";

interface HostAttrOverride extends Components.HostAttrOverride, HTMLElement {}
export const HostAttrOverride: {
    prototype: HostAttrOverride;
    new (): HostAttrOverride;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
