import type { Components, JSX } from "../dist/types/components";

interface StaticMembers extends Components.StaticMembers, HTMLElement {}
export const StaticMembers: {
    prototype: StaticMembers;
    new (): StaticMembers;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
