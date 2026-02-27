import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-7axMVYbP.js';
import { d as defineCustomElement$2 } from './p-vbiPdtiz.js';

const CloneNodeRoot$1 = /*@__PURE__*/ proxyCustomElement(class CloneNodeRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    cloneSlides() {
        this.el.querySelectorAll(`${transformTag("clone-node-slide")}`).forEach((slide) => {
            const clonedSlide = slide.cloneNode(true);
            this.el.appendChild(clonedSlide);
        });
    }
    render() {
        return (h("div", { key: '0a015b9d24a598866559c8c393e280de07d0caca' }, h("button", { key: '3685cc6be0905303e2dae1d18668ef41479de4a2', onClick: this.cloneSlides.bind(this) }, "Clone Slides"), h("clone-node-slide", { key: '1942cfa6e9d59c899f6171df821aeccc0828b6a9' }, h("clone-node-text", { key: '5bc25ee78c985884cbbc2051253c2318d72d04e1' }))));
    }
    get el() { return this; }
}, [0, "clone-node-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["clone-node-root", "clone-node-slide", "clone-node-text"];
    components.forEach(tagName => { switch (tagName) {
        case "clone-node-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CloneNodeRoot$1);
            }
            break;
        case "clone-node-slide":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "clone-node-text":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CloneNodeRoot = CloneNodeRoot$1;
const defineCustomElement = defineCustomElement$1;

export { CloneNodeRoot, defineCustomElement };
