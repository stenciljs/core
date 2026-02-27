import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ReflectNanAttributeHyphen$1 = /*@__PURE__*/ proxyCustomElement(class ReflectNanAttributeHyphen extends H {
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
        return h("div", { key: '1b2f0f7a3d734f1d0f3d1fb218e150875f616300' }, "reflect-nan-attribute-hyphen Render Count: ", this.renderCount);
    }
    componentDidUpdate() {
        // we don't expect the component to update, this will increment the render count in case it does (and should fail
        // the test)
        this.renderCount += 1;
    }
}, [1, "reflect-nan-attribute-hyphen", {
        "valNum": [514, "val-num"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["reflect-nan-attribute-hyphen"];
    components.forEach(tagName => { switch (tagName) {
        case "reflect-nan-attribute-hyphen":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ReflectNanAttributeHyphen$1);
            }
            break;
    } });
}

const ReflectNanAttributeHyphen = ReflectNanAttributeHyphen$1;
const defineCustomElement = defineCustomElement$1;

export { ReflectNanAttributeHyphen, defineCustomElement };
