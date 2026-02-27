import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const stencilLogoSvg = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIyLjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPHBhdGggZD0iTTMzNi40LDBIMTc1LjZDNzksMCwwLDc5LDAsMTc1LjZ2MTYwLjhDMCw0MzMsNzksNTEyLDE3NS42LDUxMmgxNjAuOEM0MzMsNTEyLDUxMiw0MzMsNTEyLDMzNi40VjE3NS42CgkJQzUxMiw3OSw0MzMsMCwzMzYuNCwweiBNMzc1LjksMzM4LjFjMCwyNi45LTM5LDQ4LjgtNjUuOSw0OC44SDIwMmMtMjYuOSwwLTY1LjktMjEuOS02NS45LTQ4Ljh2LTIuNmgyMzkuOFYzMzguMXogTTM3NS45LDI4MS43CgkJSDIwMmMtMjYuOSwwLTY1LjktMjEuOS02NS45LTQ4Ljh2LTIuNkgzMTBjMjYuOSwwLDY1LjksMjEuOSw2NS45LDQ4LjhWMjgxLjd6IE0zNzUuOSwxNzYuNUgxMzYuMXYtMi42YzAtMjYuOSwzOS00OC44LDY1LjktNDguOAoJCWgxMDhjMjYuOSwwLDY1LjksMjEuOSw2NS45LDQ4LjhWMTc2LjV6Ii8+CjwvZz4KPC9zdmc+Cg==';

const ImageImport$1 = /*@__PURE__*/ proxyCustomElement(class ImageImport extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'f79dd0de864c665f9ae71f28f30dd2ca5d81554e' }, h("img", { key: '41b6a50e91c774e198289d6de01669909a93f4dc', src: stencilLogoSvg })));
    }
}, [0, "image-import"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["image-import"];
    components.forEach(tagName => { switch (tagName) {
        case "image-import":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ImageImport$1);
            }
            break;
    } });
}

const ImageImport = ImageImport$1;
const defineCustomElement = defineCustomElement$1;

export { ImageImport, defineCustomElement };
