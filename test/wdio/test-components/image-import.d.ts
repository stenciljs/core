import type { Components, JSX } from "../dist/types/components";

interface ImageImport extends Components.ImageImport, HTMLElement {}
export const ImageImport: {
    prototype: ImageImport;
    new (): ImageImport;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
