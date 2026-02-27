import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CmpTag3d = /*@__PURE__*/ proxyCustomElement(class CmpTag3d extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("div", { key: 'ff5ef1bc4f6c176b97f419c0cba4ce628a7b4ae9' }, "tag-3d-component");
    }
}, [0, "tag-3d-component"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["tag-3d-component"];
    components.forEach(tagName => { switch (tagName) {
        case "tag-3d-component":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpTag3d);
            }
            break;
    } });
}

const Tag3dComponent = CmpTag3d;
const defineCustomElement = defineCustomElement$1;

export { Tag3dComponent, defineCustomElement };
