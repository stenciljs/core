const NAMESPACE = 'testapp';
const BUILD = /* testapp */ { hotModuleReplacement: false, hydratedSelectorName: "hydrated", lazyLoad: false, shadowDom: true, slotRelocation: true, state: true, updatable: true};

/*
 Stencil Client Platform v4.43.1-dev.1772051958.852ff35 | MIT Licensed | https://stenciljs.com
 */

var Build = {
  isDev: false,
  isBrowser: true,
  isTesting: false
};

// src/utils/constants.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var HTML_NS = "http://www.w3.org/1999/xhtml";
var PrimitiveType = /* @__PURE__ */ ((PrimitiveType2) => {
  PrimitiveType2["Undefined"] = "undefined";
  PrimitiveType2["Null"] = "null";
  PrimitiveType2["String"] = "string";
  PrimitiveType2["Number"] = "number";
  PrimitiveType2["SpecialNumber"] = "number";
  PrimitiveType2["Boolean"] = "boolean";
  PrimitiveType2["BigInt"] = "bigint";
  return PrimitiveType2;
})(PrimitiveType || {});
var NonPrimitiveType = /* @__PURE__ */ ((NonPrimitiveType2) => {
  NonPrimitiveType2["Array"] = "array";
  NonPrimitiveType2["Date"] = "date";
  NonPrimitiveType2["Map"] = "map";
  NonPrimitiveType2["Object"] = "object";
  NonPrimitiveType2["RegularExpression"] = "regexp";
  NonPrimitiveType2["Set"] = "set";
  NonPrimitiveType2["Channel"] = "channel";
  NonPrimitiveType2["Symbol"] = "symbol";
  return NonPrimitiveType2;
})(NonPrimitiveType || {});
var TYPE_CONSTANT = "type";
var VALUE_CONSTANT = "value";
var SERIALIZED_PREFIX = "serialized:";

// src/utils/get-prop-descriptor.ts
function getPropertyDescriptor(obj, memberName, getOnly) {
  const stopAt = typeof HTMLElement !== "undefined" ? HTMLElement.prototype : null;
  while (obj && obj !== stopAt) {
    const desc = Object.getOwnPropertyDescriptor(obj, memberName);
    if (desc && (!getOnly || desc.get)) return desc;
    obj = Object.getPrototypeOf(obj);
  }
  return void 0;
}

// src/utils/es2022-rewire-class-members.ts
var reWireGetterSetter = (instance, hostRef) => {
  var _a;
  const cmpMeta = hostRef.$cmpMeta$;
  const members = Object.entries((_a = cmpMeta.$members$) != null ? _a : {});
  members.map(([memberName, [memberFlags]]) => {
    if ((memberFlags & 31 /* Prop */ || memberFlags & 32 /* State */)) {
      const ogValue = instance[memberName];
      const ogDescriptor = getPropertyDescriptor(Object.getPrototypeOf(instance), memberName, true) || Object.getOwnPropertyDescriptor(instance, memberName);
      if (ogDescriptor) {
        Object.defineProperty(instance, memberName, {
          get() {
            return ogDescriptor.get.call(this);
          },
          set(newValue) {
            ogDescriptor.set.call(this, newValue);
          },
          configurable: true,
          enumerable: true
        });
      }
      if (hostRef.$instanceValues$.has(memberName)) {
        instance[memberName] = hostRef.$instanceValues$.get(memberName);
      } else if (ogValue !== void 0) {
        instance[memberName] = ogValue;
      }
    }
  });
};

// src/client/client-host-ref.ts
var getHostRef = (ref) => {
  if (ref.__stencil__getHostRef) {
    return ref.__stencil__getHostRef();
  }
  return void 0;
};
var registerHost = (hostElement, cmpMeta) => {
  const hostRef = {
    $flags$: 0,
    $hostElement$: hostElement,
    $cmpMeta$: cmpMeta,
    $instanceValues$: /* @__PURE__ */ new Map(),
    $serializerValues$: /* @__PURE__ */ new Map()
  };
  {
    hostRef.$onReadyPromise$ = new Promise((r) => hostRef.$onReadyResolve$ = r);
    hostElement["s-p"] = [];
    hostElement["s-rc"] = [];
  }
  const ref = hostRef;
  hostElement.__stencil__getHostRef = () => ref;
  if (cmpMeta.$flags$ & 512 /* hasModernPropertyDecls */ && (BUILD.state)) {
    reWireGetterSetter(hostElement, hostRef);
  }
  return ref;
};
var isMemberInElement = (elm, memberName) => memberName in elm;
var consoleError = (e, el) => (0, console.error)(e, el);

// src/client/client-style.ts
var styles = /* @__PURE__ */ new Map();
var modeResolutionChain = [];

// src/runtime/runtime-constants.ts
var CONTENT_REF_ID = "r";
var ORG_LOCATION_ID = "o";
var SLOT_NODE_ID = "s";
var TEXT_NODE_ID = "t";
var COMMENT_NODE_ID = "c";
var HYDRATE_ID = "s-id";
var HYDRATED_STYLE_ID = "sty-id";
var HYDRATE_CHILD_ID = "c-id";
var SLOT_FB_CSS = "slot-fb{display:contents}slot-fb[hidden]{display:none}";
var XLINK_NS = "http://www.w3.org/1999/xlink";
var FORM_ASSOCIATED_CUSTOM_ELEMENT_CALLBACKS = [
  "formAssociatedCallback",
  "formResetCallback",
  "formDisabledCallback",
  "formStateRestoreCallback"
];
var win = typeof window !== "undefined" ? window : {};
var H = win.HTMLElement || class {
};
var plt = {
  $flags$: 0,
  $resourcesUrl$: "",
  jmp: (h2) => h2(),
  raf: (h2) => requestAnimationFrame(h2),
  ael: (el, eventName, listener, opts) => el.addEventListener(eventName, listener, opts),
  rel: (el, eventName, listener, opts) => el.removeEventListener(eventName, listener, opts),
  ce: (eventName, opts) => new CustomEvent(eventName, opts)
};
var supportsShadow = BUILD.shadowDom;
var supportsListenerOptions = /* @__PURE__ */ (() => {
  var _a;
  let supportsListenerOptions2 = false;
  try {
    (_a = win.document) == null ? void 0 : _a.addEventListener(
      "e",
      null,
      Object.defineProperty({}, "passive", {
        get() {
          supportsListenerOptions2 = true;
        }
      })
    );
  } catch (e) {
  }
  return supportsListenerOptions2;
})();
var promiseResolve = (v) => Promise.resolve(v);
var supportsConstructableStylesheets = /* @__PURE__ */ (() => {
  try {
    if (!win.document.adoptedStyleSheets) {
      return false;
    }
    new CSSStyleSheet();
    return typeof new CSSStyleSheet().replaceSync === "function";
  } catch (e) {
  }
  return false;
})() ;
var supportsMutableAdoptedStyleSheets = supportsConstructableStylesheets ? /* @__PURE__ */ (() => !!win.document && Object.getOwnPropertyDescriptor(win.document.adoptedStyleSheets, "length").writable)() : false;
var queuePending = false;
var queueDomReads = [];
var queueDomWrites = [];
var queueTask = (queue, write) => (cb) => {
  queue.push(cb);
  if (!queuePending) {
    queuePending = true;
    if (write && plt.$flags$ & 4 /* queueSync */) {
      nextTick(flush);
    } else {
      plt.raf(flush);
    }
  }
};
var consume = (queue) => {
  for (let i2 = 0; i2 < queue.length; i2++) {
    try {
      queue[i2](performance.now());
    } catch (e) {
      consoleError(e);
    }
  }
  queue.length = 0;
};
var flush = () => {
  consume(queueDomReads);
  {
    consume(queueDomWrites);
    if (queuePending = queueDomReads.length > 0) {
      plt.raf(flush);
    }
  }
};
var nextTick = (cb) => promiseResolve().then(cb);
var writeTask = /* @__PURE__ */ queueTask(queueDomWrites, true);

// src/runtime/asset-path.ts
var getAssetPath = (path) => {
  const assetUrl = new URL(path, plt.$resourcesUrl$);
  return assetUrl.origin !== win.location.origin ? assetUrl.href : assetUrl.pathname;
};
var setAssetPath = (path) => plt.$resourcesUrl$ = path;

// src/utils/style.ts
function createStyleSheetIfNeededAndSupported(styles2) {
  if (!supportsConstructableStylesheets) return void 0;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles2);
  return sheet;
}

// src/utils/shadow-root.ts
var globalStyleSheet;
function createShadowRoot(cmpMeta) {
  var _a;
  const opts = { mode: "open" };
  {
    opts.delegatesFocus = !!(cmpMeta.$flags$ & 16 /* shadowDelegatesFocus */);
  }
  {
    const isManual = !!(cmpMeta.$flags$ & 1024 /* shadowSlotAssignmentManual */);
    if (isManual) {
      opts.slotAssignment = "manual";
    }
  }
  const shadowRoot = this.attachShadow(opts);
  if (globalStyleSheet === void 0) globalStyleSheet = (_a = createStyleSheetIfNeededAndSupported(globalStyles)) != null ? _a : null;
  if (globalStyleSheet) {
    if (supportsMutableAdoptedStyleSheets) {
      shadowRoot.adoptedStyleSheets.push(globalStyleSheet);
    } else {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, globalStyleSheet];
    }
  } else if (!supportsConstructableStylesheets) {
    const styleElm = document.createElement("style");
    styleElm.innerHTML = globalStyles;
    shadowRoot.prepend(styleElm);
  }
}
var updateFallbackSlotVisibility = (elm) => {
  const childNodes = internalCall(elm, "childNodes");
  if (elm.tagName && elm.tagName.includes("-") && elm["s-cr"] && elm.tagName !== "SLOT-FB") {
    getHostSlotNodes(childNodes, elm.tagName).forEach((slotNode) => {
      if (slotNode.nodeType === 1 /* ElementNode */ && slotNode.tagName === "SLOT-FB") {
        if (getSlotChildSiblings(slotNode, getSlotName(slotNode), false).length) {
          slotNode.hidden = true;
        } else {
          slotNode.hidden = false;
        }
      }
    });
  }
  let i2 = 0;
  for (i2 = 0; i2 < childNodes.length; i2++) {
    const childNode = childNodes[i2];
    if (childNode.nodeType === 1 /* ElementNode */ && internalCall(childNode, "childNodes").length) {
      updateFallbackSlotVisibility(childNode);
    }
  }
};
var getSlottedChildNodes = (childNodes) => {
  const result = [];
  for (let i2 = 0; i2 < childNodes.length; i2++) {
    const slottedNode = childNodes[i2]["s-nr"] || void 0;
    if (slottedNode && slottedNode.isConnected) {
      result.push(slottedNode);
    }
  }
  return result;
};
function getHostSlotNodes(childNodes, hostName, slotName) {
  let i2 = 0;
  let slottedNodes = [];
  let childNode;
  for (; i2 < childNodes.length; i2++) {
    childNode = childNodes[i2];
    if (childNode["s-sr"] && (!hostName || childNode["s-hn"] === hostName) && (slotName === void 0 || getSlotName(childNode) === slotName)) {
      slottedNodes.push(childNode);
      if (typeof slotName !== "undefined") return slottedNodes;
    }
    slottedNodes = [...slottedNodes, ...getHostSlotNodes(childNode.childNodes, hostName, slotName)];
  }
  return slottedNodes;
}
var getSlotChildSiblings = (slot, slotName, includeSlot = true) => {
  const childNodes = [];
  if (includeSlot && slot["s-sr"] || !slot["s-sr"]) childNodes.push(slot);
  let node = slot;
  while (node = node.nextSibling) {
    if (getSlotName(node) === slotName && (includeSlot || !node["s-sr"])) childNodes.push(node);
  }
  return childNodes;
};
var isNodeLocatedInSlot = (nodeToRelocate, slotName) => {
  if (nodeToRelocate.nodeType === 1 /* ElementNode */) {
    if (nodeToRelocate.getAttribute("slot") === null && slotName === "") {
      return true;
    }
    if (nodeToRelocate.getAttribute("slot") === slotName) {
      return true;
    }
    return false;
  }
  if (nodeToRelocate["s-sn"] === slotName) {
    return true;
  }
  return slotName === "";
};
var addSlotRelocateNode = (newChild, slotNode, prepend, position) => {
  if (newChild["s-ol"] && newChild["s-ol"].isConnected) {
    return;
  }
  const slottedNodeLocation = document.createTextNode("");
  slottedNodeLocation["s-nr"] = newChild;
  if (!slotNode["s-cr"] || !slotNode["s-cr"].parentNode) return;
  const parent = slotNode["s-cr"].parentNode;
  const appendMethod = prepend ? internalCall(parent, "prepend") : internalCall(parent, "appendChild");
  if (typeof position !== "undefined") {
    slottedNodeLocation["s-oo"] = position;
    const childNodes = internalCall(parent, "childNodes");
    const slotRelocateNodes = [slottedNodeLocation];
    childNodes.forEach((n) => {
      if (n["s-nr"]) slotRelocateNodes.push(n);
    });
    slotRelocateNodes.sort((a, b) => {
      if (!a["s-oo"] || a["s-oo"] < (b["s-oo"] || 0)) return -1;
      else if (!b["s-oo"] || b["s-oo"] < a["s-oo"]) return 1;
      return 0;
    });
    slotRelocateNodes.forEach((n) => appendMethod.call(parent, n));
  } else {
    appendMethod.call(parent, slottedNodeLocation);
  }
  newChild["s-ol"] = slottedNodeLocation;
  newChild["s-sh"] = slotNode["s-hn"];
};
var getSlotName = (node) => typeof node["s-sn"] === "string" ? node["s-sn"] : node.nodeType === 1 && node.getAttribute("slot") || void 0;
function patchSlotNode(node) {
  if (node.assignedElements || node.assignedNodes || !node["s-sr"]) return;
  const assignedFactory = (elementsOnly) => (function(opts) {
    const toReturn = [];
    const slotName = this["s-sn"];
    if (opts == null ? void 0 : opts.flatten) {
      console.error(`
          Flattening is not supported for Stencil non-shadow slots.
          You can use \`.childNodes\` to nested slot fallback content.
          If you have a particular use case, please open an issue on the Stencil repo.
        `);
    }
    const parent = this["s-cr"].parentElement;
    const slottedNodes = parent.__childNodes ? parent.childNodes : getSlottedChildNodes(parent.childNodes);
    slottedNodes.forEach((n) => {
      if (slotName === getSlotName(n)) {
        toReturn.push(n);
      }
    });
    if (elementsOnly) {
      return toReturn.filter((n) => n.nodeType === 1 /* ElementNode */);
    }
    return toReturn;
  }).bind(node);
  node.assignedElements = assignedFactory(true);
  node.assignedNodes = assignedFactory(false);
}
function dispatchSlotChangeEvent(elm) {
  elm.dispatchEvent(new CustomEvent("slotchange", { bubbles: false, cancelable: false, composed: false }));
}
function findSlotFromSlottedNode(slottedNode, parentHost) {
  var _a;
  parentHost = parentHost || ((_a = slottedNode["s-ol"]) == null ? void 0 : _a.parentElement);
  if (!parentHost) return { slotNode: null, slotName: "" };
  const slotName = slottedNode["s-sn"] = getSlotName(slottedNode) || "";
  const childNodes = internalCall(parentHost, "childNodes");
  const slotNode = getHostSlotNodes(childNodes, parentHost.tagName, slotName)[0];
  return { slotNode, slotName };
}

