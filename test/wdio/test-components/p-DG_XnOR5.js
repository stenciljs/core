import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';

const LifecycleUnloadB = /*@__PURE__*/ proxyCustomElement(class LifecycleUnloadB extends H {
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
        elm.textContent = 'cmp-b unload';
        this.results.appendChild(elm);
    }
    render() {
        return [
            h("article", { key: '3fc6c79703b77d88932b16243972212e7342e0be' }, "cmp-b - top"),
            h("section", { key: 'f0320f9fbc829c4285a91bd47f9e0b2c8ed5296c' }, h("slot", { key: 'e596949b1de33147aaba3df73df3b7f4908c7f40' })),
            h("nav", { key: 'c19734826d3513b69cc0a2b45672a5bf1274f1d3' }, "cmp-b - bottom"),
        ];
    }
    get el() { return this; }
}, [257, "lifecycle-unload-b"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-unload-b"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-unload-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleUnloadB);
            }
            break;
    } });
}

export { LifecycleUnloadB as L, defineCustomElement as d };
