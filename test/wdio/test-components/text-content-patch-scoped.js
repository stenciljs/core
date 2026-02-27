import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const TextContentPatchScoped$1 = /*@__PURE__*/ proxyCustomElement(class TextContentPatchScoped extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [h("p", { key: '79c7ea7c2c1bf75c60be0669863547253b64706a' }, "Top content"), h("p", { key: '12ae31abe57a4119df9c74a7769f1346439c37e3' }, "Bottom content")];
    }
}, [2, "text-content-patch-scoped"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["text-content-patch-scoped"];
    components.forEach(tagName => { switch (tagName) {
        case "text-content-patch-scoped":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TextContentPatchScoped$1);
            }
            break;
    } });
}

const TextContentPatchScoped = TextContentPatchScoped$1;
const defineCustomElement = defineCustomElement$1;

export { TextContentPatchScoped, defineCustomElement };
