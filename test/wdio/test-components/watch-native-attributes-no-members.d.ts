import type { Components, JSX } from "../dist/types/components";

interface WatchNativeAttributesNoMembers extends Components.WatchNativeAttributesNoMembers, HTMLElement {}
export const WatchNativeAttributesNoMembers: {
    prototype: WatchNativeAttributesNoMembers;
    new (): WatchNativeAttributesNoMembers;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
