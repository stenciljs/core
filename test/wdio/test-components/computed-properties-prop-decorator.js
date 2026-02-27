import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

var _a, _b, _c;
var Foo;
(function (Foo) {
    // names are explicitly different to ensure we aren't
    // just resolving the declaration name.
    Foo["BAR"] = "first";
    Foo["BAZ"] = "middle";
})(Foo || (Foo = {}));
const MyProp = 'last';
const ComputedPropertiesPropDecorator$1 = /*@__PURE__*/ proxyCustomElement(class ComputedPropertiesPropDecorator extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this[_a] = 'no';
        this[_b] = '';
        this[_c] = 'content';
    }
    getText() {
        return (this.first || '') + (this.middle ? ` ${this.middle}` : '') + (this.last ? ` ${this.last}` : '');
    }
    render() {
        return h("div", { key: '8e6a316c1956bc3377a0589127a7b3ad135a6456' }, this.getText());
    }
}, [0, "computed-properties-prop-decorator", {
        "first": [1],
        "middle": [1],
        "last": [1]
    }]);
_a = Foo.BAR, _b = Foo.BAZ, _c = MyProp;
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["computed-properties-prop-decorator"];
    components.forEach(tagName => { switch (tagName) {
        case "computed-properties-prop-decorator":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ComputedPropertiesPropDecorator$1);
            }
            break;
    } });
}

const ComputedPropertiesPropDecorator = ComputedPropertiesPropDecorator$1;
const defineCustomElement = defineCustomElement$1;

export { ComputedPropertiesPropDecorator, defineCustomElement };
