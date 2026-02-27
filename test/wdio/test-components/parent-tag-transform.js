import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-C1-PDOzT.js';

const parentTagTransformCss = () => `:host{display:block;padding:15px;border:2px solid green}${transformTag("child-tag-transform")}{display:block;padding:10px;margin:5px;border:2px solid blue}`;

const TagTransformParent = /*@__PURE__*/ proxyCustomElement(class TagTransformParent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    async querySelectorAllChildTags() {
        var _a;
        return (_a = this.el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelectorAll(`${transformTag("child-tag-transform")}`);
    }
    async querySelectorChildTags() {
        var _a;
        return (_a = this.el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector(`${transformTag("child-tag-transform")}`);
    }
    async createChildTagElement() {
        return document.createElement(transformTag('child-tag-transform'));
    }
    async customElementsGetChild() {
        return customElements.get(transformTag('child-tag-transform'));
    }
    render() {
        return (h("div", { key: 'ec294afd168e75b65bc330f73b57c335b4f866b5' }, h("h2", { key: '8d68286dac263b61a7c7626d738fa780872a00a4' }, "Parent Component"), h("child-tag-transform", { key: '3f023cba754b52d9e06c2410d415bf785d054d4e', message: "Hello from Parent!" }), h("child-tag-transform", { key: '6bf8acad2b37e59d0011393c1c8f909176ebe2f8', message: "Another Child" })));
    }
    get el() { return this; }
    static get style() { return parentTagTransformCss(); }
}, [1, "parent-tag-transform", {
        "querySelectorAllChildTags": [64],
        "querySelectorChildTags": [64],
        "createChildTagElement": [64],
        "customElementsGetChild": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["parent-tag-transform", "child-tag-transform"];
    components.forEach(tagName => { switch (tagName) {
        case "parent-tag-transform":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TagTransformParent);
            }
            break;
        case "child-tag-transform":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ParentTagTransform = TagTransformParent;
const defineCustomElement = defineCustomElement$1;

export { ParentTagTransform, defineCustomElement };
