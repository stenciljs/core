import type { Components, JSX } from "../dist/types/components";

interface SlotListLightRoot extends Components.SlotListLightRoot, HTMLElement {}
export const SlotListLightRoot: {
    prototype: SlotListLightRoot;
    new (): SlotListLightRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
