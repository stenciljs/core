import type { Components, JSX } from "../dist/types/components";

interface SlotListLightScopedRoot extends Components.SlotListLightScopedRoot, HTMLElement {}
export const SlotListLightScopedRoot: {
    prototype: SlotListLightScopedRoot;
    new (): SlotListLightScopedRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
