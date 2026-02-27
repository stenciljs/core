import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ReflectNanAttribute$1 = /*@__PURE__*/ proxyCustomElement(class ReflectNanAttribute extends H {
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
        return h("div", { key: '8d34311872948dfb222dbe4ff9d196ec94f35121' }, "reflect-nan-attribute Render Count: ", this.renderCount);
    }
    componentDidUpdate() {
        // we don't expect the component to update, this will increment the render count in case it does (and should fail
        // the test)
        this.renderCount += 1;
    }
}, [1, "reflect-nan-attribute", {
        "val": [514]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["reflect-nan-attribute"];
    components.forEach(tagName => { switch (tagName) {
        case "reflect-nan-attribute":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ReflectNanAttribute$1);
            }
            break;
    } });
}

const ReflectNanAttribute = ReflectNanAttribute$1;
const defineCustomElement = defineCustomElement$1;

export { ReflectNanAttribute, defineCustomElement };
