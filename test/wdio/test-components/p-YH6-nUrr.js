import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-BmCyrFHA.js';

const LifecycleUpdateB = /*@__PURE__*/ proxyCustomElement(class LifecycleUpdateB extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.value = 0;
    }
    componentWillLoad() {
        this.start = Date.now();
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:red">lifecycle-update-b</span> <span style="color:blue">componentWillLoad</span> ${this.value}`;
        document.getElementById('output').appendChild(li);
        return new Promise((resolve) => {
            setTimeout(resolve, 20);
        });
    }
    componentDidLoad() {
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:red">lifecycle-update-b</span> <span style="color:green">componentDidLoad</span> ${this.value}`;
        document.getElementById('output').appendChild(li);
    }
    render() {
        return (h("section", { key: '683296981472a12076287cd71320328a396132e3' }, "lifecycle-update-b: ", this.value, h("lifecycle-update-c", { key: '8cc7f99d653beaa9bdd0e38c8bd8869848ad09ea', value: this.value })));
    }
}, [0, "lifecycle-update-b", {
        "value": [2]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-update-b", "lifecycle-update-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-update-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleUpdateB);
            }
            break;
        case "lifecycle-update-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { LifecycleUpdateB as L, defineCustomElement as d };
