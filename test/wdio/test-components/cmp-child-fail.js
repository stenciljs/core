import { p as proxyCustomElement, H, t as transformTag } from './p-DYdAJnXF.js';

const CmpChildFail = /*@__PURE__*/ proxyCustomElement(class CmpChildFail extends H {
    render() {
        throw new Error('Child component intentionally failed to load');
    }
    connectedCallback() {
        this.textContent = this.render();
    }
    static get is() { return "cmp-child-fail"; }
}, [0, "cmp-child-fail"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-child-fail"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-child-fail":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpChildFail);
            }
            break;
    } });
}

export { CmpChildFail, defineCustomElement as d };