// src/runtime/dom-extras.ts
var patchPseudoShadowDom = (hostElementPrototype) => {
  patchCloneNode(hostElementPrototype);
  patchSlotAppendChild(hostElementPrototype);
  patchSlotAppend(hostElementPrototype);
  patchSlotPrepend(hostElementPrototype);
  patchSlotInsertAdjacentElement(hostElementPrototype);
  patchSlotInsertAdjacentHTML(hostElementPrototype);
  patchSlotInsertAdjacentText(hostElementPrototype);
  patchInsertBefore(hostElementPrototype);
  patchTextContent(hostElementPrototype);
  patchChildSlotNodes(hostElementPrototype);
  patchSlotRemoveChild(hostElementPrototype);
};
var patchCloneNode = (HostElementPrototype) => {
  if (HostElementPrototype.__cloneNode) return;
  const orgCloneNode = HostElementPrototype.__cloneNode = HostElementPrototype.cloneNode;
  HostElementPrototype.cloneNode = function(deep) {
    const srcNode = this;
    const isShadowDom = srcNode.shadowRoot && supportsShadow ;
    const clonedNode = orgCloneNode.call(srcNode, isShadowDom ? deep : false);
    if (!isShadowDom && deep) {
      let i2 = 0;
      let slotted, nonStencilNode;
      const stencilPrivates = [
        "s-id",
        "s-cr",
        "s-lr",
        "s-rc",
        "s-sc",
        "s-p",
        "s-cn",
        "s-sr",
        "s-sn",
        "s-hn",
        "s-ol",
        "s-nr",
        "s-si",
        "s-rf",
        "s-scs"
      ];
      const childNodes = this.__childNodes || this.childNodes;
      for (; i2 < childNodes.length; i2++) {
        slotted = childNodes[i2]["s-nr"];
        nonStencilNode = stencilPrivates.every((privateField) => !childNodes[i2][privateField]);
        if (slotted) {
          if (clonedNode.__appendChild) {
            clonedNode.__appendChild(slotted.cloneNode(true));
          } else {
            clonedNode.appendChild(slotted.cloneNode(true));
          }
        }
        if (nonStencilNode) {
          clonedNode.appendChild(childNodes[i2].cloneNode(true));
        }
      }
    }
    return clonedNode;
  };
};
var patchSlotAppendChild = (HostElementPrototype) => {
  if (HostElementPrototype.__appendChild) return;
  HostElementPrototype.__appendChild = HostElementPrototype.appendChild;
  HostElementPrototype.appendChild = function(newChild) {
    const { slotName, slotNode } = findSlotFromSlottedNode(newChild, this);
    if (slotNode) {
      addSlotRelocateNode(newChild, slotNode);
      const slotChildNodes = getSlotChildSiblings(slotNode, slotName);
      const appendAfter = slotChildNodes[slotChildNodes.length - 1];
      const parent = internalCall(appendAfter, "parentNode");
      const insertedNode = internalCall(parent, "insertBefore")(newChild, appendAfter.nextSibling);
      dispatchSlotChangeEvent(slotNode);
      updateFallbackSlotVisibility(this);
      return insertedNode;
    }
    return this.__appendChild(newChild);
  };
};
var patchSlotRemoveChild = (ElementPrototype) => {
  if (ElementPrototype.__removeChild) return;
  ElementPrototype.__removeChild = ElementPrototype.removeChild;
  ElementPrototype.removeChild = function(toRemove) {
    if (toRemove && typeof toRemove["s-sn"] !== "undefined") {
      const childNodes = this.__childNodes || this.childNodes;
      const slotNode = getHostSlotNodes(childNodes, this.tagName, toRemove["s-sn"]);
      if (slotNode && toRemove.isConnected) {
        toRemove.remove();
        updateFallbackSlotVisibility(this);
        return;
      }
    }
    return this.__removeChild(toRemove);
  };
};
var patchSlotPrepend = (HostElementPrototype) => {
  if (HostElementPrototype.__prepend) return;
  HostElementPrototype.__prepend = HostElementPrototype.prepend;
  HostElementPrototype.prepend = function(...newChildren) {
    newChildren.forEach((newChild) => {
      if (typeof newChild === "string") {
        newChild = this.ownerDocument.createTextNode(newChild);
      }
      const slotName = (newChild["s-sn"] = getSlotName(newChild)) || "";
      const childNodes = internalCall(this, "childNodes");
      const slotNode = getHostSlotNodes(childNodes, this.tagName, slotName)[0];
      if (slotNode) {
        addSlotRelocateNode(newChild, slotNode, true);
        const slotChildNodes = getSlotChildSiblings(slotNode, slotName);
        const appendAfter = slotChildNodes[0];
        const parent = internalCall(appendAfter, "parentNode");
        const toReturn = internalCall(parent, "insertBefore")(newChild, internalCall(appendAfter, "nextSibling"));
        dispatchSlotChangeEvent(slotNode);
        return toReturn;
      }
      if (newChild.nodeType === 1 && !!newChild.getAttribute("slot")) {
        newChild.hidden = true;
      }
      return HostElementPrototype.__prepend(newChild);
    });
  };
};
var patchSlotAppend = (HostElementPrototype) => {
  if (HostElementPrototype.__append) return;
  HostElementPrototype.__append = HostElementPrototype.append;
  HostElementPrototype.append = function(...newChildren) {
    newChildren.forEach((newChild) => {
      if (typeof newChild === "string") {
        newChild = this.ownerDocument.createTextNode(newChild);
      }
      this.appendChild(newChild);
    });
  };
};
var patchSlotInsertAdjacentHTML = (HostElementPrototype) => {
  if (HostElementPrototype.__insertAdjacentHTML) return;
  const originalInsertAdjacentHtml = HostElementPrototype.insertAdjacentHTML;
  HostElementPrototype.insertAdjacentHTML = function(position, text) {
    if (position !== "afterbegin" && position !== "beforeend") {
      return originalInsertAdjacentHtml.call(this, position, text);
    }
    const container = this.ownerDocument.createElement("_");
    let node;
    container.innerHTML = text;
    if (position === "afterbegin") {
      while (node = container.firstChild) {
        this.prepend(node);
      }
    } else if (position === "beforeend") {
      while (node = container.firstChild) {
        this.append(node);
      }
    }
  };
};
var patchSlotInsertAdjacentText = (HostElementPrototype) => {
  HostElementPrototype.insertAdjacentText = function(position, text) {
    this.insertAdjacentHTML(position, text);
  };
};
var patchInsertBefore = (HostElementPrototype) => {
  if (HostElementPrototype.__insertBefore) return;
  const eleProto = HostElementPrototype;
  if (eleProto.__insertBefore) return;
  eleProto.__insertBefore = HostElementPrototype.insertBefore;
  HostElementPrototype.insertBefore = function(newChild, currentChild) {
    const { slotName, slotNode } = findSlotFromSlottedNode(newChild, this);
    const slottedNodes = this.__childNodes ? this.childNodes : getSlottedChildNodes(this.childNodes);
    if (slotNode) {
      let found = false;
      slottedNodes.forEach((childNode) => {
        if (childNode === currentChild || currentChild === null) {
          found = true;
          if (currentChild === null || slotName !== currentChild["s-sn"]) {
            this.appendChild(newChild);
            return;
          }
          if (slotName === currentChild["s-sn"]) {
            addSlotRelocateNode(newChild, slotNode);
            const parent = internalCall(currentChild, "parentNode");
            internalCall(parent, "insertBefore")(newChild, currentChild);
            dispatchSlotChangeEvent(slotNode);
          }
          return;
        }
      });
      if (found) return newChild;
    }
    const parentNode = currentChild == null ? void 0 : currentChild.__parentNode;
    if (parentNode && !this.isSameNode(parentNode)) {
      return this.appendChild(newChild);
    }
    return this.__insertBefore(newChild, currentChild);
  };
};
var patchSlotInsertAdjacentElement = (HostElementPrototype) => {
  if (HostElementPrototype.__insertAdjacentElement) return;
  const originalInsertAdjacentElement = HostElementPrototype.insertAdjacentElement;
  HostElementPrototype.insertAdjacentElement = function(position, element) {
    if (position !== "afterbegin" && position !== "beforeend") {
      return originalInsertAdjacentElement.call(this, position, element);
    }
    if (position === "afterbegin") {
      this.prepend(element);
      return element;
    } else if (position === "beforeend") {
      this.append(element);
      return element;
    }
    return element;
  };
};
var patchTextContent = (hostElementPrototype) => {
  patchHostOriginalAccessor("textContent", hostElementPrototype);
  Object.defineProperty(hostElementPrototype, "textContent", {
    get: function() {
      let text = "";
      const childNodes = this.__childNodes ? this.childNodes : getSlottedChildNodes(this.childNodes);
      childNodes.forEach((node) => text += node.textContent || "");
      return text;
    },
    set: function(value) {
      const childNodes = this.__childNodes ? this.childNodes : getSlottedChildNodes(this.childNodes);
      childNodes.forEach((node) => {
        if (node["s-ol"]) node["s-ol"].remove();
        node.remove();
      });
      this.insertAdjacentHTML("beforeend", value);
    }
  });
};
var patchChildSlotNodes = (elm) => {
  class FakeNodeList extends Array {
    item(n) {
      return this[n];
    }
  }
  patchHostOriginalAccessor("children", elm);
  Object.defineProperty(elm, "children", {
    get() {
      return this.childNodes.filter((n) => n.nodeType === 1);
    }
  });
  Object.defineProperty(elm, "childElementCount", {
    get() {
      return this.children.length;
    }
  });
  patchHostOriginalAccessor("firstChild", elm);
  Object.defineProperty(elm, "firstChild", {
    get() {
      return this.childNodes[0];
    }
  });
  patchHostOriginalAccessor("lastChild", elm);
  Object.defineProperty(elm, "lastChild", {
    get() {
      return this.childNodes[this.childNodes.length - 1];
    }
  });
  patchHostOriginalAccessor("childNodes", elm);
  Object.defineProperty(elm, "childNodes", {
    get() {
      const result = new FakeNodeList();
      result.push(...getSlottedChildNodes(this.__childNodes));
      return result;
    }
  });
};
var patchSlottedNode = (node) => {
  if (!node || node.__nextSibling !== void 0 || !globalThis.Node) return;
  patchNextSibling(node);
  patchPreviousSibling(node);
  patchParentNode(node);
  if (node.nodeType === Node.ELEMENT_NODE) {
    patchNextElementSibling(node);
    patchPreviousElementSibling(node);
  }
};
var patchNextSibling = (node) => {
  if (!node || node.__nextSibling) return;
  patchHostOriginalAccessor("nextSibling", node);
  Object.defineProperty(node, "nextSibling", {
    get: function() {
      var _a;
      const parentNodes = (_a = this["s-ol"]) == null ? void 0 : _a.parentNode.childNodes;
      const index = parentNodes == null ? void 0 : parentNodes.indexOf(this);
      if (parentNodes && index > -1) {
        return parentNodes[index + 1];
      }
      return this.__nextSibling;
    }
  });
};
var patchNextElementSibling = (element) => {
  if (!element || element.__nextElementSibling) return;
  patchHostOriginalAccessor("nextElementSibling", element);
  Object.defineProperty(element, "nextElementSibling", {
    get: function() {
      var _a;
      const parentEles = (_a = this["s-ol"]) == null ? void 0 : _a.parentNode.children;
      const index = parentEles == null ? void 0 : parentEles.indexOf(this);
      if (parentEles && index > -1) {
        return parentEles[index + 1];
      }
      return this.__nextElementSibling;
    }
  });
};
var patchPreviousSibling = (node) => {
  if (!node || node.__previousSibling) return;
  patchHostOriginalAccessor("previousSibling", node);
  Object.defineProperty(node, "previousSibling", {
    get: function() {
      var _a;
      const parentNodes = (_a = this["s-ol"]) == null ? void 0 : _a.parentNode.childNodes;
      const index = parentNodes == null ? void 0 : parentNodes.indexOf(this);
      if (parentNodes && index > -1) {
        return parentNodes[index - 1];
      }
      return this.__previousSibling;
    }
  });
};
var patchPreviousElementSibling = (element) => {
  if (!element || element.__previousElementSibling) return;
  patchHostOriginalAccessor("previousElementSibling", element);
  Object.defineProperty(element, "previousElementSibling", {
    get: function() {
      var _a;
      const parentNodes = (_a = this["s-ol"]) == null ? void 0 : _a.parentNode.children;
      const index = parentNodes == null ? void 0 : parentNodes.indexOf(this);
      if (parentNodes && index > -1) {
        return parentNodes[index - 1];
      }
      return this.__previousElementSibling;
    }
  });
};
var patchParentNode = (node) => {
  if (!node || node.__parentNode) return;
  patchHostOriginalAccessor("parentNode", node);
  Object.defineProperty(node, "parentNode", {
    get: function() {
      var _a;
      return ((_a = this["s-ol"]) == null ? void 0 : _a.parentNode) || this.__parentNode;
    },
    set: function(value) {
      this.__parentNode = value;
    }
  });
};
var validElementPatches = ["children", "nextElementSibling", "previousElementSibling"];
var validNodesPatches = [
  "childNodes",
  "firstChild",
  "lastChild",
  "nextSibling",
  "previousSibling",
  "textContent",
  "parentNode"
];
function patchHostOriginalAccessor(accessorName, node) {
  if (!globalThis.Node || !globalThis.Element) {
    return;
  }
  let accessor;
  if (validElementPatches.includes(accessorName)) {
    accessor = Object.getOwnPropertyDescriptor(Element.prototype, accessorName);
  } else if (validNodesPatches.includes(accessorName)) {
    accessor = Object.getOwnPropertyDescriptor(Node.prototype, accessorName);
  }
  if (!accessor) {
    accessor = Object.getOwnPropertyDescriptor(node, accessorName);
  }
  if (accessor) Object.defineProperty(node, "__" + accessorName, accessor);
}
function internalCall(node, method) {
  if ("__" + method in node) {
    const toReturn = node["__" + method];
    if (typeof toReturn !== "function") return toReturn;
    return toReturn.bind(node);
  } else {
    if (typeof node[method] !== "function") return node[method];
    return node[method].bind(node);
  }
}
var createTime = (fnName, tagName = "") => {
  {
    return () => {
      return;
    };
  }
};

// src/utils/query-nonce-meta-tag-content.ts
function queryNonceMetaTagContent(doc) {
  var _a, _b, _c;
  return (_c = (_b = (_a = doc.head) == null ? void 0 : _a.querySelector('meta[name="csp-nonce"]')) == null ? void 0 : _b.getAttribute("content")) != null ? _c : void 0;
}

