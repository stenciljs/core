import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';

function printLifecycle(cmp, lifecycle) {
    const elm = document.createElement(transformTag('div'));
    {
        const output = document.getElementById(`client-${lifecycle}`);
        elm.textContent = `${cmp} client ${lifecycle}`;
        output === null || output === void 0 ? void 0 : output.appendChild(elm);
    }
}

const cmpDCss = () => `${transformTag("cmp-d")}{display:block;padding:10px;background:lime}`;

const CmpD = /*@__PURE__*/ proxyCustomElement(class CmpD extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.uniqueId = '';
    }
    componentWillLoad() {
        printLifecycle(`CmpD - ${this.uniqueId}`, 'componentWillLoad');
    }
    componentDidLoad() {
        printLifecycle(`CmpD - ${this.uniqueId}`, 'componentDidLoad');
    }
    render() {
        return h("div", { key: '2bc8cbc44bf4e62115cc16253bf9af217d4980c8' }, "CmpD");
    }
    static get style() { return cmpDCss(); }
}, [0, "cmp-d", {
        "uniqueId": [1, "unique-id"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-d"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-d":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpD);
            }
            break;
    } });
}

export { CmpD as C, defineCustomElement as d, printLifecycle as p };
