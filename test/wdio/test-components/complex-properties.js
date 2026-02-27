import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ComplexProperties$1 = /*@__PURE__*/ proxyCustomElement(class ComplexProperties extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        var _a, _b;
        return (h("ul", { key: 'eeebeeb2b718e922e33e70360d68ae3b9513aade' }, h("li", { key: '586d194dc4da92e6ec98e304799561d08453fb86' }, `this.foo.bar`, ": ", this.foo.bar), h("li", { key: '849a845391de8f23150b6b5d3df9b3531adcad76' }, `this.foo.loo`, ": ", this.foo.loo.join(', ')), h("li", { key: '447b0d38a421b97a79c3f3e637dfeb5e2e6efa6b' }, `this.foo.qux`, ": ", typeof this.foo.qux.quux), h("li", { key: '995618c17bf82522a376fe8b36e6a8953dda77e1' }, `this.baz.get('foo')`, ": ", typeof ((_a = this.baz.get('foo')) === null || _a === void 0 ? void 0 : _a.qux)), h("li", { key: '6be16e2203c90ddbdc7ec8e2c7401df724420982' }, `this.quux.has('foo')`, ": ", this.quux.has('foo') ? 'true' : 'false'), h("li", { key: '2ab75b0552b7bba20eaa4f57b4ff5c1ec12c08a2' }, `this.grault`, ": ", this.grault === Infinity ? 'true' : 'false'), h("li", { key: 'e9c7eaa4ac700ae3a0b30b1af51705eda9c06472' }, `this.waldo`, ": ", this.waldo === null ? 'true' : 'false'), h("li", { key: '87719a8a634dec08c876611eafdabb452634a15f' }, `this.kidsNames`, ": ", (_b = this.kidsNames) === null || _b === void 0 ? void 0 :
            _b.join(', '))));
    }
}, [1, "complex-properties", {
        "foo": [16],
        "baz": [16],
        "quux": [16],
        "grault": [2],
        "waldo": [16],
        "kidsNames": [8, "kids-names"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["complex-properties"];
    components.forEach(tagName => { switch (tagName) {
        case "complex-properties":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ComplexProperties$1);
            }
            break;
    } });
}

const ComplexProperties = ComplexProperties$1;
const defineCustomElement = defineCustomElement$1;

export { ComplexProperties, defineCustomElement };