// src/runtime/styles.ts
var rootAppliedStyles = /* @__PURE__ */ new WeakMap();
var registerStyle = (scopeId2, cssText, allowCS) => {
  let style = styles.get(scopeId2);
  if (supportsConstructableStylesheets && allowCS) {
    style = style || new CSSStyleSheet();
    if (typeof style === "string") {
      style = cssText;
    } else {
      style.replaceSync(cssText);
    }
  } else {
    style = cssText;
  }
  styles.set(scopeId2, style);
};
var addStyle = (styleContainerNode, cmpMeta, mode) => {
  var _a, _b, _c;
  const scopeId2 = getScopeId(cmpMeta, mode);
  const style = styles.get(scopeId2);
  if (!win.document) {
    return scopeId2;
  }
  styleContainerNode = styleContainerNode.nodeType === 11 /* DocumentFragment */ ? styleContainerNode : win.document;
  if (style) {
    if (typeof style === "string") {
      styleContainerNode = styleContainerNode.head || styleContainerNode;
      let appliedStyles = rootAppliedStyles.get(styleContainerNode);
      let styleElm;
      if (!appliedStyles) {
        rootAppliedStyles.set(styleContainerNode, appliedStyles = /* @__PURE__ */ new Set());
      }
      const existingStyleElm = styleContainerNode.querySelector(`[${HYDRATED_STYLE_ID}="${scopeId2}"]`);
      if (existingStyleElm) {
        existingStyleElm.textContent = style;
      } else if (!appliedStyles.has(scopeId2)) {
        styleElm = win.document.createElement("style");
        styleElm.textContent = style;
        const nonce = (_a = plt.$nonce$) != null ? _a : queryNonceMetaTagContent(win.document);
        if (nonce != null) {
          styleElm.setAttribute("nonce", nonce);
        }
        if (!(cmpMeta.$flags$ & 1 /* shadowDomEncapsulation */)) {
          if (styleContainerNode.nodeName === "HEAD") {
            const preconnectLinks = styleContainerNode.querySelectorAll("link[rel=preconnect]");
            const referenceNode2 = preconnectLinks.length > 0 ? preconnectLinks[preconnectLinks.length - 1].nextSibling : styleContainerNode.querySelector("style");
            styleContainerNode.insertBefore(
              styleElm,
              (referenceNode2 == null ? void 0 : referenceNode2.parentNode) === styleContainerNode ? referenceNode2 : null
            );
          } else if ("host" in styleContainerNode) {
            if (supportsConstructableStylesheets) {
              const currentWindow = (_b = styleContainerNode.defaultView) != null ? _b : styleContainerNode.ownerDocument.defaultView;
              const stylesheet = new currentWindow.CSSStyleSheet();
              stylesheet.replaceSync(style);
              if (supportsMutableAdoptedStyleSheets) {
                styleContainerNode.adoptedStyleSheets.unshift(stylesheet);
              } else {
                styleContainerNode.adoptedStyleSheets = [stylesheet, ...styleContainerNode.adoptedStyleSheets];
              }
            } else {
              const existingStyleContainer = styleContainerNode.querySelector("style");
              if (existingStyleContainer && true) {
                existingStyleContainer.textContent = style + existingStyleContainer.textContent;
              } else {
                styleContainerNode.prepend(styleElm);
              }
            }
          } else {
            styleContainerNode.append(styleElm);
          }
        }
        if (cmpMeta.$flags$ & 1 /* shadowDomEncapsulation */) {
          styleContainerNode.insertBefore(styleElm, null);
        }
        if (cmpMeta.$flags$ & 4 /* hasSlotRelocation */) {
          styleElm.textContent += SLOT_FB_CSS;
        }
        if (appliedStyles) {
          appliedStyles.add(scopeId2);
        }
      }
    } else {
      let appliedStyles = rootAppliedStyles.get(styleContainerNode);
      if (!appliedStyles) {
        rootAppliedStyles.set(styleContainerNode, appliedStyles = /* @__PURE__ */ new Set());
      }
      if (!appliedStyles.has(scopeId2)) {
        const currentWindow = (_c = styleContainerNode.defaultView) != null ? _c : styleContainerNode.ownerDocument.defaultView;
        let stylesheet;
        if (style.constructor === currentWindow.CSSStyleSheet) {
          stylesheet = style;
        } else {
          stylesheet = new currentWindow.CSSStyleSheet();
          for (let i2 = 0; i2 < style.cssRules.length; i2++) {
            stylesheet.insertRule(style.cssRules[i2].cssText, i2);
          }
        }
        if (supportsMutableAdoptedStyleSheets) {
          styleContainerNode.adoptedStyleSheets.push(stylesheet);
        } else {
          styleContainerNode.adoptedStyleSheets = [...styleContainerNode.adoptedStyleSheets, stylesheet];
        }
        appliedStyles.add(scopeId2);
        if ("host" in styleContainerNode) {
          const ssrStyleElm = styleContainerNode.querySelector(`[${HYDRATED_STYLE_ID}="${scopeId2}"]`);
          if (ssrStyleElm) {
            writeTask(() => ssrStyleElm.remove());
          }
        }
      }
    }
  }
  return scopeId2;
};
var attachStyles = (hostRef) => {
  const cmpMeta = hostRef.$cmpMeta$;
  const elm = hostRef.$hostElement$;
  const flags = cmpMeta.$flags$;
  const endAttachStyles = createTime("attachStyles", cmpMeta.$tagName$);
  const scopeId2 = addStyle(
    elm.shadowRoot ? elm.shadowRoot : elm.getRootNode(),
    cmpMeta,
    hostRef.$modeName$
  );
  if (flags & 10 /* needsScopedEncapsulation */) {
    elm["s-sc"] = scopeId2;
    elm.classList.add(scopeId2 + "-h");
  }
  endAttachStyles();
};
var getScopeId = (cmp, mode) => "sc-" + (mode && cmp.$flags$ & 32 /* hasMode */ ? cmp.$tagName$ + "-" + mode : cmp.$tagName$);
var convertScopedToShadow = (css) => css.replace(/\/\*!@([^\/]+)\*\/[^\{]+\{/g, "$1{");
var hydrateScopedToShadow = () => {
  if (!win.document) {
    return;
  }
  const styles2 = win.document.querySelectorAll(`[${HYDRATED_STYLE_ID}]`);
  let i2 = 0;
  for (; i2 < styles2.length; i2++) {
    registerStyle(styles2[i2].getAttribute(HYDRATED_STYLE_ID), convertScopedToShadow(styles2[i2].innerHTML), true);
  }
};

// src/utils/helpers.ts
var isDef = (v) => v != null && v !== void 0;
var isComplexType = (o) => {
  o = typeof o;
  return o === "object" || o === "function";
};

// src/runtime/vdom/h.ts
var h = (nodeName, vnodeData, ...children) => {
  if (typeof nodeName === "string") {
    nodeName = transformTag(nodeName);
  }
  let child = null;
  let key = null;
  let slotName = null;
  let simple = false;
  let lastSimple = false;
  const vNodeChildren = [];
  const walk = (c) => {
    for (let i2 = 0; i2 < c.length; i2++) {
      child = c[i2];
      if (Array.isArray(child)) {
        walk(child);
      } else if (child != null && typeof child !== "boolean") {
        if (simple = typeof nodeName !== "function" && !isComplexType(child)) {
          child = String(child);
        }
        if (simple && lastSimple) {
          vNodeChildren[vNodeChildren.length - 1].$text$ += child;
        } else {
          vNodeChildren.push(simple ? newVNode(null, child) : child);
        }
        lastSimple = simple;
      }
    }
  };
  walk(children);
  if (vnodeData) {
    if (vnodeData.key) {
      key = vnodeData.key;
    }
    if (vnodeData.name) {
      slotName = vnodeData.name;
    }
    {
      const classData = vnodeData.className || vnodeData.class;
      if (classData) {
        vnodeData.class = typeof classData !== "object" ? classData : Object.keys(classData).filter((k) => classData[k]).join(" ");
      }
    }
  }
  if (typeof nodeName === "function") {
    return nodeName(
      vnodeData === null ? {} : vnodeData,
      vNodeChildren,
      vdomFnUtils
    );
  }
  const vnode = newVNode(nodeName, null);
  vnode.$attrs$ = vnodeData;
  if (vNodeChildren.length > 0) {
    vnode.$children$ = vNodeChildren;
  }
  {
    vnode.$key$ = key;
  }
  {
    vnode.$name$ = slotName;
  }
  return vnode;
};
var newVNode = (tag, text) => {
  const vnode = {
    $flags$: 0,
    $tag$: tag,
    // Normalize undefined to null to prevent rendering "undefined" as text
    $text$: text != null ? text : null,
    $elm$: null,
    $children$: null
  };
  {
    vnode.$attrs$ = null;
  }
  {
    vnode.$key$ = null;
  }
  {
    vnode.$name$ = null;
  }
  return vnode;
};
var Host = {};
var isHost = (node) => node && node.$tag$ === Host;
var vdomFnUtils = {
  forEach: (children, cb) => children.map(convertToPublic).forEach(cb),
  map: (children, cb) => children.map(convertToPublic).map(cb).map(convertToPrivate)
};
var convertToPublic = (node) => ({
  vattrs: node.$attrs$,
  vchildren: node.$children$,
  vkey: node.$key$,
  vname: node.$name$,
  vtag: node.$tag$,
  vtext: node.$text$
});
var convertToPrivate = (node) => {
  if (typeof node.vtag === "function") {
    const vnodeData = { ...node.vattrs };
    if (node.vkey) {
      vnodeData.key = node.vkey;
    }
    if (node.vname) {
      vnodeData.name = node.vname;
    }
    return h(node.vtag, vnodeData, ...node.vchildren || []);
  }
  const vnode = newVNode(node.vtag, node.vtext);
  vnode.$attrs$ = node.vattrs;
  vnode.$children$ = node.vchildren;
  vnode.$key$ = node.vkey;
  vnode.$name$ = node.vname;
  return vnode;
};

// src/runtime/client-hydrate.ts
var initializeClientHydrate = (hostElm, tagName, hostId, hostRef) => {
  var _a, _b, _c, _d;
  const endHydrate = createTime("hydrateClient", tagName);
  const shadowRoot = hostElm.shadowRoot;
  const childRenderNodes = [];
  const slotNodes = [];
  const slottedNodes = [];
  const shadowRootNodes = shadowRoot ? [] : null;
  const vnode = newVNode(tagName, null);
  vnode.$elm$ = hostElm;
  let scopeId2;
  {
    const cmpMeta = hostRef.$cmpMeta$;
    if (cmpMeta && cmpMeta.$flags$ & 10 /* needsScopedEncapsulation */ && hostElm["s-sc"]) {
      scopeId2 = hostElm["s-sc"];
      hostElm.classList.add(scopeId2 + "-h");
    } else if (hostElm["s-sc"]) {
      delete hostElm["s-sc"];
    }
  }
  if (win.document && (!plt.$orgLocNodes$ || !plt.$orgLocNodes$.size)) {
    initializeDocumentHydrate(win.document.body, plt.$orgLocNodes$ = /* @__PURE__ */ new Map());
  }
  hostElm[HYDRATE_ID] = hostId;
  hostElm.removeAttribute(HYDRATE_ID);
  hostRef.$vnode$ = clientHydrate(
    vnode,
    childRenderNodes,
    slotNodes,
    shadowRootNodes,
    hostElm,
    hostElm,
    hostId,
    slottedNodes
  );
  let crIndex = 0;
  const crLength = childRenderNodes.length;
  let childRenderNode;
  for (crIndex; crIndex < crLength; crIndex++) {
    childRenderNode = childRenderNodes[crIndex];
    const orgLocationId = childRenderNode.$hostId$ + "." + childRenderNode.$nodeId$;
    const orgLocationNode = plt.$orgLocNodes$.get(orgLocationId);
    const node = childRenderNode.$elm$;
    if (!shadowRoot) {
      node["s-hn"] = transformTag(tagName).toUpperCase();
      if (childRenderNode.$tag$ === "slot") {
        node["s-cr"] = hostElm["s-cr"];
      }
    } else if (((_a = childRenderNode.$tag$) == null ? void 0 : _a.toString().includes("-")) && childRenderNode.$tag$ !== "slot-fb" && !childRenderNode.$elm$.shadowRoot) {
      const cmpMeta = getHostRef(childRenderNode.$elm$);
      if (cmpMeta) {
        const scopeId3 = getScopeId(
          cmpMeta.$cmpMeta$,
          childRenderNode.$elm$.getAttribute("s-mode") 
        );
        const styleSheet = win.document.querySelector(`style[sty-id="${scopeId3}"]`);
        if (styleSheet) {
          shadowRootNodes.unshift(styleSheet.cloneNode(true));
        }
      }
    }
    if (childRenderNode.$tag$ === "slot") {
      childRenderNode.$name$ = childRenderNode.$elm$["s-sn"] || childRenderNode.$elm$["name"] || null;
      if (childRenderNode.$children$) {
        childRenderNode.$flags$ |= 2 /* isSlotFallback */;
        if (!childRenderNode.$elm$.childNodes.length) {
          childRenderNode.$children$.forEach((c) => {
            childRenderNode.$elm$.appendChild(c.$elm$);
          });
        }
      } else {
        childRenderNode.$flags$ |= 1 /* isSlotReference */;
      }
    }
    if (orgLocationNode && orgLocationNode.isConnected) {
      if (orgLocationNode.parentElement.shadowRoot && orgLocationNode["s-en"] === "") {
        orgLocationNode.parentNode.insertBefore(node, orgLocationNode.nextSibling);
      }
      orgLocationNode.parentNode.removeChild(orgLocationNode);
      if (!shadowRoot) {
        node["s-oo"] = parseInt(childRenderNode.$nodeId$);
      }
    }
    if (orgLocationNode && !orgLocationNode["s-id"]) {
      plt.$orgLocNodes$.delete(orgLocationId);
    }
  }
  const hosts = [];
  const snLen = slottedNodes.length;
  let snIndex = 0;
  let slotGroup;
  let snGroupIdx;
  let snGroupLen;
  let slottedItem;
  let currentPos = 0;
  for (snIndex; snIndex < snLen; snIndex++) {
    slotGroup = slottedNodes[snIndex];
    if (!slotGroup || !slotGroup.length) continue;
    snGroupLen = slotGroup.length;
    snGroupIdx = 0;
    for (snGroupIdx; snGroupIdx < snGroupLen; snGroupIdx++) {
      slottedItem = slotGroup[snGroupIdx];
      if (!hosts[slottedItem.hostId]) {
        hosts[slottedItem.hostId] = plt.$orgLocNodes$.get(slottedItem.hostId);
      }
      if (!hosts[slottedItem.hostId]) continue;
      const hostEle = hosts[slottedItem.hostId];
      if (hostEle.shadowRoot && slottedItem.node.parentElement !== hostEle) {
        hostEle.insertBefore(slottedItem.node, (_c = (_b = slotGroup[snGroupIdx - 1]) == null ? void 0 : _b.node) == null ? void 0 : _c.nextSibling);
      }
      if (!hostEle.shadowRoot || !shadowRoot) {
        if (!slottedItem.slot["s-cr"]) {
          slottedItem.slot["s-cr"] = hostEle["s-cr"];
          if (!slottedItem.slot["s-cr"] && hostEle.shadowRoot) {
            slottedItem.slot["s-cr"] = hostEle;
          } else {
            slottedItem.slot["s-cr"] = (hostEle.__childNodes || hostEle.childNodes)[0];
          }
        }
        addSlotRelocateNode(slottedItem.node, slottedItem.slot, false, slottedItem.node["s-oo"] || currentPos);
        if (((_d = slottedItem.node.parentElement) == null ? void 0 : _d.shadowRoot) && slottedItem.node["getAttribute"] && slottedItem.node.getAttribute("slot")) {
          slottedItem.node.removeAttribute("slot");
        }
        {
          patchSlottedNode(slottedItem.node);
        }
      }
      currentPos = (slottedItem.node["s-oo"] || currentPos) + 1;
    }
  }
  if (scopeId2 && slotNodes.length) {
    slotNodes.forEach((slot) => {
      slot.$elm$.parentElement.classList.add(scopeId2 + "-s");
    });
  }
  if (shadowRoot && !shadowRoot.childNodes.length) {
    let rnIdex = 0;
    const rnLen = shadowRootNodes.length;
    if (rnLen) {
      for (rnIdex; rnIdex < rnLen; rnIdex++) {
        const node = shadowRootNodes[rnIdex];
        if (node) {
          shadowRoot.appendChild(node);
        }
      }
      Array.from(hostElm.childNodes).forEach((node) => {
        if (typeof node["s-en"] !== "string" && typeof node["s-sn"] !== "string") {
          if (node.nodeType === 1 /* ElementNode */ && node.slot && node.hidden) {
            node.removeAttribute("hidden");
          } else if (node.nodeType === 8 /* CommentNode */ && !node.nodeValue) {
            node.parentNode.removeChild(node);
          }
        }
      });
    }
  }
  hostRef.$hostElement$ = hostElm;
  endHydrate();
};
var clientHydrate = (parentVNode, childRenderNodes, slotNodes, shadowRootNodes, hostElm, node, hostId, slottedNodes = []) => {
  let childNodeType;
  let childIdSplt;
  let childVNode;
  let i2;
  const scopeId2 = hostElm["s-sc"];
  if (node.nodeType === 1 /* ElementNode */) {
    childNodeType = node.getAttribute(HYDRATE_CHILD_ID);
    if (childNodeType) {
      childIdSplt = childNodeType.split(".");
      if (childIdSplt[0] === hostId || childIdSplt[0] === "0") {
        childVNode = createSimpleVNode({
          $flags$: 0,
          $hostId$: childIdSplt[0],
          $nodeId$: childIdSplt[1],
          $depth$: childIdSplt[2],
          $index$: childIdSplt[3],
          $tag$: node.tagName.toLowerCase(),
          $elm$: node,
          // If we don't add the initial classes to the VNode, the first `vdom-render.ts` patch
          // won't try to reconcile them. Classes set on the node will be blown away.
          $attrs$: { class: node.className || "" }
        });
        childRenderNodes.push(childVNode);
        node.removeAttribute(HYDRATE_CHILD_ID);
        if (!parentVNode.$children$) {
          parentVNode.$children$ = [];
        }
        if (scopeId2 && childIdSplt[0] === hostId) {
          node["s-si"] = scopeId2;
          childVNode.$attrs$.class += " " + scopeId2;
        }
        const slotName = childVNode.$elm$.getAttribute("s-sn");
        if (typeof slotName === "string") {
          if (childVNode.$tag$ === "slot-fb") {
            addSlot(
              slotName,
              childIdSplt[2],
              childVNode,
              node,
              parentVNode,
              childRenderNodes,
              slotNodes,
              shadowRootNodes,
              slottedNodes
            );
            if (scopeId2) {
              node.classList.add(scopeId2);
            }
          }
          childVNode.$elm$["s-sn"] = slotName;
          childVNode.$elm$.removeAttribute("s-sn");
        }
        if (childVNode.$index$ !== void 0) {
          parentVNode.$children$[childVNode.$index$] = childVNode;
        }
        parentVNode = childVNode;
        if (shadowRootNodes && childVNode.$depth$ === "0") {
          shadowRootNodes[childVNode.$index$] = childVNode.$elm$;
        }
      }
    }
    if (node.shadowRoot) {
      for (i2 = node.shadowRoot.childNodes.length - 1; i2 >= 0; i2--) {
        clientHydrate(
          parentVNode,
          childRenderNodes,
          slotNodes,
          shadowRootNodes,
          hostElm,
          node.shadowRoot.childNodes[i2],
          hostId,
          slottedNodes
        );
      }
    }
    const nonShadowNodes = node.__childNodes || node.childNodes;
    for (i2 = nonShadowNodes.length - 1; i2 >= 0; i2--) {
      clientHydrate(
        parentVNode,
        childRenderNodes,
        slotNodes,
        shadowRootNodes,
        hostElm,
        nonShadowNodes[i2],
        hostId,
        slottedNodes
      );
    }
  } else if (node.nodeType === 8 /* CommentNode */) {
    childIdSplt = node.nodeValue.split(".");
    if (childIdSplt[1] === hostId || childIdSplt[1] === "0") {
      childNodeType = childIdSplt[0];
      childVNode = createSimpleVNode({
        $hostId$: childIdSplt[1],
        $nodeId$: childIdSplt[2],
        $depth$: childIdSplt[3],
        $index$: childIdSplt[4] || "0",
        $elm$: node,
        $attrs$: null,
        $children$: null,
        $key$: null,
        $name$: null,
        $tag$: null,
        $text$: null
      });
      if (childNodeType === TEXT_NODE_ID) {
        childVNode.$elm$ = findCorrespondingNode(node, 3 /* TextNode */);
        if (childVNode.$elm$ && childVNode.$elm$.nodeType === 3 /* TextNode */) {
          childVNode.$text$ = childVNode.$elm$.textContent;
          childRenderNodes.push(childVNode);
          node.remove();
          if (hostId === childVNode.$hostId$) {
            if (!parentVNode.$children$) {
              parentVNode.$children$ = [];
            }
            parentVNode.$children$[childVNode.$index$] = childVNode;
          }
          if (shadowRootNodes && childVNode.$depth$ === "0") {
            shadowRootNodes[childVNode.$index$] = childVNode.$elm$;
          }
        }
      } else if (childNodeType === COMMENT_NODE_ID) {
        childVNode.$elm$ = findCorrespondingNode(node, 8 /* CommentNode */);
        if (childVNode.$elm$ && childVNode.$elm$.nodeType === 8 /* CommentNode */) {
          childRenderNodes.push(childVNode);
          node.remove();
        }
      } else if (childVNode.$hostId$ === hostId) {
        if (childNodeType === SLOT_NODE_ID) {
          const slotName = node["s-sn"] = childIdSplt[5] || "";
          addSlot(
            slotName,
            childIdSplt[2],
            childVNode,
            node,
            parentVNode,
            childRenderNodes,
            slotNodes,
            shadowRootNodes,
            slottedNodes
          );
        } else if (childNodeType === CONTENT_REF_ID) {
          if (shadowRootNodes) {
            node.remove();
          } else {
            hostElm["s-cr"] = node;
            node["s-cn"] = true;
          }
        }
      }
    }
  } else if (parentVNode && parentVNode.$tag$ === "style") {
    const vnode = newVNode(null, node.textContent);
    vnode.$elm$ = node;
    vnode.$index$ = "0";
    parentVNode.$children$ = [vnode];
  }
  return parentVNode;
};
var initializeDocumentHydrate = (node, orgLocNodes) => {
  if (node.nodeType === 1 /* ElementNode */) {
    const componentId = node[HYDRATE_ID] || node.getAttribute(HYDRATE_ID);
    if (componentId) {
      orgLocNodes.set(componentId, node);
    }
    let i2 = 0;
    if (node.shadowRoot) {
      for (; i2 < node.shadowRoot.childNodes.length; i2++) {
        initializeDocumentHydrate(node.shadowRoot.childNodes[i2], orgLocNodes);
      }
    }
    const nonShadowNodes = node.__childNodes || node.childNodes;
    for (i2 = 0; i2 < nonShadowNodes.length; i2++) {
      initializeDocumentHydrate(nonShadowNodes[i2], orgLocNodes);
    }
  } else if (node.nodeType === 8 /* CommentNode */) {
    const childIdSplt = node.nodeValue.split(".");
    if (childIdSplt[0] === ORG_LOCATION_ID) {
      orgLocNodes.set(childIdSplt[1] + "." + childIdSplt[2], node);
      node.nodeValue = "";
      node["s-en"] = childIdSplt[3];
    }
  }
};
var createSimpleVNode = (vnode) => {
  const defaultVNode = {
    $flags$: 0,
    $hostId$: null,
    $nodeId$: null,
    $depth$: null,
    $index$: "0",
    $elm$: null,
    $attrs$: null,
    $children$: null,
    $key$: null,
    $name$: null,
    $tag$: null,
    $text$: null
  };
  return { ...defaultVNode, ...vnode };
};
function addSlot(slotName, slotId, childVNode, node, parentVNode, childRenderNodes, slotNodes, shadowRootNodes, slottedNodes) {
  node["s-sr"] = true;
  childVNode.$name$ = slotName || null;
  childVNode.$tag$ = "slot";
  const parentNodeId = (parentVNode == null ? void 0 : parentVNode.$elm$) ? parentVNode.$elm$["s-id"] || parentVNode.$elm$.getAttribute("s-id") : "";
  if (shadowRootNodes && win.document) {
    const slot = childVNode.$elm$ = win.document.createElement(childVNode.$tag$);
    if (childVNode.$name$) {
      childVNode.$elm$.setAttribute("name", slotName);
    }
    if (parentVNode.$elm$.shadowRoot && parentNodeId && parentNodeId !== childVNode.$hostId$) {
      internalCall(parentVNode.$elm$, "insertBefore")(slot, internalCall(parentVNode.$elm$, "children")[0]);
    } else {
      internalCall(internalCall(node, "parentNode"), "insertBefore")(slot, node);
    }
    addSlottedNodes(slottedNodes, slotId, slotName, node, childVNode.$hostId$);
    node.remove();
    if (childVNode.$depth$ === "0") {
      shadowRootNodes[childVNode.$index$] = childVNode.$elm$;
    }
  } else {
    const slot = childVNode.$elm$;
    const shouldMove = parentNodeId && parentNodeId !== childVNode.$hostId$ && parentVNode.$elm$.shadowRoot;
    addSlottedNodes(slottedNodes, slotId, slotName, node, shouldMove ? parentNodeId : childVNode.$hostId$);
    patchSlotNode(node);
    if (shouldMove) {
      parentVNode.$elm$.insertBefore(slot, parentVNode.$elm$.children[0]);
    }
  }
  childRenderNodes.push(childVNode);
  slotNodes.push(childVNode);
  if (!parentVNode.$children$) {
    parentVNode.$children$ = [];
  }
  parentVNode.$children$[childVNode.$index$] = childVNode;
}
var addSlottedNodes = (slottedNodes, slotNodeId, slotName, slotNode, hostId) => {
  var _a, _b;
  let slottedNode = slotNode.nextSibling;
  slottedNodes[slotNodeId] = slottedNodes[slotNodeId] || [];
  if (!slottedNode || ((_a = slottedNode.nodeValue) == null ? void 0 : _a.startsWith(SLOT_NODE_ID + "."))) return;
  do {
    if (slottedNode && ((slottedNode["getAttribute"] && slottedNode.getAttribute("slot") || slottedNode["s-sn"]) === slotName || slotName === "" && !slottedNode["s-sn"] && (!slottedNode["getAttribute"] || !slottedNode.getAttribute("slot")) && (slottedNode.nodeType === 8 /* CommentNode */ || slottedNode.nodeType === 3 /* TextNode */))) {
      slottedNode["s-sn"] = slotName;
      slottedNodes[slotNodeId].push({ slot: slotNode, node: slottedNode, hostId });
    }
    slottedNode = slottedNode == null ? void 0 : slottedNode.nextSibling;
  } while (slottedNode && !((_b = slottedNode.nodeValue) == null ? void 0 : _b.startsWith(SLOT_NODE_ID + ".")));
};
var findCorrespondingNode = (node, type) => {
  let sibling = node;
  do {
    sibling = sibling.nextSibling;
  } while (sibling && (sibling.nodeType !== type || !sibling.nodeValue));
  return sibling;
};

// src/runtime/mode.ts
var computeMode = (elm) => modeResolutionChain.map((h2) => h2(elm)).find((m) => !!m);
var setMode = (handler) => modeResolutionChain.push(handler);
var getMode = (ref) => {
  var _a;
  return (_a = getHostRef(ref)) == null ? void 0 : _a.$modeName$;
};

// src/utils/remote-value.ts
var RemoteValue = class _RemoteValue {
  /**
   * Deserializes a LocalValue serialized object back to its original JavaScript representation
   *
   * @param serialized The serialized LocalValue object
   * @returns The original JavaScript value/object
   */
  static fromLocalValue(serialized) {
    const type = serialized[TYPE_CONSTANT];
    const value = VALUE_CONSTANT in serialized ? serialized[VALUE_CONSTANT] : void 0;
    switch (type) {
      case "string" /* String */:
        return value;
      case "boolean" /* Boolean */:
        return value;
      case "bigint" /* BigInt */:
        return BigInt(value);
      case "undefined" /* Undefined */:
        return void 0;
      case "null" /* Null */:
        return null;
      case "number" /* Number */:
        if (value === "NaN") return NaN;
        if (value === "-0") return -0;
        if (value === "Infinity") return Infinity;
        if (value === "-Infinity") return -Infinity;
        return value;
      case "array" /* Array */:
        return value.map((item) => _RemoteValue.fromLocalValue(item));
      case "date" /* Date */:
        return new Date(value);
      case "map" /* Map */:
        const map = /* @__PURE__ */ new Map();
        for (const [key, val] of value) {
          const deserializedKey = typeof key === "object" && key !== null ? _RemoteValue.fromLocalValue(key) : key;
          const deserializedValue = _RemoteValue.fromLocalValue(val);
          map.set(deserializedKey, deserializedValue);
        }
        return map;
      case "object" /* Object */:
        const obj = {};
        for (const [key, val] of value) {
          obj[key] = _RemoteValue.fromLocalValue(val);
        }
        return obj;
      case "regexp" /* RegularExpression */:
        const { pattern, flags } = value;
        return new RegExp(pattern, flags);
      case "set" /* Set */:
        const set = /* @__PURE__ */ new Set();
        for (const item of value) {
          set.add(_RemoteValue.fromLocalValue(item));
        }
        return set;
      case "symbol" /* Symbol */:
        return Symbol(value);
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }
  /**
   * Utility method to deserialize multiple LocalValues at once
   *
   * @param serializedValues Array of serialized LocalValue objects
   * @returns Array of deserialized JavaScript values
   */
  static fromLocalValueArray(serializedValues) {
    return serializedValues.map((value) => _RemoteValue.fromLocalValue(value));
  }
  /**
   * Verifies if the given object matches the structure of a serialized LocalValue
   *
   * @param obj Object to verify
   * @returns boolean indicating if the object has LocalValue structure
   */
  static isLocalValueObject(obj) {
    if (typeof obj !== "object" || obj === null) {
      return false;
    }
    if (!obj.hasOwnProperty(TYPE_CONSTANT)) {
      return false;
    }
    const type = obj[TYPE_CONSTANT];
    const hasTypeProperty = Object.values({ ...PrimitiveType, ...NonPrimitiveType }).includes(type);
    if (!hasTypeProperty) {
      return false;
    }
    if (type !== "null" /* Null */ && type !== "undefined" /* Undefined */) {
      return obj.hasOwnProperty(VALUE_CONSTANT);
    }
    return true;
  }
};

// src/utils/serialize.ts
function deserializeProperty(value) {
  if (typeof value !== "string" || !value.startsWith(SERIALIZED_PREFIX)) {
    return value;
  }
  return RemoteValue.fromLocalValue(JSON.parse(atob(value.slice(SERIALIZED_PREFIX.length))));
}

// src/runtime/parse-property-value.ts
var parsePropertyValue = (propValue, propType, isFormAssociated) => {
  if (typeof propValue === "string" && propValue.startsWith(SERIALIZED_PREFIX)) {
    propValue = deserializeProperty(propValue);
    return propValue;
  }
  if (propValue != null && !isComplexType(propValue)) {
    if (propType & 4 /* Boolean */) {
      if (isFormAssociated && typeof propValue === "string") {
        return propValue === "" || !!propValue;
      } else {
        return propValue === "false" ? false : propValue === "" || !!propValue;
      }
    }
    if (propType & 2 /* Number */) {
      return typeof propValue === "string" ? parseFloat(propValue) : typeof propValue === "number" ? propValue : NaN;
    }
    if (propType & 1 /* String */) {
      return String(propValue);
    }
    return propValue;
  }
  return propValue;
};
var getElement = (ref) => {
  return ref;
};

// src/runtime/event-emitter.ts
var createEvent = (ref, name, flags) => {
  const elm = getElement(ref);
  return {
    emit: (detail) => {
      return emitEvent(elm, name, {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail
      });
    }
  };
};
var emitEvent = (elm, name, opts) => {
  const ev = plt.ce(name, opts);
  elm.dispatchEvent(ev);
  return ev;
};
var setAccessor = (elm, memberName, oldValue, newValue, isSvg, flags, initialRender) => {
  if (oldValue === newValue) {
    return;
  }
  let isProp = isMemberInElement(elm, memberName);
  let ln = memberName.toLowerCase();
  if (memberName === "class") {
    const classList = elm.classList;
    const oldClasses = parseClassList(oldValue);
    let newClasses = parseClassList(newValue);
    if ((elm["s-si"] || elm["s-sc"]) && initialRender) {
      const scopeId2 = elm["s-sc"] || elm["s-si"];
      newClasses.push(scopeId2);
      oldClasses.forEach((c) => {
        if (c.startsWith(scopeId2)) newClasses.push(c);
      });
      newClasses = [...new Set(newClasses)].filter((c) => c);
      classList.add(...newClasses);
    } else {
      classList.remove(...oldClasses.filter((c) => c && !newClasses.includes(c)));
      classList.add(...newClasses.filter((c) => c && !oldClasses.includes(c)));
    }
  } else if (memberName === "style") {
    {
      for (const prop in oldValue) {
        if (!newValue || newValue[prop] == null) {
          if (prop.includes("-")) {
            elm.style.removeProperty(prop);
          } else {
            elm.style[prop] = "";
          }
        }
      }
    }
    for (const prop in newValue) {
      if (!oldValue || newValue[prop] !== oldValue[prop]) {
        if (prop.includes("-")) {
          elm.style.setProperty(prop, newValue[prop]);
        } else {
          elm.style[prop] = newValue[prop];
        }
      }
    }
  } else if (memberName === "key") ; else if (memberName === "ref") {
    if (newValue) {
      queueRefAttachment(newValue, elm);
    }
  } else if ((!elm.__lookupSetter__(memberName)) && memberName[0] === "o" && memberName[1] === "n") {
    if (memberName[2] === "-") {
      memberName = memberName.slice(3);
    } else if (isMemberInElement(win, ln)) {
      memberName = ln.slice(2);
    } else {
      memberName = ln[2] + memberName.slice(3);
    }
    if (oldValue || newValue) {
      const capture = memberName.endsWith(CAPTURE_EVENT_SUFFIX);
      memberName = memberName.replace(CAPTURE_EVENT_REGEX, "");
      if (oldValue) {
        plt.rel(elm, memberName, oldValue, capture);
      }
      if (newValue) {
        plt.ael(elm, memberName, newValue, capture);
      }
    }
  } else if (memberName[0] === "a" && memberName.startsWith("attr:")) {
    const propName = memberName.slice(5);
    let attrName;
    {
      const hostRef = getHostRef(elm);
      if (hostRef && hostRef.$cmpMeta$ && hostRef.$cmpMeta$.$members$) {
        const memberMeta = hostRef.$cmpMeta$.$members$[propName];
        if (memberMeta && memberMeta[1]) {
          attrName = memberMeta[1];
        }
      }
    }
    if (!attrName) {
      attrName = propName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    }
    if (newValue == null || newValue === false) {
      if (newValue !== false || elm.getAttribute(attrName) === "") {
        elm.removeAttribute(attrName);
      }
    } else {
      elm.setAttribute(attrName, newValue === true ? "" : newValue);
    }
    return;
  } else if (memberName[0] === "p" && memberName.startsWith("prop:")) {
    const propName = memberName.slice(5);
    try {
      elm[propName] = newValue;
    } catch (e) {
    }
    return;
  } else {
    const isComplex = isComplexType(newValue);
    if ((isProp || isComplex && newValue !== null) && !isSvg) {
      try {
        if (!elm.tagName.includes("-")) {
          const n = newValue == null ? "" : newValue;
          if (memberName === "list") {
            isProp = false;
          } else if (oldValue == null || elm[memberName] !== n) {
            if (typeof elm.__lookupSetter__(memberName) === "function") {
              elm[memberName] = n;
            } else {
              elm.setAttribute(memberName, n);
            }
          }
        } else if (elm[memberName] !== newValue) {
          elm[memberName] = newValue;
        }
      } catch (e) {
      }
    }
    let xlink = false;
    {
      if (ln !== (ln = ln.replace(/^xlink\:?/, ""))) {
        memberName = ln;
        xlink = true;
      }
    }
    if (newValue == null || newValue === false) {
      if (newValue !== false || elm.getAttribute(memberName) === "") {
        if (xlink) {
          elm.removeAttributeNS(XLINK_NS, memberName);
        } else {
          elm.removeAttribute(memberName);
        }
      }
    } else if ((!isProp || flags & 4 /* isHost */ || isSvg) && !isComplex && elm.nodeType === 1 /* ElementNode */) {
      newValue = newValue === true ? "" : newValue;
      if (xlink) {
        elm.setAttributeNS(XLINK_NS, memberName, newValue);
      } else {
        elm.setAttribute(memberName, newValue);
      }
    }
  }
};
var parseClassListRegex = /\s/;
var parseClassList = (value) => {
  if (typeof value === "object" && value && "baseVal" in value) {
    value = value.baseVal;
  }
  if (!value || typeof value !== "string") {
    return [];
  }
  return value.split(parseClassListRegex);
};
var CAPTURE_EVENT_SUFFIX = "Capture";
var CAPTURE_EVENT_REGEX = new RegExp(CAPTURE_EVENT_SUFFIX + "$");

// src/runtime/vdom/update-element.ts
var updateElement = (oldVnode, newVnode, isSvgMode2, isInitialRender) => {
  const elm = newVnode.$elm$.nodeType === 11 /* DocumentFragment */ && newVnode.$elm$.host ? newVnode.$elm$.host : newVnode.$elm$;
  const oldVnodeAttrs = oldVnode && oldVnode.$attrs$ || {};
  const newVnodeAttrs = newVnode.$attrs$ || {};
  {
    for (const memberName of sortedAttrNames(Object.keys(oldVnodeAttrs))) {
      if (!(memberName in newVnodeAttrs)) {
        setAccessor(
          elm,
          memberName,
          oldVnodeAttrs[memberName],
          void 0,
          isSvgMode2,
          newVnode.$flags$,
          isInitialRender
        );
      }
    }
  }
  for (const memberName of sortedAttrNames(Object.keys(newVnodeAttrs))) {
    setAccessor(
      elm,
      memberName,
      oldVnodeAttrs[memberName],
      newVnodeAttrs[memberName],
      isSvgMode2,
      newVnode.$flags$,
      isInitialRender
    );
  }
};
function sortedAttrNames(attrNames) {
  return attrNames.includes("ref") ? (
    // we need to sort these to ensure that `'ref'` is the last attr
    [...attrNames.filter((attr) => attr !== "ref"), "ref"]
  ) : (
    // no need to sort, return the original array
    attrNames
  );
}

// src/runtime/vdom/vdom-render.ts
var scopeId;
var contentRef;
var hostTagName;
var useNativeShadowDom = false;
var checkSlotFallbackVisibility = false;
var checkSlotRelocate = false;
var isSvgMode = false;
var refCallbacksToRemove = [];
var refCallbacksToAttach = [];
var createElm = (oldParentVNode, newParentVNode, childIndex) => {
  var _a;
  const newVNode2 = newParentVNode.$children$[childIndex];
  let i2 = 0;
  let elm;
  let childNode;
  let oldVNode;
  if (!useNativeShadowDom) {
    checkSlotRelocate = true;
    if (newVNode2.$tag$ === "slot") {
      newVNode2.$flags$ |= newVNode2.$children$ ? (
        // slot element has fallback content
        // still create an element that "mocks" the slot element
        2 /* isSlotFallback */
      ) : (
        // slot element does not have fallback content
        // create an html comment we'll use to always reference
        // where actual slot content should sit next to
        1 /* isSlotReference */
      );
    }
  }
  if (newVNode2.$text$ != null) {
    elm = newVNode2.$elm$ = win.document.createTextNode(newVNode2.$text$);
  } else if (newVNode2.$flags$ & 1 /* isSlotReference */) {
    elm = newVNode2.$elm$ = win.document.createTextNode("");
    {
      updateElement(null, newVNode2, isSvgMode);
    }
  } else {
    if (!isSvgMode) {
      isSvgMode = newVNode2.$tag$ === "svg";
    }
    if (!win.document) {
      throw new Error("You are trying to render a Stencil component in an environment that doesn't support the DOM.");
    }
    elm = newVNode2.$elm$ = win.document.createElementNS(
      isSvgMode ? SVG_NS : HTML_NS,
      !useNativeShadowDom && BUILD.slotRelocation && newVNode2.$flags$ & 2 /* isSlotFallback */ ? "slot-fb" : newVNode2.$tag$
    ) ;
    if (isSvgMode && newVNode2.$tag$ === "foreignObject") {
      isSvgMode = false;
    }
    {
      updateElement(null, newVNode2, isSvgMode);
    }
    if (isDef(scopeId) && elm["s-si"] !== scopeId) {
      elm.classList.add(elm["s-si"] = scopeId);
    }
    if (newVNode2.$children$) {
      const appendTarget = newVNode2.$tag$ === "template" ? elm.content : elm;
      for (i2 = 0; i2 < newVNode2.$children$.length; ++i2) {
        childNode = createElm(oldParentVNode, newVNode2, i2);
        if (childNode) {
          appendTarget.appendChild(childNode);
        }
      }
    }
    {
      if (newVNode2.$tag$ === "svg") {
        isSvgMode = false;
      } else if (elm.tagName === "foreignObject") {
        isSvgMode = true;
      }
    }
  }
  elm["s-hn"] = hostTagName;
  {
    if (newVNode2.$flags$ & (2 /* isSlotFallback */ | 1 /* isSlotReference */)) {
      elm["s-sr"] = true;
      elm["s-cr"] = contentRef;
      elm["s-sn"] = newVNode2.$name$ || "";
      elm["s-rf"] = (_a = newVNode2.$attrs$) == null ? void 0 : _a.ref;
      patchSlotNode(elm);
      oldVNode = oldParentVNode && oldParentVNode.$children$ && oldParentVNode.$children$[childIndex];
      if (oldVNode && oldVNode.$tag$ === newVNode2.$tag$ && oldParentVNode.$elm$) {
        relocateToHostRoot(oldParentVNode.$elm$);
      }
      {
        addRemoveSlotScopedClass(contentRef, elm, newParentVNode.$elm$, oldParentVNode == null ? void 0 : oldParentVNode.$elm$);
      }
    }
  }
  return elm;
};
var relocateToHostRoot = (parentElm) => {
  plt.$flags$ |= 1 /* isTmpDisconnected */;
  const host = parentElm.closest(hostTagName.toLowerCase());
  if (host != null) {
    const contentRefNode = Array.from(host.__childNodes || host.childNodes).find(
      (ref) => ref["s-cr"]
    );
    const childNodeArray = Array.from(
      parentElm.__childNodes || parentElm.childNodes
    );
    for (const childNode of contentRefNode ? childNodeArray.reverse() : childNodeArray) {
      if (childNode["s-sh"] != null) {
        insertBefore(host, childNode, contentRefNode != null ? contentRefNode : null);
        childNode["s-sh"] = void 0;
        checkSlotRelocate = true;
      }
    }
  }
  plt.$flags$ &= -2 /* isTmpDisconnected */;
};
var putBackInOriginalLocation = (parentElm, recursive) => {
  plt.$flags$ |= 1 /* isTmpDisconnected */;
  const oldSlotChildNodes = Array.from(parentElm.__childNodes || parentElm.childNodes);
  if (parentElm["s-sr"]) {
    let node = parentElm;
    while (node = node.nextSibling) {
      if (node && node["s-sn"] === parentElm["s-sn"] && node["s-sh"] === hostTagName) {
        oldSlotChildNodes.push(node);
      }
    }
  }
  for (let i2 = oldSlotChildNodes.length - 1; i2 >= 0; i2--) {
    const childNode = oldSlotChildNodes[i2];
    if (childNode["s-hn"] !== hostTagName && childNode["s-ol"]) {
      insertBefore(referenceNode(childNode).parentNode, childNode, referenceNode(childNode));
      childNode["s-ol"].remove();
      childNode["s-ol"] = void 0;
      childNode["s-sh"] = void 0;
      checkSlotRelocate = true;
    }
    if (recursive) {
      putBackInOriginalLocation(childNode, recursive);
    }
  }
  plt.$flags$ &= -2 /* isTmpDisconnected */;
};
var addVnodes = (parentElm, before, parentVNode, vnodes, startIdx, endIdx) => {
  let containerElm = parentElm["s-cr"] && parentElm["s-cr"].parentNode || parentElm;
  let childNode;
  if (containerElm.shadowRoot && containerElm.tagName === hostTagName) {
    containerElm = containerElm.shadowRoot;
  }
  if (parentVNode.$tag$ === "template") {
    containerElm = containerElm.content;
  }
  for (; startIdx <= endIdx; ++startIdx) {
    if (vnodes[startIdx]) {
      childNode = createElm(null, parentVNode, startIdx);
      if (childNode) {
        vnodes[startIdx].$elm$ = childNode;
        insertBefore(containerElm, childNode, referenceNode(before) );
      }
    }
  }
};
var removeVnodes = (vnodes, startIdx, endIdx) => {
  for (let index = startIdx; index <= endIdx; ++index) {
    const vnode = vnodes[index];
    if (vnode) {
      const elm = vnode.$elm$;
      nullifyVNodeRefs(vnode);
      if (elm) {
        {
          checkSlotFallbackVisibility = true;
          if (elm["s-ol"]) {
            elm["s-ol"].remove();
          } else {
            putBackInOriginalLocation(elm, true);
          }
        }
        elm.remove();
      }
    }
  }
};
var updateChildren = (parentElm, oldCh, newVNode2, newCh, isInitialRender = false) => {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let idxInOld = 0;
  let i2 = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let node;
  let elmToMove;
  const containerElm = newVNode2.$tag$ === "template" ? parentElm.content : parentElm;
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx];
    } else if (isSameVnode(oldStartVnode, newStartVnode, isInitialRender)) {
      patch(oldStartVnode, newStartVnode, isInitialRender);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (isSameVnode(oldEndVnode, newEndVnode, isInitialRender)) {
      patch(oldEndVnode, newEndVnode, isInitialRender);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (isSameVnode(oldStartVnode, newEndVnode, isInitialRender)) {
      if ((oldStartVnode.$tag$ === "slot" || newEndVnode.$tag$ === "slot")) {
        putBackInOriginalLocation(oldStartVnode.$elm$.parentNode, false);
      }
      patch(oldStartVnode, newEndVnode, isInitialRender);
      insertBefore(containerElm, oldStartVnode.$elm$, oldEndVnode.$elm$.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (isSameVnode(oldEndVnode, newStartVnode, isInitialRender)) {
      if ((oldStartVnode.$tag$ === "slot" || newEndVnode.$tag$ === "slot")) {
        putBackInOriginalLocation(oldEndVnode.$elm$.parentNode, false);
      }
      patch(oldEndVnode, newStartVnode, isInitialRender);
      insertBefore(containerElm, oldEndVnode.$elm$, oldStartVnode.$elm$);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      idxInOld = -1;
      {
        for (i2 = oldStartIdx; i2 <= oldEndIdx; ++i2) {
          if (oldCh[i2] && oldCh[i2].$key$ !== null && oldCh[i2].$key$ === newStartVnode.$key$) {
            idxInOld = i2;
            break;
          }
        }
      }
      if (idxInOld >= 0) {
        elmToMove = oldCh[idxInOld];
        if (elmToMove.$tag$ !== newStartVnode.$tag$) {
          node = createElm(oldCh && oldCh[newStartIdx], newVNode2, idxInOld);
        } else {
          patch(elmToMove, newStartVnode, isInitialRender);
          oldCh[idxInOld] = void 0;
          node = elmToMove.$elm$;
        }
        newStartVnode = newCh[++newStartIdx];
      } else {
        node = createElm(oldCh && oldCh[newStartIdx], newVNode2, newStartIdx);
        newStartVnode = newCh[++newStartIdx];
      }
      if (node) {
        {
          insertBefore(
            referenceNode(oldStartVnode.$elm$).parentNode,
            node,
            referenceNode(oldStartVnode.$elm$)
          );
        }
      }
    }
  }
  if (oldStartIdx > oldEndIdx) {
    addVnodes(
      parentElm,
      newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].$elm$,
      newVNode2,
      newCh,
      newStartIdx,
      newEndIdx
    );
  } else if (newStartIdx > newEndIdx) {
    removeVnodes(oldCh, oldStartIdx, oldEndIdx);
  }
};
var isSameVnode = (leftVNode, rightVNode, isInitialRender = false) => {
  if (leftVNode.$tag$ === rightVNode.$tag$) {
    if (leftVNode.$tag$ === "slot") {
      return leftVNode.$name$ === rightVNode.$name$;
    }
    if (!isInitialRender) {
      return leftVNode.$key$ === rightVNode.$key$;
    }
    if (isInitialRender && !leftVNode.$key$ && rightVNode.$key$) {
      leftVNode.$key$ = rightVNode.$key$;
    }
    return true;
  }
  return false;
};
var referenceNode = (node) => node && node["s-ol"] || node;
var patch = (oldVNode, newVNode2, isInitialRender = false) => {
  const elm = newVNode2.$elm$ = oldVNode.$elm$;
  const oldChildren = oldVNode.$children$;
  const newChildren = newVNode2.$children$;
  const tag = newVNode2.$tag$;
  const text = newVNode2.$text$;
  let defaultHolder;
  if (text == null) {
    {
      isSvgMode = tag === "svg" ? true : tag === "foreignObject" ? false : isSvgMode;
    }
    {
      if (tag === "slot" && !useNativeShadowDom) {
        if (oldVNode.$name$ !== newVNode2.$name$) {
          newVNode2.$elm$["s-sn"] = newVNode2.$name$ || "";
          relocateToHostRoot(newVNode2.$elm$.parentElement);
        }
      }
      updateElement(oldVNode, newVNode2, isSvgMode, isInitialRender);
    }
    if (oldChildren !== null && newChildren !== null) {
      updateChildren(elm, oldChildren, newVNode2, newChildren, isInitialRender);
    } else if (newChildren !== null) {
      if (oldVNode.$text$ !== null) {
        elm.textContent = "";
      }
      addVnodes(elm, null, newVNode2, newChildren, 0, newChildren.length - 1);
    } else if (
      // don't do this on initial render as it can cause non-hydrated content to be removed
      !isInitialRender && BUILD.updatable && oldChildren !== null
    ) {
      removeVnodes(oldChildren, 0, oldChildren.length - 1);
    } else if (isInitialRender && BUILD.updatable && oldChildren !== null && newChildren === null) {
      newVNode2.$children$ = oldChildren;
    }
    if (isSvgMode && tag === "svg") {
      isSvgMode = false;
    }
  } else if ((defaultHolder = elm["s-cr"])) {
    defaultHolder.parentNode.textContent = text;
  } else if (oldVNode.$text$ !== text) {
    elm.data = text;
  }
};
var relocateNodes = [];
var markSlotContentForRelocation = (elm) => {
  let node;
  let hostContentNodes;
  let j;
  const children = elm.__childNodes || elm.childNodes;
  for (const childNode of children) {
    if (childNode["s-sr"] && (node = childNode["s-cr"]) && node.parentNode) {
      hostContentNodes = node.parentNode.__childNodes || node.parentNode.childNodes;
      const slotName = childNode["s-sn"];
      for (j = hostContentNodes.length - 1; j >= 0; j--) {
        node = hostContentNodes[j];
        if (!node["s-cn"] && !node["s-nr"] && node["s-hn"] !== childNode["s-hn"] && (!node["s-sh"] || node["s-sh"] !== childNode["s-hn"])) {
          if (isNodeLocatedInSlot(node, slotName)) {
            let relocateNodeData = relocateNodes.find((r) => r.$nodeToRelocate$ === node);
            checkSlotFallbackVisibility = true;
            node["s-sn"] = node["s-sn"] || slotName;
            if (relocateNodeData) {
              relocateNodeData.$nodeToRelocate$["s-sh"] = childNode["s-hn"];
              relocateNodeData.$slotRefNode$ = childNode;
            } else {
              node["s-sh"] = childNode["s-hn"];
              relocateNodes.push({
                $slotRefNode$: childNode,
                $nodeToRelocate$: node
              });
            }
            if (node["s-sr"]) {
              relocateNodes.map((relocateNode) => {
                if (isNodeLocatedInSlot(relocateNode.$nodeToRelocate$, node["s-sn"])) {
                  relocateNodeData = relocateNodes.find((r) => r.$nodeToRelocate$ === node);
                  if (relocateNodeData && !relocateNode.$slotRefNode$) {
                    relocateNode.$slotRefNode$ = relocateNodeData.$slotRefNode$;
                  }
                }
              });
            }
          } else if (!relocateNodes.some((r) => r.$nodeToRelocate$ === node)) {
            relocateNodes.push({
              $nodeToRelocate$: node
            });
          }
        }
      }
    }
    if (childNode.nodeType === 1 /* ElementNode */) {
      markSlotContentForRelocation(childNode);
    }
  }
};
var nullifyVNodeRefs = (vNode) => {
  {
    if (vNode.$attrs$ && vNode.$attrs$.ref) {
      refCallbacksToRemove.push(() => vNode.$attrs$.ref(null));
    }
    vNode.$children$ && vNode.$children$.map(nullifyVNodeRefs);
  }
};
var queueRefAttachment = (refCallback, elm) => {
  {
    refCallbacksToAttach.push(() => refCallback(elm));
  }
};
var flushQueuedRefCallbacks = () => {
  {
    refCallbacksToRemove.forEach((cb) => cb());
    refCallbacksToRemove.length = 0;
    refCallbacksToAttach.forEach((cb) => cb());
    refCallbacksToAttach.length = 0;
  }
};
var insertBefore = (parent, newNode, reference, isInitialLoad) => {
  {
    if (typeof newNode["s-sn"] === "string" && !!newNode["s-sr"] && !!newNode["s-cr"]) {
      addRemoveSlotScopedClass(newNode["s-cr"], newNode, parent, newNode.parentElement);
    } else if (typeof newNode["s-sn"] === "string") {
      if (parent.getRootNode().nodeType !== 11 /* DOCUMENT_FRAGMENT_NODE */) {
        patchParentNode(newNode);
      }
      parent.insertBefore(newNode, reference);
      const { slotNode } = findSlotFromSlottedNode(newNode);
      if (slotNode && !isInitialLoad) dispatchSlotChangeEvent(slotNode);
      return newNode;
    }
  }
  if (parent.__insertBefore) {
    return parent.__insertBefore(newNode, reference);
  } else {
    return parent == null ? void 0 : parent.insertBefore(newNode, reference);
  }
};
function addRemoveSlotScopedClass(reference, slotNode, newParent, oldParent) {
  var _a, _b;
  let scopeId2;
  if (reference && typeof slotNode["s-sn"] === "string" && !!slotNode["s-sr"] && reference.parentNode && reference.parentNode["s-sc"] && (scopeId2 = slotNode["s-si"] || reference.parentNode["s-sc"])) {
    const scopeName = slotNode["s-sn"];
    const hostName = slotNode["s-hn"];
    (_a = newParent.classList) == null ? void 0 : _a.add(scopeId2 + "-s");
    if (oldParent && ((_b = oldParent.classList) == null ? void 0 : _b.contains(scopeId2 + "-s"))) {
      let child = (oldParent.__childNodes || oldParent.childNodes)[0];
      let found = false;
      while (child) {
        if (child["s-sn"] !== scopeName && child["s-hn"] === hostName && !!child["s-sr"]) {
          found = true;
          break;
        }
        child = child.nextSibling;
      }
      if (!found) oldParent.classList.remove(scopeId2 + "-s");
    }
  }
}
var renderVdom = (hostRef, renderFnResults, isInitialLoad = false) => {
  var _a, _b, _c, _d, _e;
  const hostElm = hostRef.$hostElement$;
  const cmpMeta = hostRef.$cmpMeta$;
  const oldVNode = hostRef.$vnode$ || newVNode(null, null);
  const isHostElement = isHost(renderFnResults);
  const rootVnode = isHostElement ? renderFnResults : h(null, null, renderFnResults);
  hostTagName = hostElm.tagName;
  if (cmpMeta.$attrsToReflect$) {
    rootVnode.$attrs$ = rootVnode.$attrs$ || {};
    cmpMeta.$attrsToReflect$.forEach(([propName, attribute]) => {
      if (hostRef.$serializerValues$.has(propName)) {
        rootVnode.$attrs$[attribute] = hostRef.$serializerValues$.get(propName);
      } else {
        rootVnode.$attrs$[attribute] = hostElm[propName];
      }
    });
  }
  if (isInitialLoad && rootVnode.$attrs$) {
    for (const key of Object.keys(rootVnode.$attrs$)) {
      if (hostElm.hasAttribute(key) && !["key", "ref", "style", "class"].includes(key)) {
        rootVnode.$attrs$[key] = hostElm[key];
      }
    }
  }
  rootVnode.$tag$ = null;
  rootVnode.$flags$ |= 4 /* isHost */;
  hostRef.$vnode$ = rootVnode;
  rootVnode.$elm$ = oldVNode.$elm$ = hostElm.shadowRoot || hostElm ;
  {
    scopeId = hostElm["s-sc"];
  }
  useNativeShadowDom = !!(cmpMeta.$flags$ & 1 /* shadowDomEncapsulation */) && !(cmpMeta.$flags$ & 128 /* shadowNeedsScopedCss */);
  {
    contentRef = hostElm["s-cr"];
    checkSlotFallbackVisibility = false;
  }
  patch(oldVNode, rootVnode, isInitialLoad);
  {
    plt.$flags$ |= 1 /* isTmpDisconnected */;
    if (checkSlotRelocate) {
      markSlotContentForRelocation(rootVnode.$elm$);
      for (const relocateData of relocateNodes) {
        const nodeToRelocate = relocateData.$nodeToRelocate$;
        if (!nodeToRelocate["s-ol"] && win.document) {
          const orgLocationNode = win.document.createTextNode("");
          orgLocationNode["s-nr"] = nodeToRelocate;
          insertBefore(
            nodeToRelocate.parentNode,
            nodeToRelocate["s-ol"] = orgLocationNode,
            nodeToRelocate,
            isInitialLoad
          );
        }
      }
      for (const relocateData of relocateNodes) {
        const nodeToRelocate = relocateData.$nodeToRelocate$;
        const slotRefNode = relocateData.$slotRefNode$;
        if (nodeToRelocate.nodeType === 1 /* ElementNode */ && isInitialLoad) {
          nodeToRelocate["s-ih"] = (_a = nodeToRelocate.hidden) != null ? _a : false;
        }
        if (slotRefNode) {
          const parentNodeRef = slotRefNode.parentNode;
          let insertBeforeNode = slotRefNode.nextSibling;
          if (insertBeforeNode && insertBeforeNode.nodeType === 1 /* ElementNode */) {
            let orgLocationNode = (_b = nodeToRelocate["s-ol"]) == null ? void 0 : _b.previousSibling;
            while (orgLocationNode) {
              let refNode = (_c = orgLocationNode["s-nr"]) != null ? _c : null;
              if (refNode && refNode["s-sn"] === nodeToRelocate["s-sn"] && parentNodeRef === (refNode.__parentNode || refNode.parentNode)) {
                refNode = refNode.nextSibling;
                while (refNode === nodeToRelocate || (refNode == null ? void 0 : refNode["s-sr"])) {
                  refNode = refNode == null ? void 0 : refNode.nextSibling;
                }
                if (!refNode || !refNode["s-nr"]) {
                  insertBeforeNode = refNode;
                  break;
                }
              }
              orgLocationNode = orgLocationNode.previousSibling;
            }
          }
          const parent = nodeToRelocate.__parentNode || nodeToRelocate.parentNode;
          const nextSibling = nodeToRelocate.__nextSibling || nodeToRelocate.nextSibling;
          if (!insertBeforeNode && parentNodeRef !== parent || nextSibling !== insertBeforeNode) {
            if (nodeToRelocate !== insertBeforeNode) {
              insertBefore(parentNodeRef, nodeToRelocate, insertBeforeNode, isInitialLoad);
              if (nodeToRelocate.nodeType === 8 /* CommentNode */ && nodeToRelocate.nodeValue.startsWith("s-nt-")) {
                const textNode = win.document.createTextNode(nodeToRelocate.nodeValue.replace(/^s-nt-/, ""));
                textNode["s-hn"] = nodeToRelocate["s-hn"];
                textNode["s-sn"] = nodeToRelocate["s-sn"];
                textNode["s-sh"] = nodeToRelocate["s-sh"];
                textNode["s-sr"] = nodeToRelocate["s-sr"];
                textNode["s-ol"] = nodeToRelocate["s-ol"];
                textNode["s-ol"]["s-nr"] = textNode;
                insertBefore(nodeToRelocate.parentNode, textNode, nodeToRelocate, isInitialLoad);
                nodeToRelocate.parentNode.removeChild(nodeToRelocate);
              }
              if (nodeToRelocate.nodeType === 1 /* ElementNode */ && nodeToRelocate.tagName !== "SLOT-FB") {
                nodeToRelocate.hidden = (_d = nodeToRelocate["s-ih"]) != null ? _d : false;
              }
            }
          }
          nodeToRelocate && typeof slotRefNode["s-rf"] === "function" && slotRefNode["s-rf"](slotRefNode);
        } else if (nodeToRelocate.nodeType === 1 /* ElementNode */) {
          nodeToRelocate.hidden = true;
        }
      }
    }
    if (checkSlotFallbackVisibility) {
      updateFallbackSlotVisibility(rootVnode.$elm$);
    }
    plt.$flags$ &= -2 /* isTmpDisconnected */;
    relocateNodes.length = 0;
  }
  if (!useNativeShadowDom && !(cmpMeta.$flags$ & 1 /* shadowDomEncapsulation */) && hostElm["s-cr"]) {
    const children = rootVnode.$elm$.__childNodes || rootVnode.$elm$.childNodes;
    for (const childNode of children) {
      if (childNode["s-hn"] !== hostTagName && !childNode["s-sh"]) {
        if (isInitialLoad && childNode["s-ih"] == null) {
          childNode["s-ih"] = (_e = childNode.hidden) != null ? _e : false;
        }
        if (childNode.nodeType === 1 /* ElementNode */) {
          childNode.hidden = true;
        } else if (childNode.nodeType === 3 /* TextNode */ && !!childNode.nodeValue.trim()) {
          const textCommentNode = win.document.createComment("s-nt-" + childNode.nodeValue);
          textCommentNode["s-sn"] = childNode["s-sn"];
          insertBefore(childNode.parentNode, textCommentNode, childNode, isInitialLoad);
          childNode.parentNode.removeChild(childNode);
        }
      }
    }
  }
  contentRef = void 0;
  flushQueuedRefCallbacks();
};

// src/runtime/update-component.ts
var attachToAncestor = (hostRef, ancestorComponent) => {
  if (ancestorComponent && !hostRef.$onRenderResolve$ && ancestorComponent["s-p"]) {
    const index = ancestorComponent["s-p"].push(
      new Promise(
        (r) => hostRef.$onRenderResolve$ = () => {
          ancestorComponent["s-p"].splice(index - 1, 1);
          r();
        }
      )
    );
  }
};
var scheduleUpdate = (hostRef, isInitialLoad) => {
  {
    hostRef.$flags$ |= 16 /* isQueuedForUpdate */;
  }
  if (hostRef.$flags$ & 4 /* isWaitingForChildren */) {
    hostRef.$flags$ |= 512 /* needsRerender */;
    return;
  }
  attachToAncestor(hostRef, hostRef.$ancestorComponent$);
  const dispatch = () => dispatchHooks(hostRef, isInitialLoad);
  if (isInitialLoad) {
    queueMicrotask(() => {
      dispatch();
    });
    return;
  }
  return writeTask(dispatch) ;
};
var dispatchHooks = (hostRef, isInitialLoad) => {
  const elm = hostRef.$hostElement$;
  const endSchedule = createTime("scheduleUpdate", hostRef.$cmpMeta$.$tagName$);
  const instance = elm;
  if (!instance) {
    throw new Error(
      `Can't render component <${elm.tagName.toLowerCase()} /> with invalid Stencil runtime! Make sure this imported component is compiled with a \`externalRuntime: true\` flag. For more information, please refer to https://stenciljs.com/docs/custom-elements#externalruntime`
    );
  }
  let maybePromise;
  if (isInitialLoad) {
    emitLifecycleEvent(elm, "componentWillLoad");
    maybePromise = safeCall(instance, "componentWillLoad", void 0, elm);
  } else {
    emitLifecycleEvent(elm, "componentWillUpdate");
    maybePromise = safeCall(instance, "componentWillUpdate", void 0, elm);
  }
  emitLifecycleEvent(elm, "componentWillRender");
  maybePromise = enqueue(maybePromise, () => safeCall(instance, "componentWillRender", void 0, elm));
  endSchedule();
  return enqueue(maybePromise, () => updateComponent(hostRef, instance, isInitialLoad));
};
var enqueue = (maybePromise, fn) => isPromisey(maybePromise) ? maybePromise.then(fn).catch((err) => {
  console.error(err);
  fn();
}) : fn();
var isPromisey = (maybePromise) => maybePromise instanceof Promise || maybePromise && maybePromise.then && typeof maybePromise.then === "function";
var updateComponent = async (hostRef, instance, isInitialLoad) => {
  var _a;
  const elm = hostRef.$hostElement$;
  const endUpdate = createTime("update", hostRef.$cmpMeta$.$tagName$);
  const rc = elm["s-rc"];
  if (isInitialLoad) {
    attachStyles(hostRef);
  }
  const endRender = createTime("render", hostRef.$cmpMeta$.$tagName$);
  {
    callRender(hostRef, instance, elm, isInitialLoad);
  }
  if (rc) {
    rc.map((cb) => cb());
    elm["s-rc"] = void 0;
  }
  endRender();
  endUpdate();
  {
    const childrenPromises = (_a = elm["s-p"]) != null ? _a : [];
    const postUpdate = () => postUpdateComponent(hostRef);
    if (childrenPromises.length === 0) {
      postUpdate();
    } else {
      Promise.all(childrenPromises).then(postUpdate).catch(postUpdate);
      hostRef.$flags$ |= 4 /* isWaitingForChildren */;
      childrenPromises.length = 0;
    }
  }
};
var callRender = (hostRef, instance, elm, isInitialLoad) => {
  try {
    instance = instance.render && instance.render();
    {
      hostRef.$flags$ &= -17 /* isQueuedForUpdate */;
    }
    {
      hostRef.$flags$ |= 2 /* hasRendered */;
    }
    {
      {
        {
          renderVdom(hostRef, instance, isInitialLoad);
        }
      }
    }
  } catch (e) {
    consoleError(e, hostRef.$hostElement$);
  }
  return null;
};
var postUpdateComponent = (hostRef) => {
  const tagName = hostRef.$cmpMeta$.$tagName$;
  const elm = hostRef.$hostElement$;
  const endPostUpdate = createTime("postUpdate", tagName);
  const instance = elm;
  const ancestorComponent = hostRef.$ancestorComponent$;
  safeCall(instance, "componentDidRender", void 0, elm);
  emitLifecycleEvent(elm, "componentDidRender");
  if (!(hostRef.$flags$ & 64 /* hasLoadedComponent */)) {
    hostRef.$flags$ |= 64 /* hasLoadedComponent */;
    {
      addHydratedFlag(elm);
    }
    safeCall(instance, "componentDidLoad", void 0, elm);
    emitLifecycleEvent(elm, "componentDidLoad");
    endPostUpdate();
    {
      hostRef.$onReadyResolve$(elm);
      if (!ancestorComponent) {
        appDidLoad();
      }
    }
  } else {
    safeCall(instance, "componentDidUpdate", void 0, elm);
    emitLifecycleEvent(elm, "componentDidUpdate");
    endPostUpdate();
  }
  {
    if (hostRef.$onRenderResolve$) {
      hostRef.$onRenderResolve$();
      hostRef.$onRenderResolve$ = void 0;
    }
    if (hostRef.$flags$ & 512 /* needsRerender */) {
      nextTick(() => scheduleUpdate(hostRef, false));
    }
    hostRef.$flags$ &= -517;
  }
};
var forceUpdate = (ref) => {
  var _a;
  {
    const hostRef = getHostRef(ref);
    const isConnected = (_a = hostRef == null ? void 0 : hostRef.$hostElement$) == null ? void 0 : _a.isConnected;
    if (isConnected && (hostRef.$flags$ & (2 /* hasRendered */ | 16 /* isQueuedForUpdate */)) === 2 /* hasRendered */) {
      scheduleUpdate(hostRef, false);
    }
    return isConnected;
  }
};
var appDidLoad = (who) => {
  var _a;
  nextTick(() => emitEvent(win, "appload", { detail: { namespace: NAMESPACE } }));
  {
    if ((_a = plt.$orgLocNodes$) == null ? void 0 : _a.size) {
      plt.$orgLocNodes$.clear();
    }
  }
};
var safeCall = (instance, method, arg, elm) => {
  if (instance && instance[method]) {
    try {
      return instance[method](arg);
    } catch (e) {
      consoleError(e, elm);
    }
  }
  return void 0;
};
var emitLifecycleEvent = (elm, lifecycleName) => {
  {
    emitEvent(elm, "stencil_" + lifecycleName, {
      bubbles: true,
      composed: true,
      detail: {
        namespace: NAMESPACE
      }
    });
  }
};
var addHydratedFlag = (elm) => {
  var _a;
  return elm.classList.add((_a = BUILD.hydratedSelectorName) != null ? _a : "hydrated") ;
};

// src/runtime/set-value.ts
var getValue = (ref, propName) => getHostRef(ref).$instanceValues$.get(propName);
var setValue = (ref, propName, newVal, cmpMeta) => {
  const hostRef = getHostRef(ref);
  if (!hostRef) {
    return;
  }
  if (hostRef.$serializerValues$.has(propName) && hostRef.$serializerValues$.get(propName) === newVal) {
    return;
  }
  const elm = ref;
  const oldVal = hostRef.$instanceValues$.get(propName);
  const flags = hostRef.$flags$;
  const instance = elm;
  newVal = parsePropertyValue(
    newVal,
    cmpMeta.$members$[propName][0],
    !!(cmpMeta.$flags$ & 64 /* formAssociated */)
  );
  const areBothNaN = Number.isNaN(oldVal) && Number.isNaN(newVal);
  const didValueChange = newVal !== oldVal && !areBothNaN;
  if (didValueChange) {
    hostRef.$instanceValues$.set(propName, newVal);
    if (cmpMeta.$attrsToReflect$) {
      if (cmpMeta.$serializers$ && cmpMeta.$serializers$[propName]) {
        const runSerializer = (inst) => {
          let attrVal = newVal;
          for (const serializer of cmpMeta.$serializers$[propName]) {
            const [[methodName]] = Object.entries(serializer);
            attrVal = inst[methodName](attrVal, propName);
          }
          hostRef.$serializerValues$.set(propName, attrVal);
        };
        if (instance) {
          runSerializer(instance);
        } else {
          hostRef.$fetchedCbList$.push(() => {
            runSerializer(hostRef.$lazyInstance$);
          });
        }
      }
    }
    if (cmpMeta.$watchers$) {
      const watchMethods = cmpMeta.$watchers$[propName];
      if (watchMethods) {
        watchMethods.map((watcher) => {
          try {
            const [[watchMethodName, watcherFlags]] = Object.entries(watcher);
            if (flags & 128 /* isWatchReady */ || watcherFlags & 1 /* Immediate */) {
              if (!instance) {
                hostRef.$fetchedCbList$.push(() => {
                  hostRef.$lazyInstance$[watchMethodName](newVal, oldVal, propName);
                });
              } else {
                instance[watchMethodName](newVal, oldVal, propName);
              }
            }
          } catch (e) {
            consoleError(e, elm);
          }
        });
      }
    }
    if (flags & 2 /* hasRendered */) {
      if (instance.componentShouldUpdate) {
        const shouldUpdate = instance.componentShouldUpdate(newVal, oldVal, propName);
        if (shouldUpdate === false && !(flags & 16 /* isQueuedForUpdate */)) {
          return;
        }
      }
      if (!(flags & 16 /* isQueuedForUpdate */)) {
        scheduleUpdate(hostRef, false);
      }
    }
  }
};

// src/runtime/proxy-component.ts
var proxyComponent = (Cstr, cmpMeta, flags) => {
  var _a, _b;
  const prototype = Cstr.prototype;
  if (cmpMeta.$flags$ & 64 /* formAssociated */ && flags & 1 /* isElementConstructor */) {
    FORM_ASSOCIATED_CUSTOM_ELEMENT_CALLBACKS.forEach((cbName) => {
      const originalFormAssociatedCallback = prototype[cbName];
      Object.defineProperty(prototype, cbName, {
        value(...args) {
          var _a2;
          const hostRef = getHostRef(this);
          const instance = this;
          if (!instance) {
            (_a2 = hostRef == null ? void 0 : hostRef.$onReadyPromise$) == null ? void 0 : _a2.then((asyncInstance) => {
              const cb = asyncInstance[cbName];
              typeof cb === "function" && cb.call(asyncInstance, ...args);
            });
          } else {
            const cb = originalFormAssociatedCallback;
            typeof cb === "function" && cb.call(instance, ...args);
          }
        }
      });
    });
  }
  {
    {
      if (Cstr.watchers && !cmpMeta.$watchers$) {
        cmpMeta.$watchers$ = Cstr.watchers;
      }
      if (Cstr.deserializers && !cmpMeta.$deserializers$) {
        cmpMeta.$deserializers$ = Cstr.deserializers;
      }
      if (Cstr.serializers && !cmpMeta.$serializers$) {
        cmpMeta.$serializers$ = Cstr.serializers;
      }
    }
    const members = Object.entries((_a = cmpMeta.$members$) != null ? _a : {});
    members.map(([memberName, [memberFlags]]) => {
      if ((memberFlags & 31 /* Prop */ || memberFlags & 32 /* State */)) {
        const { get: origGetter, set: origSetter } = getPropertyDescriptor(prototype, memberName) || {};
        if (origGetter) cmpMeta.$members$[memberName][0] |= 2048 /* Getter */;
        if (origSetter) cmpMeta.$members$[memberName][0] |= 4096 /* Setter */;
        {
          Object.defineProperty(prototype, memberName, {
            get() {
              {
                return origGetter ? origGetter.apply(this) : getValue(this, memberName);
              }
            },
            configurable: true,
            enumerable: true
          });
        }
        Object.defineProperty(prototype, memberName, {
          set(newValue) {
            const ref = getHostRef(this);
            if (!ref) {
              return;
            }
            if (origSetter) {
              const currentValue = memberFlags & 32 /* State */ ? this[memberName] : ref.$hostElement$[memberName];
              if (typeof currentValue === "undefined" && ref.$instanceValues$.get(memberName)) {
                newValue = ref.$instanceValues$.get(memberName);
              }
              origSetter.apply(this, [
                parsePropertyValue(
                  newValue,
                  memberFlags,
                  !!(cmpMeta.$flags$ & 64 /* formAssociated */)
                )
              ]);
              newValue = memberFlags & 32 /* State */ ? this[memberName] : ref.$hostElement$[memberName];
              setValue(this, memberName, newValue, cmpMeta);
              return;
            }
            {
              setValue(this, memberName, newValue, cmpMeta);
              return;
            }
          }
        });
      }
    });
    {
      const attrNameToPropName = /* @__PURE__ */ new Map();
      prototype.attributeChangedCallback = function(attrName, oldValue, newValue) {
        plt.jmp(() => {
          var _a2;
          const propName = attrNameToPropName.get(attrName);
          const hostRef = getHostRef(this);
          if (hostRef.$serializerValues$.has(propName) && hostRef.$serializerValues$.get(propName) === newValue) {
            return;
          }
          if (this.hasOwnProperty(propName) && BUILD.lazyLoad) ;
          if (cmpMeta.$deserializers$ && cmpMeta.$deserializers$[propName]) {
            const setVal = (methodName, instance) => {
              const deserializeVal = instance == null ? void 0 : instance[methodName](newValue, propName);
              if (deserializeVal !== this[propName]) {
                this[propName] = deserializeVal;
              }
            };
            for (const deserializer of cmpMeta.$deserializers$[propName]) {
              const [[methodName]] = Object.entries(deserializer);
              {
                setVal(methodName, this);
              }
            }
            return;
          } else if (prototype.hasOwnProperty(propName) && typeof this[propName] === "number" && // cast type to number to avoid TS compiler issues
          this[propName] == newValue) {
            return;
          } else if (propName == null) {
            const flags2 = hostRef == null ? void 0 : hostRef.$flags$;
            if (hostRef && flags2 && !(flags2 & 8 /* isConstructingInstance */) && newValue !== oldValue) {
              const elm = this;
              const instance = elm;
              const entry = (_a2 = cmpMeta.$watchers$) == null ? void 0 : _a2[attrName];
              entry == null ? void 0 : entry.forEach((watcher) => {
                const [[watchMethodName, watcherFlags]] = Object.entries(watcher);
                if (instance[watchMethodName] != null && (flags2 & 128 /* isWatchReady */ || watcherFlags & 1 /* Immediate */)) {
                  instance[watchMethodName].call(instance, newValue, oldValue, attrName);
                }
              });
            }
            return;
          }
          const propFlags = members.find(([m]) => m === propName);
          if (propFlags && propFlags[1][0] & 4 /* Boolean */) {
            newValue = newValue === null || newValue === "false" ? false : true;
          }
          const propDesc = Object.getOwnPropertyDescriptor(prototype, propName);
          if (newValue != this[propName] && (!propDesc.get || !!propDesc.set)) {
            this[propName] = newValue;
          }
        });
      };
      Cstr.observedAttributes = Array.from(
        /* @__PURE__ */ new Set([
          ...Object.keys((_b = cmpMeta.$watchers$) != null ? _b : {}),
          ...members.filter(([_, m]) => m[0] & 31 /* HasAttribute */).map(([propName, m]) => {
            var _a2;
            const attrName = m[1] || propName;
            attrNameToPropName.set(attrName, propName);
            if (m[0] & 512 /* ReflectAttr */) {
              (_a2 = cmpMeta.$attrsToReflect$) == null ? void 0 : _a2.push([propName, attrName]);
            }
            return attrName;
          })
        ])
      );
    }
  }
  return Cstr;
};

// src/runtime/initialize-component.ts
var initializeComponent = async (elm, hostRef, cmpMeta, hmrVersionId) => {
  let Cstr;
  try {
    if ((hostRef.$flags$ & 32 /* hasInitializedComponent */) === 0) {
      hostRef.$flags$ |= 32 /* hasInitializedComponent */;
      {
        Cstr = elm.constructor;
        const cmpTag = elm.localName;
        customElements.whenDefined(cmpTag).then(() => hostRef.$flags$ |= 128 /* isWatchReady */);
      }
      if (Cstr && Cstr.style) {
        let style;
        if (typeof Cstr.style === "string") {
          style = Cstr.style;
        } else if (typeof Cstr.style !== "string") {
          hostRef.$modeName$ = computeMode(elm);
          if (hostRef.$modeName$) {
            style = Cstr.style[hostRef.$modeName$];
          }
        }
        const scopeId2 = getScopeId(cmpMeta, hostRef.$modeName$);
        if (!styles.has(scopeId2) || BUILD.hotModuleReplacement) {
          const endRegisterStyles = createTime("registerStyles", cmpMeta.$tagName$);
          registerStyle(scopeId2, style, !!(cmpMeta.$flags$ & 1 /* shadowDomEncapsulation */));
          endRegisterStyles();
        }
      }
    }
    const ancestorComponent = hostRef.$ancestorComponent$;
    const schedule = () => scheduleUpdate(hostRef, true);
    if (ancestorComponent && ancestorComponent["s-rc"]) {
      ancestorComponent["s-rc"].push(schedule);
    } else {
      schedule();
    }
  } catch (e) {
    consoleError(e, elm);
    if (hostRef.$onRenderResolve$) {
      hostRef.$onRenderResolve$();
      hostRef.$onRenderResolve$ = void 0;
    }
    if (hostRef.$onReadyResolve$) {
      hostRef.$onReadyResolve$(elm);
    }
  }
};
var fireConnectedCallback = (instance, elm) => {
};

// src/runtime/connected-callback.ts
var connectedCallback = (elm) => {
  if ((plt.$flags$ & 1 /* isTmpDisconnected */) === 0) {
    const hostRef = getHostRef(elm);
    if (!hostRef) {
      return;
    }
    const cmpMeta = hostRef.$cmpMeta$;
    const endConnected = createTime("connectedCallback", cmpMeta.$tagName$);
    if (!(hostRef.$flags$ & 1 /* hasConnected */)) {
      hostRef.$flags$ |= 1 /* hasConnected */;
      let hostId;
      {
        hostId = elm.getAttribute(HYDRATE_ID);
        if (hostId) {
          if (cmpMeta.$flags$ & 1 /* shadowDomEncapsulation */) {
            const scopeId2 = addStyle(elm.shadowRoot, cmpMeta, elm.getAttribute("s-mode")) ;
            elm.classList.remove(scopeId2 + "-h", scopeId2 + "-s");
          } else if (cmpMeta.$flags$ & 2 /* scopedCssEncapsulation */) {
            const scopeId2 = getScopeId(cmpMeta, elm.getAttribute("s-mode") );
            elm["s-sc"] = scopeId2;
          }
          initializeClientHydrate(elm, cmpMeta.$tagName$, hostId, hostRef);
        }
      }
      if (!hostId) {
        if (// TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
        cmpMeta.$flags$ & (4 /* hasSlotRelocation */ | 8 /* needsShadowDomShim */)) {
          setContentReference(elm);
        }
      }
      {
        let ancestorComponent = elm;
        while (ancestorComponent = ancestorComponent.parentNode || ancestorComponent.host) {
          if (ancestorComponent.nodeType === 1 /* ElementNode */ && ancestorComponent.hasAttribute("s-id") && ancestorComponent["s-p"] || ancestorComponent["s-p"]) {
            attachToAncestor(hostRef, hostRef.$ancestorComponent$ = ancestorComponent);
            break;
          }
        }
      }
      if (cmpMeta.$members$) {
        Object.entries(cmpMeta.$members$).map(([memberName, [memberFlags]]) => {
          if (memberFlags & 31 /* Prop */ && Object.prototype.hasOwnProperty.call(elm, memberName)) {
            const value = elm[memberName];
            delete elm[memberName];
            elm[memberName] = value;
          }
        });
      }
      {
        initializeComponent(elm, hostRef, cmpMeta);
      }
    } else {
      addHostEventListeners(elm, hostRef, cmpMeta.$listeners$);
      if (hostRef == null ? void 0 : hostRef.$lazyInstance$) ; else if (hostRef == null ? void 0 : hostRef.$onReadyPromise$) {
        hostRef.$onReadyPromise$.then(() => fireConnectedCallback());
      }
    }
    endConnected();
  }
};
var setContentReference = (elm) => {
  if (!win.document) {
    return;
  }
  const contentRefElm = elm["s-cr"] = win.document.createComment(
    ""
  );
  contentRefElm["s-cn"] = true;
  insertBefore(elm, contentRefElm, elm.firstChild);
};
var disconnectedCallback = async (elm) => {
  if ((plt.$flags$ & 1 /* isTmpDisconnected */) === 0) {
    const hostRef = getHostRef(elm);
    {
      if (hostRef == null ? void 0 : hostRef.$rmListeners$) {
        hostRef.$rmListeners$.map((rmListener) => rmListener());
        hostRef.$rmListeners$ = void 0;
      }
    }
  }
  if (rootAppliedStyles.has(elm)) {
    rootAppliedStyles.delete(elm);
  }
  if (elm.shadowRoot && rootAppliedStyles.has(elm.shadowRoot)) {
    rootAppliedStyles.delete(elm.shadowRoot);
  }
};
var proxyCustomElement = (Cstr, compactMeta) => {
  const cmpMeta = {
    $flags$: compactMeta[0],
    $tagName$: compactMeta[1]
  };
  try {
    {
      cmpMeta.$members$ = compactMeta[2];
    }
    {
      cmpMeta.$listeners$ = compactMeta[3];
    }
    {
      cmpMeta.$watchers$ = Cstr.$watchers$;
      cmpMeta.$deserializers$ = Cstr.$deserializers$;
      cmpMeta.$serializers$ = Cstr.$serializers$;
    }
    {
      cmpMeta.$attrsToReflect$ = [];
    }
    if (!(cmpMeta.$flags$ & 1 /* shadowDomEncapsulation */) && cmpMeta.$flags$ & 256 /* hasSlot */) {
      {
        patchPseudoShadowDom(Cstr.prototype);
      }
    } else {
      patchCloneNode(Cstr.prototype);
    }
    {
      hydrateScopedToShadow();
    }
    const originalConnectedCallback = Cstr.prototype.connectedCallback;
    const originalDisconnectedCallback = Cstr.prototype.disconnectedCallback;
    Object.assign(Cstr.prototype, {
      __hasHostListenerAttached: false,
      __registerHost() {
        registerHost(this, cmpMeta);
      },
      connectedCallback() {
        if (!this.__hasHostListenerAttached) {
          const hostRef = getHostRef(this);
          if (!hostRef) {
            return;
          }
          addHostEventListeners(this, hostRef, cmpMeta.$listeners$);
          this.__hasHostListenerAttached = true;
        }
        connectedCallback(this);
        if (originalConnectedCallback) {
          originalConnectedCallback.call(this);
        }
      },
      disconnectedCallback() {
        disconnectedCallback(this);
        if (originalDisconnectedCallback) {
          originalDisconnectedCallback.call(this);
        }
      },
      __attachShadow() {
        {
          if (!this.shadowRoot) {
            createShadowRoot.call(this, cmpMeta);
          } else {
            if (this.shadowRoot.mode !== "open") {
              throw new Error(
                `Unable to re-use existing shadow root for ${cmpMeta.$tagName$}! Mode is set to ${this.shadowRoot.mode} but Stencil only supports open shadow roots.`
              );
            }
          }
        }
      }
    });
    Object.defineProperty(Cstr, "is", {
      value: cmpMeta.$tagName$,
      configurable: true
    });
    return proxyComponent(Cstr, cmpMeta, 1 /* isElementConstructor */ | 2 /* proxyState */);
  } catch (e) {
    consoleError(e);
    return Cstr;
  }
};

// src/runtime/fragment.ts
var Fragment = (_, children) => children;
var addHostEventListeners = (elm, hostRef, listeners, attachParentListeners) => {
  if (listeners && win.document) {
    listeners.map(([flags, name, method]) => {
      const target = getHostListenerTarget(win.document, elm, flags) ;
      const handler = hostListenerProxy(hostRef, method);
      const opts = hostListenerOpts(flags);
      plt.ael(target, name, handler, opts);
      (hostRef.$rmListeners$ = hostRef.$rmListeners$ || []).push(() => plt.rel(target, name, handler, opts));
    });
  }
};
var hostListenerProxy = (hostRef, methodName) => (ev) => {
  try {
    {
      hostRef.$hostElement$[methodName](ev);
    }
  } catch (e) {
    consoleError(e, hostRef.$hostElement$);
  }
};
var getHostListenerTarget = (doc, elm, flags) => {
  if (flags & 4 /* TargetDocument */) {
    return doc;
  }
  if (flags & 8 /* TargetWindow */) {
    return win;
  }
  return elm;
};
var hostListenerOpts = (flags) => supportsListenerOptions ? {
  passive: (flags & 1 /* Passive */) !== 0,
  capture: (flags & 2 /* Capture */) !== 0
} : (flags & 2 /* Capture */) !== 0;
var baseClass = globalThis.HTMLElement || class {
};
function Mixin(...mixins) {
  return mixins.reduceRight((acc, mixin) => mixin(acc), baseClass);
}

// src/runtime/nonce.ts
var setNonce = (nonce) => plt.$nonce$ = nonce;

// src/runtime/platform-options.ts
var setPlatformOptions = (opts) => Object.assign(plt, opts);

// src/runtime/render.ts
function render(vnode, container) {
  const cmpMeta = {
    $flags$: 0,
    $tagName$: container.tagName
  };
  const ref = {
    $cmpMeta$: cmpMeta,
    $hostElement$: container
  };
  renderVdom(ref, vnode);
}

// src/runtime/tag-transform.ts
var tagTransformer$1 = void 0;
function transformTag(tag) {
  if (!tagTransformer$1) return tag;
  return tagTransformer$1(tag);
}
function setTagTransformer(transformer) {
  if (tagTransformer$1) {
    console.warn(`
      A tagTransformer has already been set. 
      Overwriting it may lead to error and unexpected results if your components have already been defined.
    `);
  }
  tagTransformer$1 = transformer;
}

var global = () => { };

var tagTransformer = (tagName) => {
    if (tagName.endsWith('-tag-transform')) {
        return tagName.replace('-tag-transform', '-tag-is-transformed');
    }
    return tagName;
};

// this doesn't do anything - just stops rollup removing the import
setAssetPath('/base/path');
// this is for `dist-custom-elements` output target tests - needs to be set early,
// but doesn't get called at all in `dist` :/
setTagTransformer(tagTransformer);
const globalScript = () => {
    // this is primarily for `dist` output target tests
    // gets called too late for `dist-custom-elements` style map registration
    setTagTransformer(tagTransformer);
    setMode((elm) => {
        if (!elm)
            return null;
        return elm.colormode || elm.getAttribute('colormode');
    });
};
globalThis.document ? document.createElement(transformTag('div')) : null;

const testSiblingGlobalScript = global || (() => {});
const testAppGlobalScript = globalScript || (() => {});
const globalScripts = () => {
  return Promise.all([
    testAppGlobalScript(),
    testSiblingGlobalScript(),
  ]);
};
const globalStyles = "h2{font-size:16px;color:red}h2::after{content:': from global-css-entry.css'}:host{display:block;margin:10px;padding:20px;border:5px dotted red}h1{font-size:18px;color:maroon;display:flex}h1::after{content:\": from global-sass-entry.scss\"}";

export { Build as B, Fragment as F, H, Mixin as M, getAssetPath as a, setNonce as b, setPlatformOptions as c, Host as d, createEvent as e, forceUpdate as f, globalScripts as g, h, getMode as i, proxyCustomElement as p, render as r, setAssetPath as s, transformTag as t };
