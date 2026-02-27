import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const ChildComponent = /*@__PURE__*/ proxyCustomElement(class ChildComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'f6e3cb5a7df38f1bd28f1aa854d9557e1891dd45' }, h("div", { key: 'b871a6595cb801b33a16fda33b842b9508682548' }, h("slot", { key: '7692afd984a459fdeadfacfdd98e22efacca020a', name: "label" }, this.label))));
    }
    static get style() { return `.sc-slot-forward-child-fallback-h {
      display: block;
    }`; }
}, [262, "slot-forward-child-fallback", {
        "label": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-forward-child-fallback"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-forward-child-fallback":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ChildComponent);
            }
            break;
    } });
}

export { ChildComponent as C, defineCustomElement as d };
