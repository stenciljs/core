import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const AttributeHost$1 = /*@__PURE__*/ proxyCustomElement(class AttributeHost extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.attrsAdded = false;
    }
    testClick() {
        this.attrsAdded = !this.attrsAdded;
    }
    render() {
        const propsToRender = {};
        if (this.attrsAdded) {
            propsToRender.color = 'lime';
            propsToRender.content = 'attributes added';
            propsToRender.padding = true;
            propsToRender.margin = '';
            propsToRender.bold = 'true';
            propsToRender['no-attr'] = null;
        }
        else {
            propsToRender.content = 'attributes removed';
            propsToRender.padding = false;
            propsToRender.bold = 'false';
            propsToRender['no-attr'] = null;
        }
        return [
            h("button", { key: 'f56f9c7756496b5500400a1c97bae036f263eb70', onClick: this.testClick.bind(this) }, this.attrsAdded ? 'Remove' : 'Add', " Attributes"),
            h("section", Object.assign({ key: 'fff4d4eab01d33c81e46c227839f9781b3174365' }, propsToRender, { style: {
                    'border-color': this.attrsAdded ? 'black' : '',
                    display: this.attrsAdded ? 'block' : 'inline-block',
                    fontSize: this.attrsAdded ? '24px' : '',
                    '--css-var': this.attrsAdded ? '12' : '',
                } })),
        ];
    }
    static get style() { return `[color='lime'] {
      background: lime;
    }
    section::before {
      content: attr(content);
    }
    [padding='true'] {
      padding: 50px;
    }
    [margin] {
      margin: 50px;
    }
    [bold='true'] {
      font-weight: bold;
    }`; }
}, [0, "attribute-host", {
        "attrsAdded": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-host"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-host":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeHost$1);
            }
            break;
    } });
}

const AttributeHost = AttributeHost$1;
const defineCustomElement = defineCustomElement$1;

export { AttributeHost, defineCustomElement };
