import type { Components, JSX } from "../../dist/types/components";

interface ExtendsViaHostCmp extends Components.ExtendsViaHostCmp, HTMLElement {}
export const ExtendsViaHostCmp: {
    prototype: ExtendsViaHostCmp;
    new (): ExtendsViaHostCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
