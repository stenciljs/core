import type { Components, JSX } from "../dist/types/components";

interface Tag3dComponent extends Components.Tag3dComponent, HTMLElement {}
export const Tag3dComponent: {
    prototype: Tag3dComponent;
    new (): Tag3dComponent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
