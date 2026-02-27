import type { Components, JSX } from "../dist/types/components";

interface DomReattachCloneHost extends Components.DomReattachCloneHost, HTMLElement {}
export const DomReattachCloneHost: {
    prototype: DomReattachCloneHost;
    new (): DomReattachCloneHost;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
