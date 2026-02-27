import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const DomReattach$1 = /*@__PURE__*/ proxyCustomElement(class DomReattach extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.willLoad = 0;
        this.didLoad = 0;
        this.didUnload = 0;
    }
    componentWillLoad() {
        this.willLoad++;
    }
    componentDidLoad() {
        this.didLoad++;
    }
    disconnectedCallback() {
        this.didUnload++;
    }
    render() {
        return (h("div", { key: '4e09c4483fdd5df5c4c88ae4e9c0c7eb60e56d68' }, h("p", { key: '81f995ba116bf650143e1bb3f98c0be182d9966f' }, "componentWillLoad: ", this.willLoad), h("p", { key: 'e208c6734cc835491fe9b5980e4493d30608a1f7' }, "componentDidLoad: ", this.didLoad), h("p", { key: 'ad887d99c83352c6b81780aba3ed59608fddea3d' }, "disconnectedCallback: ", this.didUnload)));
    }
}, [0, "dom-reattach", {
        "willLoad": [1026, "will-load"],
        "didLoad": [1026, "did-load"],
        "didUnload": [1026, "did-unload"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dom-reattach"];
    components.forEach(tagName => { switch (tagName) {
        case "dom-reattach":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DomReattach$1);
            }
            break;
    } });
}

const DomReattach = DomReattach$1;
const defineCustomElement = defineCustomElement$1;

export { DomReattach, defineCustomElement };
