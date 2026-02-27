import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const TextContentPatchScopedWithSlot$1 = /*@__PURE__*/ proxyCustomElement(class TextContentPatchScopedWithSlot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [h("p", { key: '845d93a508b2c56a7231fa2fd52bdeaa84f394e4' }, "Top content"), h("slot", { key: '6e2ba972b260a123b1dd897d04fbb99bb0d23ac9' }), h("p", { key: '3d94b15d608b523a387d91f5fd6458250aa86812' }, "Bottom content"), h("slot", { key: '06f61e171fb8bd817a3c11277a592e846c9897bf', name: "suffix" })];
    }
}, [262, "text-content-patch-scoped-with-slot"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["text-content-patch-scoped-with-slot"];
    components.forEach(tagName => { switch (tagName) {
        case "text-content-patch-scoped-with-slot":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TextContentPatchScopedWithSlot$1);
            }
            break;
    } });
}

const TextContentPatchScopedWithSlot = TextContentPatchScopedWithSlot$1;
const defineCustomElement = defineCustomElement$1;

export { TextContentPatchScopedWithSlot, defineCustomElement };
