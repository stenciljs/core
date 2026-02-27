import type { Components, JSX } from "../dist/types/components";

interface DomReattachCloneDeepSlot extends Components.DomReattachCloneDeepSlot, HTMLElement {}
export const DomReattachCloneDeepSlot: {
    prototype: DomReattachCloneDeepSlot;
    new (): DomReattachCloneDeepSlot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
