import type { Components, JSX } from "../dist/types/components";

interface SiblingExtended extends Components.SiblingExtended, HTMLElement {}
export const SiblingExtended: {
    prototype: SiblingExtended;
    new (): SiblingExtended;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
