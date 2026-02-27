import { p as proxyCustomElement, H, e as createEvent, h, t as transformTag } from './p-DYdAJnXF.js';

const esmImportCss = () => `:host{display:block;padding:20px;border:10px solid rgb(0, 0, 255);color:rgb(128, 0, 128);--color:rgb(0, 128, 0)}p{color:var(--color)}`;

const EsmImport$1 = /*@__PURE__*/ proxyCustomElement(class EsmImport extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.someEvent = createEvent(this, "someEvent");
        this.propVal = 0;
        this.isReady = 'false';
        this.listenVal = 0;
        this.someEventInc = 0;
    }
    testClick() {
        this.listenVal++;
    }
    async someMethod() {
        this.someEvent.emit();
    }
    testMethod() {
        this.el.someMethod();
    }
    componentWillLoad() {
        this.stateVal = 'mph';
        this.el.componentOnReady().then(() => {
            this.isReady = 'true';
        });
    }
    componentDidLoad() {
        this.el.parentElement.addEventListener('someEvent', () => {
            this.el.propVal++;
        });
    }
    render() {
        return (h("div", { key: '7c602d72e4490df4ea623aa5615386c7261bce08' }, h("h1", { key: '1f1fcfb06c2488faceb051dcea86e2389d03fb02' }, "esm-import"), h("span", { key: 'b774523e1e930d831c612ea1cfad6f4eacade9e3' }, "text color defined by :host"), h("p", { key: '0466e2da736d40141a32caab2b7cc5b2f6fed6e1', id: "propVal" }, "propVal: ", this.propVal), h("p", { key: 'beb2e45907124d027f3cca7bca27c071165359b4', id: "stateVal" }, "stateVal: ", this.stateVal), h("p", { key: '612725695425a901d69560e5cfaf35c3dca7be07', id: "listenVal" }, "listenVal: ", this.listenVal), h("p", { key: '5b7e7368641d5eb8a4a4140f98d7c855ebe1de25' }, h("button", { key: '458ccda680a232508e778db339cce26f81e1d744', onClick: this.testMethod.bind(this) }, "Test")), h("p", { key: '248e24efd43e3e066fe6c03abb146092fd72eb8d', id: "isReady" }, "componentOnReady: ", this.isReady)));
    }
    get el() { return this; }
    static get style() { return esmImportCss(); }
}, [1, "esm-import", {
        "propVal": [2, "prop-val"],
        "isReady": [32],
        "stateVal": [32],
        "listenVal": [32],
        "someEventInc": [32],
        "someMethod": [64]
    }, [[0, "click", "testClick"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["esm-import"];
    components.forEach(tagName => { switch (tagName) {
        case "esm-import":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), EsmImport$1);
            }
            break;
    } });
}

const EsmImport = EsmImport$1;
const defineCustomElement = defineCustomElement$1;

export { EsmImport, defineCustomElement };
