import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ChildReflectNanAttribute = /*@__PURE__*/ proxyCustomElement(class ChildReflectNanAttribute extends H {
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
        return h("div", { key: '256d3303db616263075646309e2595e0aaddea2f' }, "child-reflect-nan-attribute Render Count: ", this.renderCount);
    }
    componentDidUpdate() {
        // we don't expect the component to update, this will increment the render count in case it does (and should fail
        // the test)
        this.renderCount += 1;
    }
}, [1, "child-reflect-nan-attribute", {
        "val": [514]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["child-reflect-nan-attribute"];
    components.forEach(tagName => { switch (tagName) {
        case "child-reflect-nan-attribute":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ChildReflectNanAttribute);
            }
            break;
    } });
}

export { ChildReflectNanAttribute as C, defineCustomElement as d };
