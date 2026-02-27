import type { Components, JSX } from "../dist/types/components";

interface TestSvg extends Components.TestSvg, HTMLElement {}
export const TestSvg: {
    prototype: TestSvg;
    new (): TestSvg;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
