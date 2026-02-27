import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const KeyReorder$1 = /*@__PURE__*/ proxyCustomElement(class KeyReorder extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.isReversed = false;
    }
    testClick() {
        this.isReversed = !this.isReversed;
    }
    render() {
        const items = [0, 1, 2, 3, 4];
        if (this.isReversed) {
            items.reverse();
        }
        return [
            h("button", { key: '02ba466e69a08a873172c7bc3fa13007cd56beb2', onClick: this.testClick.bind(this) }, "Test"),
            h("div", { key: '37b1ae1a2107976afb412ed74e92606b1c3cb0e7' }, items.map((item) => {
                return (h("div", { key: item, id: 'item-' + item }, item));
            })),
        ];
    }
}, [0, "key-reorder", {
        "isReversed": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["key-reorder"];
    components.forEach(tagName => { switch (tagName) {
        case "key-reorder":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), KeyReorder$1);
            }
            break;
    } });
}

const KeyReorder = KeyReorder$1;
const defineCustomElement = defineCustomElement$1;

export { KeyReorder, defineCustomElement };
