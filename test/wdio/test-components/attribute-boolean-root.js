import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const AttributeBooleanRoot$1 = /*@__PURE__*/ proxyCustomElement(class AttributeBooleanRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.state = false;
    }
    async toggleState() {
        this.state = !this.state;
    }
    hostData() {
        return {
            readonly: this.state,
            tappable: this.state,
            str: this.state ? 'hello' : null,
            'aria-hidden': `${this.state}`,
            fixedtrue: 'true',
            fixedfalse: 'false',
            'no-appear': undefined,
            'no-appear2': false,
        };
    }
    __stencil_render() {
        const AttributeBoolean = 'attribute-boolean';
        return [
            h("button", { key: 'e922426843d88eacbf27ddc64c211c99448bab3a', onClick: this.toggleState.bind(this) }, "Toggle attributes"),
            h(AttributeBoolean, { key: '8e3b33f41eba3dd06de1fb0430ce7353e42d1f49', boolState: this.state, strState: this.state, noreflect: this.state, tappable: this.state, "aria-hidden": `${this.state}` }),
        ];
    }
    get el() { return this; }
    render() { return h(Host, this.hostData(), this.__stencil_render()); }
}, [0, "attribute-boolean-root", {
        "state": [32],
        "toggleState": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-boolean-root"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-boolean-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeBooleanRoot$1);
            }
            break;
    } });
}

const AttributeBooleanRoot = AttributeBooleanRoot$1;
const defineCustomElement = defineCustomElement$1;

export { AttributeBooleanRoot, defineCustomElement };
