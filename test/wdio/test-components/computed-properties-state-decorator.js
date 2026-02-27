import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

var _a, _b;
var Foo;
(function (Foo) {
    // names are explicitly different to ensure we aren't
    // just resolving the declaration name.
    Foo["BAR"] = "rendered";
})(Foo || (Foo = {}));
const MyProp = 'mode';
const ComputedPropertiesStateDecorator$1 = /*@__PURE__*/ proxyCustomElement(class ComputedPropertiesStateDecorator extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this[_a] = false;
        this[_b] = 'default';
    }
    async changeStates() {
        this.rendered = true;
        this.mode = 'super';
    }
    render() {
        return (h("div", { key: '9de765ab9e71b2959753f3e250959f8b3da8f253' }, h("p", { key: 'd32853c769494fa726603d46c98f341b04a0d791' }, "Has rendered: ", this.rendered.toString()), h("p", { key: 'ae9857c6206d27631e2463150b0a2b4878ea0346' }, "Mode: ", this.mode)));
    }
}, [0, "computed-properties-state-decorator", {
        "rendered": [32],
        "mode": [32],
        "changeStates": [64]
    }]);
_a = Foo.BAR, _b = MyProp;
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["computed-properties-state-decorator"];
    components.forEach(tagName => { switch (tagName) {
        case "computed-properties-state-decorator":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ComputedPropertiesStateDecorator$1);
            }
            break;
    } });
}

const ComputedPropertiesStateDecorator = ComputedPropertiesStateDecorator$1;
const defineCustomElement = defineCustomElement$1;

export { ComputedPropertiesStateDecorator, defineCustomElement };
