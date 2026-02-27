import type { Components, JSX } from "../dist/types/components";

interface ExtendsConflicts extends Components.ExtendsConflicts, HTMLElement {}
export const ExtendsConflicts: {
    prototype: ExtendsConflicts;
    new (): ExtendsConflicts;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
