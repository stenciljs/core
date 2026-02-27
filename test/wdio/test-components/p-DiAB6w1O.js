import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ChildWithReflection = /*@__PURE__*/ proxyCustomElement(class ChildWithReflection extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        // counter to proxy the number of times a render has occurred
        this.renderCount = 0;
    }
    render() {
        this.renderCount += 1;
        return (h("div", { key: '3bf196abc7eabe3c48f5ed16cbb02cf02a2f501e' }, h("div", { key: 'daf83ea10096f8d255ad07e6d4e8de61428b2b0c' }, "Child Render Count: ", this.renderCount), h("input", { key: 'e5892fd65d27b81be4eface3ad7ffa4a80bd53ca', step: this.val })));
    }
    componentDidUpdate() {
        this.renderCount += 1;
    }
}, [1, "child-with-reflection", {
        "val": [520]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["child-with-reflection"];
    components.forEach(tagName => { switch (tagName) {
        case "child-with-reflection":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ChildWithReflection);
            }
            break;
    } });
}

export { ChildWithReflection as C, defineCustomElement as d };
