import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';

const LifecycleUpdateC = /*@__PURE__*/ proxyCustomElement(class LifecycleUpdateC extends H {
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
        li.innerHTML = `<span style="color:orange">lifecycle-update-c</span> <span style="color:blue">componentWillLoad</span> ${this.value}`;
        document.getElementById('output').appendChild(li);
        return new Promise((resolve) => {
            setTimeout(resolve, 30);
        });
    }
    componentDidLoad() {
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:orange">lifecycle-update-c</span> <span style="color:green">componentDidLoad</span> ${this.value}`;
        document.getElementById('output').appendChild(li);
    }
    render() {
        return h("span", { key: 'f52c263bbd40180a66d538adb810a1ff6b21afff' }, " - lifecycle-update-c: ", this.value);
    }
}, [0, "lifecycle-update-c", {
        "value": [2]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-update-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-update-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleUpdateC);
            }
            break;
    } });
}

export { LifecycleUpdateC as L, defineCustomElement as d };
