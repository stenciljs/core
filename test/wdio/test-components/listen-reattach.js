import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const ListenReattach$1 = /*@__PURE__*/ proxyCustomElement(class ListenReattach extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.clicked = 0;
    }
    click() {
        this.clicked++;
    }
    render() {
        return (h(Host, { key: 'ac53dfa1063d7fa2340a19f37dcc6565bef8bf72' }, h("div", { key: 'd188c25c3290c0ce97b7d573a3634f416f236e16', id: "clicked" }, "Clicked: ", this.clicked)));
    }
    static get style() { return `.sc-listen-reattach-h { display: block; background: gray;}`; }
}, [2, "listen-reattach", {
        "clicked": [32]
    }, [[0, "click", "click"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["listen-reattach"];
    components.forEach(tagName => { switch (tagName) {
        case "listen-reattach":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ListenReattach$1);
            }
            break;
    } });
}

const ListenReattach = ListenReattach$1;
const defineCustomElement = defineCustomElement$1;

export { ListenReattach, defineCustomElement };
