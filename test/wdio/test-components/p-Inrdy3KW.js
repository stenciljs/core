import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const AttributeBasic = /*@__PURE__*/ proxyCustomElement(class AttributeBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this._getter = 'getter';
        this.single = 'single';
        this.multiWord = 'multiWord';
        this.customAttr = 'my-custom-attr';
    }
    get getter() {
        return this._getter;
    }
    set getter(newVal) {
        this._getter = newVal;
    }
    render() {
        return (h("div", { key: '65e9bb128ab56dbdc3ebdb15b48aa28c1c3203e3' }, h("div", { key: 'c832e49c0e94224566d6675b758ee69bc57666c1', class: "single" }, this.single), h("div", { key: '6a7fbd92f1d1953a92dcc01e966492cf08dd1f45', class: "multiWord" }, this.multiWord), h("div", { key: '6e8cb42dcd85ad2a7be9319ba27b763a2669c92b', class: "customAttr" }, this.customAttr), h("div", { key: '4d330677c69ab4745989fd88260483d588dfbddd', class: "getter" }, this.getter), h("div", { key: 'fc392467d8a428a6b17d077303ed3592c08353a7' }, h("label", { key: '09a28c57ae9c7ca21715e01499a1fa95e4ae3c4d', class: "htmlForLabel", htmlFor: 'a' }, "htmlFor"), h("input", { key: '0c1c714cb52e79d7beff56869c006613722380db', type: "checkbox", id: 'a' }))));
    }
}, [0, "attribute-basic", {
        "single": [1],
        "multiWord": [1, "multi-word"],
        "customAttr": [1, "my-custom-attr"],
        "getter": [6145]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeBasic);
            }
            break;
    } });
}

export { AttributeBasic as A, defineCustomElement as d };
