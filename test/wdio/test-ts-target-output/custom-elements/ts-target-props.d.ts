import type { Components, JSX } from "../../dist/types/components";

interface TsTargetProps extends Components.TsTargetProps, HTMLElement {}
export const TsTargetProps: {
    prototype: TsTargetProps;
    new (): TsTargetProps;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
