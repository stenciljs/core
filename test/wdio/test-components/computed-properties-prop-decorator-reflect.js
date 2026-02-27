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
const ComputedPropertiesPropDecoratorReflect$1 = /*@__PURE__*/ proxyCustomElement(class ComputedPropertiesPropDecoratorReflect extends H {
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
        return h("div", { key: 'e557bd6b5fa81345042da4fcd8dc6ba5f8a81894' }, this.getText());
    }
}, [0, "computed-properties-prop-decorator-reflect", {
        "first": [513, "first-name"],
        "middle": [1],
        "last": [513, "last-name"]
    }]);
_a = Foo.BAR, _b = Foo.BAZ, _c = MyProp;
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["computed-properties-prop-decorator-reflect"];
    components.forEach(tagName => { switch (tagName) {
        case "computed-properties-prop-decorator-reflect":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ComputedPropertiesPropDecoratorReflect$1);
            }
            break;
    } });
}

const ComputedPropertiesPropDecoratorReflect = ComputedPropertiesPropDecoratorReflect$1;
const defineCustomElement = defineCustomElement$1;

export { ComputedPropertiesPropDecoratorReflect, defineCustomElement };
