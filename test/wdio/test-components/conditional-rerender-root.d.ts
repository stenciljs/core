import type { Components, JSX } from "../dist/types/components";

interface ConditionalRerenderRoot extends Components.ConditionalRerenderRoot, HTMLElement {}
export const ConditionalRerenderRoot: {
    prototype: ConditionalRerenderRoot;
    new (): ConditionalRerenderRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
