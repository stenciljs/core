import type { Components, JSX } from "../dist/types/components";

interface StaticDecoratedMembers extends Components.StaticDecoratedMembers, HTMLElement {}
export const StaticDecoratedMembers: {
    prototype: StaticDecoratedMembers;
    new (): StaticDecoratedMembers;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
