import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-DG_XnOR5.js';

const LifecycleUnloadA = /*@__PURE__*/ proxyCustomElement(class LifecycleUnloadA extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    componentDidLoad() {
        this.results = this.el.ownerDocument.body.querySelector('#lifecycle-unload-results');
    }
    disconnectedCallback() {
        const elm = document.createElement(transformTag('div'));
        elm.textContent = 'cmp-a unload';
        this.results.appendChild(elm);
    }
    render() {
        return (h("main", { key: '08c7e6d095bbe5a22a7c93196ff95a605b96d61e' }, h("header", { key: 'f2972dc30402efe5b77b6cd1d59cfb713777bfbb' }, "cmp-a - top"), h("lifecycle-unload-b", { key: '7437ae3c543ea7b87473c59e485dc0ad84c07010' }, "cmp-a - middle"), h("footer", { key: 'ff06e77e0bb8e8541e4cbe77128d6c89e457b096' }, "cmp-a - bottom")));
    }
    get el() { return this; }
}, [1, "lifecycle-unload-a"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-unload-a", "lifecycle-unload-b"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-unload-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleUnloadA);
            }
            break;
        case "lifecycle-unload-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { LifecycleUnloadA as L, defineCustomElement as d };
