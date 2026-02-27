var e,
  t = (e) => {
    if (e.__stencil__getHostRef) return e.__stencil__getHostRef();
  },
  n = (e, t) => {
    t && ((e.__stencil__getHostRef = () => t), (t.t = e));
  },
  o = (e, t) => (0, console.error)(e, t),
  l = new Map(),
  r = 'undefined' != typeof window ? window : {},
  s = {
    o: 0,
    l: '',
    jmp: (e) => e(),
    raf: (e) => requestAnimationFrame(e),
    ael: (e, t, n, o) => e.addEventListener(t, n, o),
    rel: (e, t, n, o) => e.removeEventListener(t, n, o),
    ce: (e, t) => new CustomEvent(e, t),
  },
  i = (e) => Promise.resolve(e),
  c =
    !!(() => {
      try {
        return (
          !!r.document.adoptedStyleSheets && (new CSSStyleSheet(), 'function' == typeof new CSSStyleSheet().replaceSync)
        );
      } catch (e) {}
      return !1;
    })() && (() => !!r.document && Object.getOwnPropertyDescriptor(r.document.adoptedStyleSheets, 'length').writable)(),
  a = !1,
  u = [],
  d = [],
  f = (e, t) => (n) => {
    e.push(n), a || ((a = !0), t && 4 & s.o ? $(m) : s.raf(m));
  },
  p = (e) => {
    for (let t = 0; t < e.length; t++)
      try {
        e[t](performance.now());
      } catch (e) {
        o(e);
      }
    e.length = 0;
  },
  m = () => {
    p(u), p(d), (a = u.length > 0) && s.raf(m);
  },
  $ = (e) => i().then(e),
  h = f(d, !0);
