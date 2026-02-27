import type { Components, JSX } from "../dist/types/components";

interface StaticMembersSeparateExport extends Components.StaticMembersSeparateExport, HTMLElement {}
export const StaticMembersSeparateExport: {
    prototype: StaticMembersSeparateExport;
    new (): StaticMembersSeparateExport;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
