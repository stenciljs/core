import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ListenWindow$1 = /*@__PURE__*/ proxyCustomElement(class ListenWindow extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.clicked = 0;
        this.scrolled = 0;
    }
    winClick() {
        this.clicked++;
    }
    winScroll() {
        this.scrolled++;
    }
    render() {
        return (h("div", { key: '9efc90e1dacf5fd9de434b59b8b2c4146ed0f907' }, h("div", { key: 'cff68c0195b74a0f23eb5410a9513e811b8ca4b7', id: "clicked" }, "Clicked: ", this.clicked), h("div", { key: '27d4652574f68e764f11dc35f52f7c86263e9035' }, "Scrolled: ", this.scrolled), h("button", { key: '35ca29de879e9f02cb4c8a08372dbb8ae572b88d' }, "Click!"), h("div", { key: '2ece05d4124e49a46c9003262d7be1c15136be6d', style: { background: 'gray', paddingTop: '2000px' } })));
    }
}, [0, "listen-window", {
        "clicked": [32],
        "scrolled": [32]
    }, [[8, "click", "winClick"], [9, "scroll", "winScroll"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["listen-window"];
    components.forEach(tagName => { switch (tagName) {
        case "listen-window":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ListenWindow$1);
            }
            break;
    } });
}

const ListenWindow = ListenWindow$1;
const defineCustomElement = defineCustomElement$1;

export { ListenWindow, defineCustomElement };