function v() {
  const t = this.attachShadow({ mode: 'open' });
  void 0 === e && (e = null),
    e && (c ? t.adoptedStyleSheets.push(e) : (t.adoptedStyleSheets = [...t.adoptedStyleSheets, e]));
}
var y,
  w = new WeakMap(),
  b = (e) => 'object' == (e = typeof e) || 'function' === e,
  g = (e, t, ...n) => {
    let o = null,
      l = null,
      r = !1,
      s = !1;
    const i = [],
      c = (t) => {
        for (let n = 0; n < t.length; n++)
          (o = t[n]),
            Array.isArray(o)
              ? c(o)
              : null != o &&
                'boolean' != typeof o &&
                ((r = 'function' != typeof e && !b(o)) && (o += ''),
                r && s ? (i[i.length - 1].i += o) : i.push(r ? S(null, o) : o),
                (s = r));
      };
    if ((c(n), t)) {
      t.key && (l = t.key);
      {
        const e = t.className || t.class;
        e &&
          (t.class =
            'object' != typeof e
              ? e
              : Object.keys(e)
                  .filter((t) => e[t])
                  .join(' '));
      }
    }
    const a = S(e, null);
    return (a.u = t), i.length > 0 && (a.p = i), (a.m = l), a;
  },
  S = (e, t) => ({ o: 0, $: e, i: null != t ? t : null, h: null, p: null, u: null, m: null }),
  j = {},
  k = (e, t, n, o) => {
    if (n !== o && (t.toLowerCase(), 'class' === t)) {
      const t = e.classList,
        l = C(n);
      let r = C(o);
      t.remove(...l.filter((e) => e && !r.includes(e))), t.add(...r.filter((e) => e && !l.includes(e)));
    }
  },
  M = /\s/,
  C = (e) => (
    'object' == typeof e && e && 'baseVal' in e && (e = e.baseVal), e && 'string' == typeof e ? e.split(M) : []
  ),
  E = (e, t) => {
    const n = 11 === t.h.nodeType && t.h.host ? t.h.host : t.h,
      o = (e && e.u) || {},
      l = t.u || {};
    for (const e of (function (e) {
      return e.includes('ref') ? [...e.filter((e) => 'ref' !== e), 'ref'] : e;
    })(Object.keys(l)))
      k(n, e, o[e], l[e]);
  },
  O = (e, t, n) => {
    const o = t.p[n];
    let l,
      s,
      i = 0;
    if (null != o.i) l = o.h = r.document.createTextNode(o.i);
    else {
      if (!r.document)
        throw Error("You are trying to render a Stencil component in an environment that doesn't support the DOM.");
      if (((l = o.h = r.document.createElement(o.$)), E(null, o), o.p)) {
        const t = 'template' === o.$ ? l.content : l;
        for (i = 0; i < o.p.length; ++i) (s = O(e, o, i)), s && t.appendChild(s);
      }
    }
    return (l['s-hn'] = y), l;
  },
  x = (e, t, n) => (e.__insertBefore ? e.__insertBefore(t, n) : null == e ? void 0 : e.insertBefore(t, n)),
  R = (e, t, n = !1) => {
    const o = e.$hostElement$,
      l = e.v || S(null, null),
      r = ((e) => e && e.$ === j)(t) ? t : g(null, null, t);
    if (((y = o.tagName), n && r.u))
      for (const e of Object.keys(r.u))
        o.hasAttribute(e) && !['key', 'ref', 'style', 'class'].includes(e) && (r.u[e] = o[e]);
    (r.$ = null),
      (r.o |= 4),
      (e.v = r),
      (r.h = l.h = o.shadowRoot || o),
      ((e, t) => {
        const n = (t.h = e.h),
          o = t.p,
          l = t.i;
        null == l
          ? (E(e, t),
            null !== o &&
              ((e, t, n, o, l, r) => {
                let s,
                  i = e;
                for (
                  i.shadowRoot && i.tagName === y && (i = i.shadowRoot), 'template' === n.$ && (i = i.content);
                  l <= r;
                  ++l
                )
                  o[l] && ((s = O(null, n, l)), s && ((o[l].h = s), x(i, s, null)));
              })(n, 0, t, o, 0, o.length - 1))
          : e.i !== l && (n.data = l);
      })(l, r);
  },
  L = (e, t) => {
    if (t && !e.S && t['s-p']) {
      const n = t['s-p'].push(
        new Promise(
          (o) =>
            (e.S = () => {
              t['s-p'].splice(n - 1, 1), o();
            }),
        ),
      );
    }
  },
  P = (e, t) => {
    if (4 & e.o) return void (e.o |= 512);
    L(e, e.j);
    const n = () => U(e, t);
    if (!t) return h(n);
    queueMicrotask(() => {
      n();
    });
  },
  U = (e, t) => {
    const n = e.$hostElement$,
      o = e.t;
    if (!o)
      throw Error(
        `Can't render component <${n.tagName.toLowerCase()} /> with invalid Stencil runtime! Make sure this imported component is compiled with a \`externalRuntime: true\` flag. For more information, please refer to https://stenciljs.com/docs/custom-elements#externalruntime`,
      );
    let l;
    return (
      t
        ? (e.k.length && e.k.forEach((e) => e(n)), (l = z(o, 'componentWillLoad', void 0, n)))
        : (l = z(o, 'componentWillUpdate', void 0, n)),
      (l = D(l, () => z(o, 'componentWillRender', void 0, n))),
      D(l, () => N(e, o, t))
    );
  },
  D = (e, t) =>
    W(e)
      ? e.then(t).catch((e) => {
          console.error(e), t();
        })
      : t(),
  W = (e) => e instanceof Promise || (e && e.then && 'function' == typeof e.then),
  N = async (e, t, n) => {
    var o;
    const l = e.$hostElement$,
      r = l['s-rc'];
    T(e, t, l, n), r && (r.map((e) => e()), (l['s-rc'] = void 0));
    {
      const t = null != (o = l['s-p']) ? o : [],
        n = () => V(e);
      0 === t.length ? n() : (Promise.all(t).then(n).catch(n), (e.o |= 4), (t.length = 0));
    }
  },
  T = (e, t, n, l) => {
    try {
      (t = t.render()), (e.o |= 2), R(e, t, l);
    } catch (t) {
      o(t, e.$hostElement$);
    }
    return null;
  },
  V = (e) => {
    const t = e.$hostElement$,
      n = e.t,
      o = e.j;
    z(n, 'componentDidRender', void 0, t),
      64 & e.o
        ? z(n, 'componentDidUpdate', void 0, t)
        : ((e.o |= 64), A(t), z(n, 'componentDidLoad', void 0, t), e.M(t), o || q()),
      e.S && (e.S(), (e.S = void 0)),
      512 & e.o && $(() => P(e, !1)),
      (e.o &= -517);
  },
  q = () => {
    $(() =>
      ((e) => {
        const t = s.ce('appload', { detail: { namespace: 'testautoloader' } });
        return e.dispatchEvent(t), t;
      })(r),
    );
  },
  z = (e, t, n, l) => {
    if (e && e[t])
      try {
        return e[t](n);
      } catch (e) {
        o(e, l);
      }
  },
  A = (e) => e.classList.add('hydrated'),
  F = (e, t) => {
    z(e, 'connectedCallback', void 0, t);
  },
  H = (e, t) => {
    z(e, 'disconnectedCallback', void 0, t || e);
  },
  Y = (e, n = {}) => {
    var i;
    if (!r.document) return void console.warn('Stencil: No document found. Skipping bootstrapping lazy components.');
    const c = [],
      a = n.exclude || [],
      u = r.customElements,
      d = r.document.head,
      f = d.querySelector('meta[charset]'),
      p = r.document.createElement('style'),
      m = [];
    let $,
      h = !0;
    if (
      (Object.assign(s, n),
      (s.l = new URL(n.resourcesUrl || './', r.document.baseURI).href),
      e.map((e) => {
        e[1].map((n) => {
          const r = { o: n[0], C: n[1], O: n[2], R: n[3] },
            i = r.C,
            d = class extends HTMLElement {
              's-p';
              's-rc';
              hasRegisteredEventListeners = !1;
              constructor(e) {
                if (
                  (super(e),
                  ((e, t) => {
                    const n = { o: 0, $hostElement$: e, L: t, P: new Map(), U: new Map() };
                    (n.D = new Promise((e) => (n.M = e))), (e['s-p'] = []), (e['s-rc'] = []), (n.k = []);
                    const o = n;
                    e.__stencil__getHostRef = () => o;
                  })((e = this), r),
                  1 & r.o)
                )
                  if (e.shadowRoot) {
                    if ('open' !== e.shadowRoot.mode)
                      throw Error(
                        `Unable to re-use existing shadow root for ${r.C}! Mode is set to ${e.shadowRoot.mode} but Stencil only supports open shadow roots.`,
                      );
                  } else v.call(e, r);
              }
              connectedCallback() {
                t(this) &&
                  (this.hasRegisteredEventListeners || (this.hasRegisteredEventListeners = !0),
                  $ && (clearTimeout($), ($ = null)),
                  h
                    ? m.push(this)
                    : s.jmp(() =>
                        ((e) => {
                          if (!(1 & s.o)) {
                            const n = t(e);
                            if (!n) return;
                            const r = n.L,
                              s = () => {};
                            if (1 & n.o)
                              (null == n ? void 0 : n.t)
                                ? F(n.t, e)
                                : (null == n ? void 0 : n.D) && n.D.then(() => F(n.t, e));
                            else {
                              n.o |= 1;
                              {
                                let t = e;
                                for (; (t = t.parentNode || t.host); )
                                  if (t['s-p']) {
                                    L(n, (n.j = t));
                                    break;
                                  }
                              }
                              (async (e, t, n) => {
                                let r;
                                try {
                                  if (!(32 & t.o))
                                    if (((t.o |= 32), n.W)) {
                                      const s = ((e, t) => {
                                        const n = e.C.replace(/-/g, '_'),
                                          r = e.W;
                                        if (!r) return;
                                        const s = l.get(r);
                                        return s
                                          ? s[n]
                                          : import(`./${r}.entry.js`).then(
                                              (e) => (l.set(r, e), e[n]),
                                              (e) => {
                                                o(e, t.$hostElement$);
                                              },
                                            );
                                        /*!__STENCIL_STATIC_IMPORT_SWITCH__*/
                                      })(n, t);
                                      if (s && 'then' in s) {
                                        const e = () => {};
                                        (r = await s), e();
                                      } else r = s;
                                      if (!r) throw Error(`Constructor for "${n.C}#${t.N}" was not found`);
                                      const i = () => {};
                                      try {
                                        new r(t);
                                      } catch (t) {
                                        o(t, e);
                                      }
                                      i(), F(t.t, e);
                                    } else
                                      (r = e.constructor),
                                        customElements.whenDefined(e.localName).then(() => (t.o |= 128));
                                  const s = t.j,
                                    i = () => P(t, !0);
                                  s && s['s-rc'] ? s['s-rc'].push(i) : i();
                                } catch (n) {
                                  o(n, e), t.S && (t.S(), (t.S = void 0)), t.M && t.M(e);
                                }
                              })(e, n, r);
                            }
                            s();
                          }
                        })(this),
                      ));
              }
              disconnectedCallback() {
                s.jmp(() =>
                  (async (e) => {
                    if (!(1 & s.o)) {
                      const n = t(e);
                      (null == n ? void 0 : n.t) ? H(n.t, e) : (null == n ? void 0 : n.D) && n.D.then(() => H(n.t, e));
                    }
                    w.has(e) && w.delete(e), e.shadowRoot && w.has(e.shadowRoot) && w.delete(e.shadowRoot);
                  })(this),
                ),
                  s.raf(() => {
                    var e;
                    const n = t(this);
                    if (!n) return;
                    const o = m.findIndex((e) => e === this);
                    o > -1 && m.splice(o, 1),
                      (null == (e = null == n ? void 0 : n.v) ? void 0 : e.h) instanceof Node &&
                        !n.v.h.isConnected &&
                        delete n.v.h;
                  });
              }
              componentOnReady() {
                var e;
                return null == (e = t(this)) ? void 0 : e.D;
              }
            };
          (r.W = e[0]), a.includes(i) || u.get(i) || (c.push(i), u.define(i, d));
        });
      }),
      c.length > 0 &&
        ((p.textContent += c.sort() + '{visibility:hidden}.hydrated{visibility:inherit}'), p.innerHTML.length))
    ) {
      p.setAttribute('data-styles', '');
      const e =
        null != (i = s.T)
          ? i
          : (function () {
              var e, t, n;
              return null !=
                (n =
                  null == (t = null == (e = r.document.head) ? void 0 : e.querySelector('meta[name="csp-nonce"]'))
                    ? void 0
                    : t.getAttribute('content'))
                ? n
                : void 0;
            })();
      null != e && p.setAttribute('nonce', e), d.insertBefore(p, f ? f.nextSibling : d.firstChild);
    }
    (h = !1), m.length ? m.map((e) => e.connectedCallback()) : s.jmp(() => ($ = setTimeout(q, 30)));
  },
  _ = (e) => (s.T = e);
export { Y as b, g as h, i as p, n as r, _ as s };
