import type { Components, JSX } from "../dist/types/components";

interface StaticMembersSeparateInitializer extends Components.StaticMembersSeparateInitializer, HTMLElement {}
export const StaticMembersSeparateInitializer: {
    prototype: StaticMembersSeparateInitializer;
    new (): StaticMembersSeparateInitializer;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
