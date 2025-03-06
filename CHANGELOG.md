## 🌱 [4.27.2](https://github.com/stenciljs/core/compare/v4.27.1...v4.27.2) (2025-03-03)


### Bug Fixes

* **compiler:** revert deprecation changes to components.d.ts ([#6184](https://github.com/stenciljs/core/issues/6184)) ([66cba68](https://github.com/stenciljs/core/commit/66cba6821d287603588248707cd423735be16566)), closes [#6183](https://github.com/stenciljs/core/issues/6183), closes [#6184](https://github.com/stenciljs/core/issues/6184)
* **internal:** fix references to old repository ([#6177](https://github.com/stenciljs/core/issues/6177)) ([2ae7446](https://github.com/stenciljs/core/commit/2ae7446545611b3b3e36c582f06db40c06d4e558))



## 🍸 [4.27.1](https://github.com/stenciljs/core/compare/v4.27.0...v4.27.1) (2025-02-25)


### Bug Fixes

* **docs:** update changelog with missing contribution ([8d596b0](https://github.com/stenciljs/core/commit/8d596b04cf145bb49614465c1e24a1a67bbdc5c3))
* **runtime:** mock querySelectorAll ([#6175](https://github.com/stenciljs/core/issues/6175)) ([7a3e150](https://github.com/stenciljs/core/commit/7a3e1502253f4b0fea2af5de96ac937f3933e97e))



# 🏔 [4.27.0](https://github.com/stenciljs/core/compare/v4.26.0...v4.27.0) (2025-02-22)


### Bug Fixes

* **hydrate:** support dash-case case in hydrate mode ([#6158](https://github.com/stenciljs/core/issues/6158)) ([30f2a09](https://github.com/stenciljs/core/commit/30f2a09b1d5c282d1c6d2a99e7f19219d26e179b)), closes [#6150](https://github.com/stenciljs/core/issues/6150)
* **runtime:** `scoped: true` slot fallback with forwarded slot ([#6171](https://github.com/stenciljs/core/issues/6171)) ([57e7e58](https://github.com/stenciljs/core/commit/57e7e5886d81ba3c3357683415cb592e1e72740d)), closes [#6170](https://github.com/stenciljs/core/issues/6170)
* **runtime:** always call component lifecycle hooks ([#6167](https://github.com/stenciljs/core/issues/6167)) ([260ced2](https://github.com/stenciljs/core/commit/260ced2bdc41e499110f7e6fd89b193166285093)), closes [#6165](https://github.com/stenciljs/core/issues/6165)
* **runtime:** append newChild if parent node doesn't match with patched node ([#6141](https://github.com/stenciljs/core/issues/6141)) ([eafe1f9](https://github.com/stenciljs/core/commit/eafe1f9d55f964d7f4927e18f4e3f7347e30a7f2)), closes [#6140](https://github.com/stenciljs/core/issues/6140)


### Features

* **runtime:** add `slotchange` event and `assignedNodes` / `assignedElements` methods for `scoped: true` slots ([#6151](https://github.com/stenciljs/core/issues/6151)) ([2a1038e](https://github.com/stenciljs/core/commit/2a1038e06440cf541534df9ae938bf74e0b37bb4))


### Refactor

* **runtime:** make WeakMap obsolete ([#6156](https://github.com/stenciljs/core/issues/6156))



# 🐇 [4.26.0](https://github.com/stenciljs/core/compare/v4.25.3...v4.26.0) (2025-02-11)


### Features

* **ssr:** shadow dom components can render as declarative-shadow-dom or as 'scoped' ([#6147](https://github.com/stenciljs/core/issues/6147)) ([26e4aa3](https://github.com/stenciljs/core/commit/26e4aa3221d293f294d56b050f29a244d3e44c8c))



## 🚁 [4.25.3](https://github.com/stenciljs/core/compare/v4.25.2...v4.25.3) (2025-02-04)


### Bug Fixes

* **runtime:** don't include loadModule logic in hydrate runtime ([#6145](https://github.com/stenciljs/core/issues/6145)) ([948b63a](https://github.com/stenciljs/core/commit/948b63af01498be9a6017b1bd8f67b952de756a5))


### Reverts

* Revert "Revert "fix(custom-elements): hydrate on client side (#5317)" (#6111)" (#6144) ([464c1a4](https://github.com/stenciljs/core/commit/464c1a48a3049d3e5d32b5fad29646e2ea0dcd53))



## 🐉 [4.25.2](https://github.com/stenciljs/core/compare/v4.25.1...v4.25.2) (2025-02-04)


### Bug Fixes

* **runtime:** clean deferredConnectedCallbacks array on disconnectedCallback ([#6142](https://github.com/stenciljs/core/issues/6142)) ([788dfd0](https://github.com/stenciljs/core/commit/788dfd0bea4a8b23027682a639ecfa7f029f33a1)), closes [#6119](https://github.com/stenciljs/core/issues/6119)
* **runtime:** don't flag html tag with hydrate flag anymore ([#6103](https://github.com/stenciljs/core/issues/6103)) ([0691295](https://github.com/stenciljs/core/commit/0691295ce94746100bb1d3d17b10caf38f85979c)), closes [#6091](https://github.com/stenciljs/core/issues/6091)
* **ssr:** correctly resolve slots during hydration ([#6131](https://github.com/stenciljs/core/issues/6131)) ([8853790](https://github.com/stenciljs/core/commit/885379071f64b9ba073c68612d883fe341fa47e2)), closes [#6130](https://github.com/stenciljs/core/issues/6130)
* **ssr:** exponential perf slow down ([#6128](https://github.com/stenciljs/core/issues/6128)) ([c1e6838](https://github.com/stenciljs/core/commit/c1e68382529c92328d63f8fdea2632302ffe000c)), closes [#6127](https://github.com/stenciljs/core/issues/6127)
* **ssr:** multiple component instances sharing initial properties ([#6126](https://github.com/stenciljs/core/issues/6126)) ([f7ecec3](https://github.com/stenciljs/core/commit/f7ecec340dddaf61a287371e0f153c86fc39dc0e)), closes [#6125](https://github.com/stenciljs/core/issues/6125)
* **ssr:** stop stripping comment nodes  ([#6123](https://github.com/stenciljs/core/issues/6123)) ([5a7ab24](https://github.com/stenciljs/core/commit/5a7ab241cbdfdb40de427297d513c24b67c40565)), closes [#6120](https://github.com/stenciljs/core/issues/6120)



## 🌳 [4.25.1](https://github.com/stenciljs/core/compare/v4.25.0...v4.25.1) (2025-01-25)


### Bug Fixes

* **dist-custom-elements:** stop duplicate `@stencil/core` ([#6109](https://github.com/stenciljs/core/issues/6109)) ([dc4c88f](https://github.com/stenciljs/core/commit/dc4c88f998de33c53fb94b73bffb913adf953cf3)), closes [#6040](https://github.com/stenciljs/core/issues/6040), closes [#4135](https://github.com/stenciljs/core/issues/4135)
* **runtime:** allow classList to be null ([#6118](https://github.com/stenciljs/core/issues/6118)) ([749fab9](https://github.com/stenciljs/core/commit/749fab9636d70429f67e61af92f4d932bf475ea5)), closes [#6117](https://github.com/stenciljs/core/issues/6117)
* **runtime:** fix NotFoundError in addStyle function with referenceNode parent check ([#6107](https://github.com/stenciljs/core/issues/6107)) ([26ceed6](https://github.com/stenciljs/core/commit/26ceed69570761ed17c66e4bc38ff9d88ebe819c)), closes [#6106](https://github.com/stenciljs/core/issues/6106)
* **runtime:** SSR class handling breaks normal class handling ([#6116](https://github.com/stenciljs/core/issues/6116)) ([1e8a2d2](https://github.com/stenciljs/core/commit/1e8a2d228810d92e3b2b6b271d547087df911ce7)), closes [#6114](https://github.com/stenciljs/core/issues/6114), closes [#6115](https://github.com/stenciljs/core/issues/6115)

#### Thanks

🎉# Thanks for @johnjenkins for their contributions! 🎉


# 🏅 [4.25.0](https://github.com/stenciljs/core/compare/v4.24.0...v4.25.0) (2025-01-23)


### Bug Fixes

* **SSR:** class prop / state reactivity for target es2022 ([#6099](https://github.com/stenciljs/core/issues/6099)) ([07dcfa8](https://github.com/stenciljs/core/commit/07dcfa84e223820046fef2e0eab91c313f26fa81)), closes [#6095](https://github.com/stenciljs/core/issues/6095)
* **test:** stop re-running prototype augment in spec tests. ([#6105](https://github.com/stenciljs/core/issues/6105)) ([a7d3873](https://github.com/stenciljs/core/commit/a7d38735a8572303fa2ea7e154e9a9dc3bf7eecb)), closes [#6104](https://github.com/stenciljs/core/issues/6104)


### Features

* **mock-doc:** `assignednodes` and `assignedElements` ([#6108](https://github.com/stenciljs/core/issues/6108)) ([777aafd](https://github.com/stenciljs/core/commit/777aafd57b6b03dc972e0f0bada648bf8af1f42f))
* **runtime:** Add element to component error handler. Enables error boundaries ([#2979](https://github.com/stenciljs/core/issues/2979)) ([5605d48](https://github.com/stenciljs/core/commit/5605d48d1c9f42279ab3442b625007edcd7a9e3f))


### Reverts

* Revert "fix(custom-elements): hydrate on client side (#5317)" (#6111) ([375fa8b](https://github.com/stenciljs/core/commit/375fa8b8a9bac61afbef5dfd69f4e641bae45533))



# 🚜 [4.24.0](https://github.com/stenciljs/core/compare/v4.23.2...v4.24.0) (2025-01-17)


### Bug Fixes

* **runtime:** clean up ancestor nodes on resolve ([#6094](https://github.com/stenciljs/core/issues/6094)) ([2503dc5](https://github.com/stenciljs/core/commit/2503dc5293479f2fc161cdaee61846dffb4dcea6))
* **testing:** update puppeteer, default to 'new' headless ([#6098](https://github.com/stenciljs/core/issues/6098)) ([6537869](https://github.com/stenciljs/core/commit/6537869f917449c59e88b8bf57f3dcfdf0f2d077))


### Features

* **runtime:** `@Prop` / `@State` now work with runtime decorators ([#6084](https://github.com/stenciljs/core/issues/6084)) ([82fc857](https://github.com/stenciljs/core/commit/82fc857518883cc75b265f2381e36777e8047840))
* **slot-polyfill:** patch insertBefore & slotted node parentNode ([#6096](https://github.com/stenciljs/core/issues/6096)) ([efb40d5](https://github.com/stenciljs/core/commit/efb40d598d3c5e5d4ae58780e03ea0ae9816b211)), closes [#6043](https://github.com/stenciljs/core/issues/6043)

#### Thanks

🎉# Thanks for @johnjenkins for their contributions! 🎉


## 🌮 [4.23.2](https://github.com/stenciljs/core/compare/v4.23.1...v4.23.2) (2025-01-10)


### Bug Fixes

* **runtime:** clear up rootAppliedStyles ([#6087](https://github.com/stenciljs/core/issues/6087)) ([c4a9c9e](https://github.com/stenciljs/core/commit/c4a9c9e7bd168d6e0e6b6d83ad338c0179c1e731)), refs [@ionic-team/ionic-framework#28189](https://github.com/ionic-team/ionic-framework/issues/28189), closes [#5181](https://github.com/stenciljs/core/issues/5181), closes [#5172](https://github.com/stenciljs/core/issues/5172), closes [#3607](https://github.com/stenciljs/core/issues/3607), closes [#3158](https://github.com/stenciljs/core/issues/3158)



## 🌯 [4.23.1](https://github.com/stenciljs/core/compare/v4.23.0...v4.23.1) (2025-01-06)


### Bug Fixes

* correctly handle svg class attribute within `parseClassList` ([#6085](https://github.com/stenciljs/core/issues/6085)) ([5d29255](https://github.com/stenciljs/core/commit/5d2925593410fc53ef2fc989c3d33ceb4cf9b503))
* **mock-doc:** don't force template tags to have a shadowroot ([#6078](https://github.com/stenciljs/core/issues/6078)) ([b63039f](https://github.com/stenciljs/core/commit/b63039f10c2c4e01114e2d11bc29b60ba1e486d9))
* runtime decorators ([#6076](https://github.com/stenciljs/core/issues/6076)) ([9e6483a](https://github.com/stenciljs/core/commit/9e6483a3f41718c46f13cdc1528c8138110688d0)), closes [#3831](https://github.com/stenciljs/core/issues/3831)
* **scoped:** fixes for `<slot />` and slotted nodes ([#6082](https://github.com/stenciljs/core/issues/6082)) ([13ee704](https://github.com/stenciljs/core/commit/13ee7049d3e30ee17135965ad7e2c6172e637c09)), closes [#6080](https://github.com/stenciljs/core/issues/6080), [#6081](https://github.com/stenciljs/core/issues/6081) and [#6088](https://github.com/stenciljs/core/issues/6088)
* **SSR:** patch `scoped: true` SSR-ed, slotted nodes next/prev sibling accessors ([#6057](https://github.com/stenciljs/core/issues/6057)) ([af102ce](https://github.com/stenciljs/core/commit/af102ce8c7faaf1f999c09faefb4aeb55145dade)), closes [#6056](https://github.com/stenciljs/core/issues/6056)



# 🐣 [4.23.0](https://github.com/stenciljs/core/compare/v4.22.3...v4.23.0) (2024-12-11)


### Bug Fixes

* `patchChildSlotNodes` & `scopedSlotTextContentFix` not being applied ([#6055](https://github.com/stenciljs/core/issues/6055)) ([a15bc5d](https://github.com/stenciljs/core/commit/a15bc5da60fb579aa80a38369d5464db17c40c38)), closes [#6054](https://github.com/stenciljs/core/issues/6054)
* Change hasHostListenerAttached from var to protoype property ([#6074](https://github.com/stenciljs/core/issues/6074)) ([ee4aa0b](https://github.com/stenciljs/core/commit/ee4aa0b4bcc2162d7745f188b8e754cb5d7abda2)), closes [#6066](https://github.com/stenciljs/core/issues/6066)
* **mock-doc:** don't show error message for SSR workflows ([#6075](https://github.com/stenciljs/core/issues/6075)) ([84a3607](https://github.com/stenciljs/core/commit/84a36072dbda4591105ec2bab1e3ac79d38c47ad)), closes [#6073](https://github.com/stenciljs/core/issues/6073)
* rewrite SSR client-side hydration ([#6067](https://github.com/stenciljs/core/issues/6067)) ([ec243c2](https://github.com/stenciljs/core/commit/ec243c250c6b8f6fc25835ec2db3c7f157c84947)), closes [#6065](https://github.com/stenciljs/core/issues/6065), [#6064](https://github.com/stenciljs/core/issues/6064), [#6063](https://github.com/stenciljs/core/issues/6063), [#5198](https://github.com/stenciljs/core/issues/5198)
* **runtime:** ensure Node is defined ([#6061](https://github.com/stenciljs/core/issues/6061)) ([1f5a13f](https://github.com/stenciljs/core/commit/1f5a13f07a138e27d9b937c03999837b30e8afc0)), closes [stenciljs/output-targets#537](https://github.com/stenciljs/output-targets/issues/537)
* stop 'experimentalScopedSlotChanges' warning msg on startup ([#6068](https://github.com/stenciljs/core/issues/6068)) ([d362700](https://github.com/stenciljs/core/commit/d362700ab85c0fc33c4df5d4e0431d1209ac0548)), closes [#6054](https://github.com/stenciljs/core/issues/6054)


### Features

* prop get set new ([#6050](https://github.com/stenciljs/core/issues/6050)) ([7ecb599](https://github.com/stenciljs/core/commit/7ecb59993481a2f522916a9d504c5a4738c3f545))



## 🐤 [4.22.3](https://github.com/stenciljs/core/compare/v4.22.2...v4.22.3) (2024-11-21)


### Bug Fixes

* correctly call proxied formAssociated callbacks ([#6046](https://github.com/stenciljs/core/issues/6046)) ([dffb49d](https://github.com/stenciljs/core/commit/dffb49d5af9f8d4dc8187120214f08cac4d2efa7)), closes [#6038](https://github.com/stenciljs/core/issues/6038)
* **mock-doc:** return empty string if anchor has no href attribute ([#6051](https://github.com/stenciljs/core/issues/6051)) ([e44642f](https://github.com/stenciljs/core/commit/e44642f4e473977e89bfab201dcfe712989f8d02)), closes [#6047](https://github.com/stenciljs/core/issues/6047)
* **runtime:** ensure event listener are not registered twice ([#6052](https://github.com/stenciljs/core/issues/6052)) ([8f1bc55](https://github.com/stenciljs/core/commit/8f1bc5501ffc7effb17c2acd863a7b39243fdb6c)), closes [#6045](https://github.com/stenciljs/core/issues/6045)
* **runtime:** scope id fix for component children for typescript issue ([#6041](https://github.com/stenciljs/core/issues/6041)) ([ab4cfce](https://github.com/stenciljs/core/commit/ab4cfce43fafff3f7302fff4e4c952489c245804)), closes [#6042](https://github.com/stenciljs/core/issues/6042)



## 🎺 [4.22.2](https://github.com/stenciljs/core/compare/v4.22.1...v4.22.2) (2024-10-25)


### Bug Fixes

* **docs:** escape backticks in type or default value columns ([#6025](https://github.com/stenciljs/core/issues/6025)) ([009d370](https://github.com/stenciljs/core/commit/009d370c4e9968664a563d2ab42a151cd49ded96)), closes [#6024](https://github.com/stenciljs/core/issues/6024)
* **types:** add controlslist to html declarations ([#6026](https://github.com/stenciljs/core/issues/6026)) ([f4b48e9](https://github.com/stenciljs/core/commit/f4b48e9c058e7d9e694560ace519a2f2bf656ff5)), closes [#6015](https://github.com/stenciljs/core/issues/6015)
* **runtime:** make shadow root adopt scoped component styles ([#6028](https://github.com/stenciljs/core/issues/6028)) ([8ff3048](https://github.com/stenciljs/core/commit/8ff3048e28209af08f8dbe0142443deff19ceee2)), closes [#6027](https://github.com/stenciljs/core/issues/6027)



## 🌪 [4.22.1](https://github.com/stenciljs/core/compare/v4.22.0...v4.22.1) (2024-10-09)


### Bug Fixes

* **mock-doc:** add missing ShadowRoot window primitive ([#6011](https://github.com/stenciljs/core/issues/6011)) ([2f944e2](https://github.com/stenciljs/core/commit/2f944e23664e191990424d0dc0fe953f67229373))
* **mock-doc:** get native primitive from globalThis ([#6021](https://github.com/stenciljs/core/issues/6021)) ([72fabd1](https://github.com/stenciljs/core/commit/72fabd14cc4934609e2fb8d462807b7445985ae9))
* **runtime:** create unique host ids ([#6018](https://github.com/stenciljs/core/issues/6018)) ([1564b7a](https://github.com/stenciljs/core/commit/1564b7a6ad5a8b96c60ee3dc67fd4ee516176e04))
* **runtime:** merge styles within ShadowRoot into a single node ([#6014](https://github.com/stenciljs/core/issues/6014)) ([61f90b0](https://github.com/stenciljs/core/commit/61f90b04ecf8896d74840ea295f949f3de38676c))



# 🍲 [4.22.0](https://github.com/stenciljs/core/compare/v4.21.0...v4.22.0) (2024-10-03)


### Bug Fixes

* **compiler:** add reserved keyword ([#6001](https://github.com/stenciljs/core/issues/6001)) ([7ede77a](https://github.com/stenciljs/core/commit/7ede77a873486b5cf47f0b26571f852675f67dd6)), closes [#6000](https://github.com/stenciljs/core/issues/6000)
* **compiler:** handle file rename in watch mode ([#5971](https://github.com/stenciljs/core/issues/5971)) ([8f0a882](https://github.com/stenciljs/core/commit/8f0a8823facade0be6eabf8569831f456497c2a0)), closes [#3443](https://github.com/stenciljs/core/issues/3443)
* **compiler:** no generate custom output ([#5951](https://github.com/stenciljs/core/issues/5951)) ([5cddfd9](https://github.com/stenciljs/core/commit/5cddfd91a37c7405a9abef897e67eed6be089412)), closes [#5950](https://github.com/stenciljs/core/issues/5950) - fixes [#5950](https://github.com/stenciljs/core/issues/5950)
* **declarations:** add missing event handler types ([#5964](https://github.com/stenciljs/core/issues/5964)) ([6ef1334](https://github.com/stenciljs/core/commit/6ef1334ee2709d1de730f7512e77e18640179bc9)) - closes [#5963](https://github.com/stenciljs/core/issues/5963)
* **hydrate:** Add missing alias to hydrate build to fix app globals ([#6005](https://github.com/stenciljs/core/issues/6005)) ([c5a8ea9](https://github.com/stenciljs/core/commit/c5a8ea9851856b3262f9f8448d85ac638f4b393b)) - closes [#6002](https://github.com/stenciljs/core/issues/6002)
* **mock-doc:** avoid double hydration of components ([#6003](https://github.com/stenciljs/core/issues/6003)) ([dbc2f58](https://github.com/stenciljs/core/commit/dbc2f58944ec53b4df26a21c768aa106710c8404))
* **mock-doc:** provide mock for resize observer ([#6007](https://github.com/stenciljs/core/issues/6007)) ([6d6a65e](https://github.com/stenciljs/core/commit/6d6a65e21b9436d17b26d14e1d206473a1ffa851))
* **runtime:** ensure referenceNode is child node of styleContainerNode ([#5994](https://github.com/stenciljs/core/issues/5994)) ([a02bc36](https://github.com/stenciljs/core/commit/a02bc3606f2e10331ff9aaa12618dbee271d86fa)) - closes [#5993](https://github.com/stenciljs/core/issues/5993)
* **runtime:** scoped slot append/prepend correct order after interaction ([#5970](https://github.com/stenciljs/core/issues/5970)) ([2569abd](https://github.com/stenciljs/core/commit/2569abdcdd420b77f1035af154db174c6a9a1601)) - closes [#5969](https://github.com/stenciljs/core/issues/5969)
* **scripts:** fix Esbuild scripts to allow to run on Windows ([#5930](https://github.com/stenciljs/core/issues/5930)) ([8ad326c](https://github.com/stenciljs/core/commit/8ad326c2ca811cb20bd78b1edd849816c13f6692))


### Features

* **compiler:** customize readme mermaid diagram colors ([#5980](https://github.com/stenciljs/core/issues/5980)) ([9ca8951](https://github.com/stenciljs/core/commit/9ca8951d529efb4926467775f939c305ac07874b)), closes [#2876](https://github.com/stenciljs/core/issues/2876) [#2876](https://github.com/stenciljs/core/issues/2876)
* **typescript:** Update to 5.5.4 ([#5959](https://github.com/stenciljs/core/issues/5959)) ([ce153a0](https://github.com/stenciljs/core/commit/ce153a0297b8fb0de730fd3cc46b33b559697ccf))
* **hydrate:** support style modes in hydrate modules ([#5953](https://github.com/stenciljs/core/issues/5953)) ([15f3b26](https://github.com/stenciljs/core/commit/15f3b26bf8fb49933c2d3a26072b6d1b5672873b))


# 🐷 [4.21.0](https://github.com/stenciljs/core/compare/v4.20.0...v4.21.0) (2024-08-26)


### Bug Fixes

* **compiler:** default `asyncLoading` build conditional to `true` ([#5941](https://github.com/stenciljs/core/issues/5941)) ([0e261d6](https://github.com/stenciljs/core/commit/0e261d653b03fd55a975f4e56e2fae258c3dcd88)), closes [#3580](https://github.com/stenciljs/core/issues/3580)
* **compiler:** prefer `localName` over `originalName` by running an empty check on `originalName` ([#5943](https://github.com/stenciljs/core/issues/5943)) ([0f42656](https://github.com/stenciljs/core/commit/0f42656f00a84be52e1c2497159c27cbfb0fba2a)), closes [#5882](https://github.com/stenciljs/core/issues/5882)
* **compiler:** verify parent node when validating component members ([#5942](https://github.com/stenciljs/core/issues/5942)) ([37a0aaf](https://github.com/stenciljs/core/commit/37a0aaf176db2ad620fad18a3ddc1e64764c237c)), closes [#5940](https://github.com/stenciljs/core/issues/5940)
* **runtime:** have fallback for style setting ([#5948](https://github.com/stenciljs/core/issues/5948)) ([ae19d7a](https://github.com/stenciljs/core/commit/ae19d7ad736ee1ae4989a4d0ed08a607ea208b78))
* **runtime:** only use setter if existing ([#5947](https://github.com/stenciljs/core/issues/5947)) ([7e9fa60](https://github.com/stenciljs/core/commit/7e9fa60d7692e630134618f1186386c0cc0b3a29)), closes [#2703](https://github.com/stenciljs/core/issues/2703)
* **runtime:** place scoped component styles after preconnect links but before custom styles ([#5938](https://github.com/stenciljs/core/issues/5938)) ([8f92b11](https://github.com/stenciljs/core/commit/8f92b11c1940b86b460c2f3a574208b88e1bbecd))
* **runtime:** provide second arg to `insertBefore` ([#5933](https://github.com/stenciljs/core/issues/5933)) ([afcc9a5](https://github.com/stenciljs/core/commit/afcc9a5ee7fba408c1be3f9ed594dcddae3fdb7b))
* **runtime:** render component styles at the end of the head tag ([#5926](https://github.com/stenciljs/core/issues/5926)) ([90da726](https://github.com/stenciljs/core/commit/90da726789be4d26c35ad86cb1441ad7f440dce6)), closes [#5915](https://github.com/stenciljs/core/issues/5915)
* **runtime:** update call to `prepend` to remove `null` node ([#5946](https://github.com/stenciljs/core/issues/5946)) ([970c5d2](https://github.com/stenciljs/core/commit/970c5d25fba3b82df262a154980cc0f25fdd315c))
* **typescript:** fix documentation on 'serializeShadowRoot' flag ([#5927](https://github.com/stenciljs/core/issues/5927)) ([277e3e3](https://github.com/stenciljs/core/commit/277e3e35730e37b028d2f2ed32960d5f947d7dd4)), closes [#5914](https://github.com/stenciljs/core/issues/5914)


### Features

* **compiler:** allow ignore pattern for copy task ([#5899](https://github.com/stenciljs/core/issues/5899)) ([f89c6a3](https://github.com/stenciljs/core/commit/f89c6a356bdcd78fc6427d3cb75776d749196eea)), closes [#5781](https://github.com/stenciljs/core/issues/5781)



## 🚐 [4.20.0](https://github.com/stenciljs/core/compare/v4.19.2...v4.20.0) (2024-08-02)


### Bug Fixes

* **core:** add @stencil/core/testing/jest-preset to export map ([#5900](https://github.com/stenciljs/core/issues/5900)) ([3def2b7](https://github.com/stenciljs/core/commit/3def2b7e160c4f60318125fd6d0f22da35bc905a)), fixes [#5896](https://github.com/stenciljs/core/issues/5896)
* **compiler:** don't allow shadowRoot getter to avoid hydration issues ([#5912](https://github.com/stenciljs/core/issues/5912)) ([5dd4f7f](https://github.com/stenciljs/core/commit/5dd4f7fb051c0bfd67f38fb32d61776993db2510))
* **compiler:** no need for commenting selectors anymore ([#5892](https://github.com/stenciljs/core/issues/5892)) ([d571bbb](https://github.com/stenciljs/core/commit/d571bbbb68f361cd046c0ced724e2c4554aaa06b)), fixes [#5880](https://github.com/stenciljs/core/issues/5880)
* **compiler:** respect project tsconfig watch options ([#5916](https://github.com/stenciljs/core/issues/5916)) ([74adeee](https://github.com/stenciljs/core/commit/74adeee75a6cdb290ab6127fb94281c7582e3b46)), closes [#5709](https://github.com/stenciljs/core/issues/5709), fixes [#5709](https://github.com/stenciljs/core/issues/5709), fixes [#5592](https://github.com/stenciljs/core/issues/5592)
* **compiler:** run copy task after other output targets ([#5902](https://github.com/stenciljs/core/issues/5902)) ([c3d4e8b](https://github.com/stenciljs/core/commit/c3d4e8b170b405ef420236f12d7b19e21e541a81)), fixes [#5592](https://github.com/stenciljs/core/issues/5592)
* **core:** add missing screenshot export ([#5909](https://github.com/stenciljs/core/issues/5909)) ([764a8ba](https://github.com/stenciljs/core/commit/764a8bafdefb5653d958a4573f23f8f8af317a73)), fixes [#5906](https://github.com/stenciljs/core/issues/5906)
* **hydrate:** ensure beforeHydrateFn and afterHydrateFn always return a function ([#5890](https://github.com/stenciljs/core/issues/5890)) ([a7c212c](https://github.com/stenciljs/core/commit/a7c212c2a9deeb8cea738e334bf37b68322ada66)), fixes [#5884](https://github.com/stenciljs/core/issues/5884)
* **runtime:** hydrate shadow dom first ([#5911](https://github.com/stenciljs/core/issues/5911)) ([ccf1a89](https://github.com/stenciljs/core/commit/ccf1a8941f732cb53d57785ecbe03388e744a1cd))
* **runtime:** make isSameVnode return false on initial render in a hydration case ([#5891](https://github.com/stenciljs/core/issues/5891)) ([82a7bb9](https://github.com/stenciljs/core/commit/82a7bb9ead3dc637b646db09b6687a8d0c2735a2))
* **testing:** update Jest types ([#5910](https://github.com/stenciljs/core/issues/5910)) ([5f8c969](https://github.com/stenciljs/core/commit/5f8c9692d41b58d3706c61db9a33215294e70049)), fixes [#5908](https://github.com/stenciljs/core/issues/5908)
* **core:** update TypeScript to v5.5 ([#5898](https://github.com/stenciljs/core/issues/5898)) ([5e74837](https://github.com/stenciljs/core/commit/5e748378fd14fa5c6aaf0e001e8763a0ba3cf57c))

### Note

As we’ve made further enhancements to support declarative Shadow DOM, the Stencil team has determined that it’s not feasible to allow users to render a shadow component as a scoped component after compilation, such as by calling `renderToString` with `serializeShadowRoot: false`. This is because Stencil compiles styles for either shadow or scoped mode during the compilation process, embedding these styles into the hydrate module. Once this compilation is complete, the styles cannot be transformed to support the other mode. Recognizing that this change would impact the current functionality, the Stencil team has decided to proceed with this update. Moving forward, we recommend serializing all components marked with shadow: true as declarative Shadow DOM.


## 🏉 [4.19.2](https://github.com/stenciljs/core/compare/v4.19.1...v4.19.2) (2024-07-02)


### Bug Fixes

* **hydrate:** partially revert [#5838](https://github.com/stenciljs/core/issues/5838) ([#5876](https://github.com/stenciljs/core/issues/5876)) ([dfbc340](https://github.com/stenciljs/core/commit/dfbc34007a818eef418e2f312a9dd7a0fef81af6))
* **hydrate:** support server side rendering of components with listener ([#5877](https://github.com/stenciljs/core/issues/5877)) ([2c5b7f8](https://github.com/stenciljs/core/commit/2c5b7f8ecb9e999e3c584b3a1af5a317f035ae4d)), fixes [#5869](https://github.com/stenciljs/core/issues/5869)
* **testing:** add testing sub module to export map ([#5873](https://github.com/stenciljs/core/issues/5873)) ([bb2e04f](https://github.com/stenciljs/core/commit/bb2e04f488280f12c2db91510d4bb2171e4493e1)), fixes [#5871](https://github.com/stenciljs/core/issues/5871) and [#5868](https://github.com/stenciljs/core/issues/5868)



## 🍈 [4.19.1](https://github.com/stenciljs/core/compare/v4.19.0...v4.19.1) (2024-06-27)


### Bug Fixes

* **compiler:** account for package imports in aliasing ([#5862](https://github.com/stenciljs/core/issues/5862)) ([02b41d3](https://github.com/stenciljs/core/commit/02b41d3e64dfb7a2960ad32968e991fef159c137)), fixes [#5859](https://github.com/stenciljs/core/issues/5859) 
* **compiler:** try to create web worker with the workerPath before falling back to blob ([#3513](https://github.com/stenciljs/core/issues/3513)) ([c84dd32](https://github.com/stenciljs/core/commit/c84dd32499e8d0f092579e1c0317537a4ae341ac)), fixes [#3512](https://github.com/stenciljs/core/issues/3512)
* **hydrate:** change type resolve order ([#5863](https://github.com/stenciljs/core/issues/5863)) ([42b1ff2](https://github.com/stenciljs/core/commit/42b1ff23405cf27670b335e3b95d9dceb65578ae))
* **internal:** add cli sub package to export map ([ad95222](https://github.com/stenciljs/core/commit/ad95222bbd7a6421ac518cce24f3fd59102d4774))
* **internal:** add mock-doc export in client runtime package.json ([ad95222](https://github.com/stenciljs/core/commit/4ff9011b9d07fba3f7deeb5f5f71cf5fd2d41397))



# 🏄 [4.19.0](https://github.com/stenciljs/core/compare/v4.18.3...v4.19.0) (2024-06-26)


### Bug Fixes

* **compiler:** support rollup's external input option ([#3227](https://github.com/stenciljs/core/issues/3227)) ([2c68849](https://github.com/stenciljs/core/commit/2c6884970baf9f01f36d0843ce4ad59745e5a1f0)), fixes [#3226](https://github.com/stenciljs/core/issues/3226)
* **emit:** don't emit test files ([#5789](https://github.com/stenciljs/core/issues/5789)) ([50892f1](https://github.com/stenciljs/core/commit/50892f153c4c95e2728ecc460c87582fcd763a1e)), fixes [#5788](https://github.com/stenciljs/core/issues/5788)
* **hydrate:** support vdom annotation in nested dsd structures ([#5856](https://github.com/stenciljs/core/issues/5856)) ([61bb5e3](https://github.com/stenciljs/core/commit/61bb5e3a080c011fb3242c0428cad9238b43149d))
* label attribute not toggling input ([#3474](https://github.com/stenciljs/core/issues/3474)) ([13db920](https://github.com/stenciljs/core/commit/13db92075b8dec53f5226761cec5ace5edb73d0c)), fixes [#3473](https://github.com/stenciljs/core/issues/3473)
* **mock-doc:** expose ShadowRoot and DocumentFragment globals ([#5827](https://github.com/stenciljs/core/issues/5827)) ([98bbd7c](https://github.com/stenciljs/core/commit/98bbd7c0d6fb67f085aa9ce0c3013e942c882be2)), fixes [#3260](https://github.com/stenciljs/core/issues/3260)
* **runtime:** allow watchers to fire w/ no Stencil members ([#5855](https://github.com/stenciljs/core/issues/5855)) ([850ad4f](https://github.com/stenciljs/core/commit/850ad4f4dd7c2349109be987af1e6f5df8c39608)), fixes [#5854](https://github.com/stenciljs/core/issues/5854)
* **runtime:** catch errors in async lifecycle methods ([#5826](https://github.com/stenciljs/core/issues/5826)) ([87e5b33](https://github.com/stenciljs/core/commit/87e5b33a3b2c7d65803394d8209449de2e85a0a4)), fixes [#5824](https://github.com/stenciljs/core/issues/5824)
* **runtime:** don't register listener before connected to DOM ([#5844](https://github.com/stenciljs/core/issues/5844)) ([9d7021f](https://github.com/stenciljs/core/commit/9d7021feab38fa03a8cbc0d489350786381d235c)), fixes [#4067](https://github.com/stenciljs/core/issues/4067)
* **runtime:** properly assign style declarations ([#5838](https://github.com/stenciljs/core/issues/5838)) ([5c10ebf](https://github.com/stenciljs/core/commit/5c10ebfd090d904409be6addc8a5e907b2e91ed0))
* **testing:** allow to re-use pages across it blocks ([#5830](https://github.com/stenciljs/core/issues/5830)) ([561eab4](https://github.com/stenciljs/core/commit/561eab4af68c4b24f349f0791085e191c0f8a69c)), fixes [#3720](https://github.com/stenciljs/core/issues/3720)
* **typescript:** remove unsupported label property ([#5840](https://github.com/stenciljs/core/issues/5840)) ([d26ea2b](https://github.com/stenciljs/core/commit/d26ea2b7490db64e4e6cd1af8eccfe48c63c5122)), fixes [#3473](https://github.com/stenciljs/core/issues/3473)


### Features

* **cli:** support generation of sass and less files ([#5857](https://github.com/stenciljs/core/issues/5857)) ([1883812](https://github.com/stenciljs/core/commit/18838123f11f7277d82c8045ff41859d3c14e025)), closes [#2155](https://github.com/stenciljs/core/issues/2155)
* **compiler:** generate export maps on build ([#5809](https://github.com/stenciljs/core/issues/5809)) ([b6d2404](https://github.com/stenciljs/core/commit/b6d24043bd518a7ddaf28f5da65730dd8669303d))
* **complier:** support type import aliasing ([#5836](https://github.com/stenciljs/core/issues/5836)) ([7ffb25d](https://github.com/stenciljs/core/commit/7ffb25d259de5b863e7dc3bc43270265cc786557)), closes [#2335](https://github.com/stenciljs/core/issues/2335)
* **runtime:** support declarative shadow DOM ([#5792](https://github.com/stenciljs/core/issues/5792)) ([c837063](https://github.com/stenciljs/core/commit/c83706362819eb44d43cba66851f9ea81f27d3bd)), closes [#4010](https://github.com/stenciljs/core/issues/4010)
* **testing:** add `toHaveLastReceivedEventDetail` event spy matcher ([#5829](https://github.com/stenciljs/core/issues/5829)) ([63491de](https://github.com/stenciljs/core/commit/63491de1e6ae18a5c6bdaa07e20629b6c765b677)), closes [#2488](https://github.com/stenciljs/core/issues/2488)
* **testing:** allow to disable network error logging via 'logFailingNetworkRequests' option ([#5839](https://github.com/stenciljs/core/issues/5839)) ([dac3e33](https://github.com/stenciljs/core/commit/dac3e33e14bec08b8c38190642761b286fe92168)), closes [#2572](https://github.com/stenciljs/core/issues/2572)
* **testing:** expose captureBeyondViewport in pageCompareScreenshot ([#5828](https://github.com/stenciljs/core/issues/5828)) ([cf6a450](https://github.com/stenciljs/core/commit/cf6a4503b3f211802eb11960029d2c49dd8af6c7)), closes [#3188](https://github.com/stenciljs/core/issues/3188)



## 😄 [4.18.3](https://github.com/stenciljs/core/compare/v4.18.2...v4.18.3) (2024-05-28)


### Bug Fixes

* **esbuild:** remove all `node:` imports from glob script to keep support for Jest v26 ([#5784](https://github.com/stenciljs/core/issues/5784)) ([5f4fcfa](https://github.com/stenciljs/core/commit/5f4fcfa12e701ece8884aa1e3b3143bd2221e0a0)), fixes [#5766](https://github.com/stenciljs/core/issues/5766)
* **mock-doc:** support toDataURL method in canvas ([#5773](https://github.com/stenciljs/core/issues/5773)) ([3830dad](https://github.com/stenciljs/core/commit/3830dad7c8bd78de2c59c087a291e3d954d70508)), closes [#2923](https://github.com/stenciljs/core/issues/2923)
* **runtime:** add missing intermediate parents scope ids to the elements ([#5775](https://github.com/stenciljs/core/issues/5775)) ([56c60d4](https://github.com/stenciljs/core/commit/56c60d4af1227fb82abf9bb838abfc4f439bd32d)), fixes [#5774](https://github.com/stenciljs/core/issues/5774)



## ⛲️ [4.18.2](https://github.com/stenciljs/core/compare/v4.18.1...v4.18.2) (2024-05-20)


### Bug Fixes

* **e2e:** allow to fetch CSS variables assigned to host elements ([#5682](https://github.com/stenciljs/core/issues/5682)) ([e420eb6](https://github.com/stenciljs/core/commit/e420eb69ed8121a0b3e552ee331dffb5759cee32)), closes [#5681](https://github.com/stenciljs/core/issues/5681)
* **hydrate:** respect `HydratedFlag` configuration in hydrate script ([#5741](https://github.com/stenciljs/core/issues/5741)) ([3538d06](https://github.com/stenciljs/core/commit/3538d06bdc4e1193c0032a228fa7571c0554e4df)), closes [#3606](https://github.com/stenciljs/core/issues/3606)
* **runtime:** always throw if component can not be loaded ([#5762](https://github.com/stenciljs/core/issues/5762)) ([1d52b95](https://github.com/stenciljs/core/commit/1d52b9500e5b42b12e2ce24985bef4da34dd4e05)), closes [#5759](https://github.com/stenciljs/core/issues/5759)
* **runtime:** support watch for components with custom tag names ([#5767](https://github.com/stenciljs/core/issues/5767)) ([f561e0f](https://github.com/stenciljs/core/commit/f561e0fdc323b6491c54badb83da4237f896d960)), closes [#3554](https://github.com/stenciljs/core/issues/3554)
* **runtime:** throw proper error if component is loaded with invalid runtime ([#5675](https://github.com/stenciljs/core/issues/5675)) ([3cfbb8d](https://github.com/stenciljs/core/commit/3cfbb8d7be940f7db952d21510b1128679ec42a2)), closes [#5596](https://github.com/stenciljs/core/issues/5596)
* **types:** move autofocus attr/prop definition to HTMLAttributes ([#5727](https://github.com/stenciljs/core/issues/5727)) ([3a33eff](https://github.com/stenciljs/core/commit/3a33eff4c810c5f87dee18634fb6e7b7f19e2eb6)), closes [#5726](https://github.com/stenciljs/core/issues/5726)



## 🏍 [4.18.1](https://github.com/stenciljs/core/compare/v4.18.0...v4.18.1) (2024-05-13)


### Bug Fixes

* **build:** do not copy polyfills to the `dist` OT unless building es5 ([#5725](https://github.com/stenciljs/core/issues/5725)) ([945df46](https://github.com/stenciljs/core/commit/945df46b72ec52bf348f10cb9bf58f337b11de7c)), closes [#5416](https://github.com/stenciljs/core/issues/5416)
* **compiler:** Allow OutputTargetCustom to be called on devMode ([#5541](https://github.com/stenciljs/core/issues/5541)) ([b0a9f7b](https://github.com/stenciljs/core/commit/b0a9f7b559b2a8efd21674609f35f6a09c430f01)), closes [#5514](https://github.com/stenciljs/core/issues/5514)
* **compiler:** deprecate `scriptDataOpts` ([#5737](https://github.com/stenciljs/core/issues/5737)) ([da25aaa](https://github.com/stenciljs/core/commit/da25aaa4f37df0fcedfc67a5dc063a60769fe2c1))
* **declarations:** Attribute ping is missing on AnchorHTMLAttributes ([#5752](https://github.com/stenciljs/core/issues/5752)) ([d345412](https://github.com/stenciljs/core/commit/d345412302a05323a4f8922aa7388fd67a4e4944)), closes [#5751](https://github.com/stenciljs/core/issues/5751)
* **runtime:** add root scope id to the user provided nested children as classname ([#5750](https://github.com/stenciljs/core/issues/5750)) ([e864132](https://github.com/stenciljs/core/commit/e8641322c3a6b08f31469312d5351d611aa05086)), closes [#5749](https://github.com/stenciljs/core/issues/5749)



# 🍵 [4.18.0](https://github.com/stenciljs/core/compare/v4.17.2...v4.18.0) (2024-05-06)


### Bug Fixes

* **hydrate:** output track elements as void elms ([#5720](https://github.com/stenciljs/core/issues/5720)) ([2082351](https://github.com/stenciljs/core/commit/20823518ecdea3a502eed69348fb6719d72af594)), closes [#2994](https://github.com/stenciljs/core/issues/2994)
* **runtime:** add root scope id to the nested child as classname ([#5704](https://github.com/stenciljs/core/issues/5704)) ([b40ebb9](https://github.com/stenciljs/core/commit/b40ebb937869aa16f9adc672129639167406cd07)), closes [#5702](https://github.com/stenciljs/core/issues/5702)
* **testing:** support functional components in unit tests ([#5722](https://github.com/stenciljs/core/issues/5722)) ([922a972](https://github.com/stenciljs/core/commit/922a97207dbe031d164a9b5e16fac4b004a5b7bf)), closes [#4063](https://github.com/stenciljs/core/issues/4063)


### Features

* **docs:** add style mode to `docs-json` output ([#5718](https://github.com/stenciljs/core/issues/5718)) ([44fcba1](https://github.com/stenciljs/core/commit/44fcba1a6cda2b45d83fe4101761f0ee8d82728a))



## 🏊 [4.17.2](https://github.com/stenciljs/core/compare/v4.17.1...v4.17.2) (2024-04-29)


### Bug Fixes

* **build:** address @ionic/angular bundle size issue ([#5705](https://github.com/stenciljs/core/issues/5705)) ([0a7becc](https://github.com/stenciljs/core/commit/0a7beccb0a62a6a33a18b960aa5e59ada1b509fe))
* **compiler:** recognize loud comments when generating style docs ([#5706](https://github.com/stenciljs/core/issues/5706)) ([a325f5c](https://github.com/stenciljs/core/commit/a325f5cd3f691fd3c10a2ab4c19a37d4617a4b79)), closes [#5623](https://github.com/stenciljs/core/issues/5623)



## 🚒 [4.17.1](https://github.com/stenciljs/core/compare/v4.17.0...v4.17.1) (2024-04-23)


### Bug Fixes

* **cli:** prevent generate task from crashing ([#5693](https://github.com/stenciljs/core/issues/5693)) ([9efbf4b](https://github.com/stenciljs/core/commit/9efbf4bffad36bf241c35d0be48a4f557c56c034)), closes [#5692](https://github.com/stenciljs/core/issues/5692)



# ♨️ [4.17.0](https://github.com/stenciljs/core/compare/v4.16.0...v4.17.0) (2024-04-22)

### Internal

* **Rollup to Esbuild Migration**
  The Stencil team has been working on a migration from Rollup to Esbuild. This release (v4.17.0) is the first release we make in which the published Stencil code is compiled by Esbuild. We have done our due diligence to ensure that this will have no impact on Stencil users nor the output of your compiled components. If you experience any problems though, please [raise an issue](https://github.com/stenciljs/core/issues/new?assignees=&labels=&projects=&template=bug_report.yml&title=bug%3A+) and we will address it accordingly.

### Bug Fixes

* **docs:** merge together style docs from multiple CSS files ([#5653](https://github.com/stenciljs/core/issues/5653)) ([84e1a14](https://github.com/stenciljs/core/commit/84e1a14048bc34e64a866659d39376af605f8f9a))
* **docs:** respect custom README content when writing to a custom path ([#5648](https://github.com/stenciljs/core/issues/5648)) ([6bfba1d](https://github.com/stenciljs/core/commit/6bfba1dda502f4ad67263b31b2945fa38a04b338)), fixes [#5400](https://github.com/stenciljs/core/issues/5400)
* **slot-fallback:** fix hiding fallback slot content issue when the slotted element is a text node ([#5496](https://github.com/stenciljs/core/issues/5496)) ([29c69c4](https://github.com/stenciljs/core/commit/29c69c48a281f6bc02e8ab001c4ea98688b00d24)), fixes [#5335](https://github.com/stenciljs/core/issues/5335)
* **testing:** perform string -> boolean type casting for Jest config ([#5672](https://github.com/stenciljs/core/issues/5672)) ([20f74fc](https://github.com/stenciljs/core/commit/20f74fce81597576f341f3a3dc663b6a204243bc)), fixes [#5640](https://github.com/stenciljs/core/issues/5640)



# 🚛 [4.16.0](https://github.com/stenciljs/core/compare/v4.15.0...v4.16.0) (2024-04-15)


### Bug Fixes

* **cli:** fix a bug in CLI argument parsing ([#5646](https://github.com/stenciljs/core/issues/5646)) ([1fdea63](https://github.com/stenciljs/core/commit/1fdea63acfa5a9c1081111d7d79e826a127ef3eb)), refs [#5640](https://github.com/stenciljs/core/issues/5640)
* **testing:** prevent `find` from throwing error when query has no match ([#5641](https://github.com/stenciljs/core/issues/5641)) ([b3886aa](https://github.com/stenciljs/core/commit/b3886aa928c1025e636aee1466f26f15fc4dd3eb)), closes [#5639](https://github.com/stenciljs/core/issues/5639)


### Features

* **dev-server:** dark mode support ([#5642](https://github.com/stenciljs/core/issues/5642)) ([89a5e40](https://github.com/stenciljs/core/commit/89a5e40adfcd7dbad54928cad6525239778ab9cd))
* **typescript:** Update dependency typescript to v5.4.5 ([#5663](https://github.com/stenciljs/core/issues/5663)) ([2596536](https://github.com/stenciljs/core/commit/25965364c3f513b845e44f1db029fab14fdfb68f))



# 🎖 [4.15.0](https://github.com/stenciljs/core/compare/v4.14.1...v4.15.0) (2024-04-08)


### Features

* **compiler:** perform automatic key insertion in more situations ([#5594](https://github.com/stenciljs/core/issues/5594)) ([8ee071b](https://github.com/stenciljs/core/commit/8ee071bf3aae4b2240b50f7af433035c8bf8aa49))
* **typescript:** Update dependency typescript to v5.4.4 ([#5636](https://github.com/stenciljs/core/issues/5636)) ([a463871](https://github.com/stenciljs/core/commit/a46387123082d1af9fc17b5909530597dc5b5c68))



## 🏋 [4.14.1](https://github.com/stenciljs/core/compare/v4.14.0...v4.14.1) (2024-04-04)


### Bug Fixes

* **compiler:** don't mistake aliased paths for collections imports ([#5620](https://github.com/stenciljs/core/issues/5620)) ([af22bb8](https://github.com/stenciljs/core/commit/af22bb858d64b60a97ce93c86f5585ef36b31c3f)), closes [#2319](https://github.com/stenciljs/core/issues/2319)
* **runtime:** nested multiple default slot relocation ([#5403](https://github.com/stenciljs/core/issues/5403)) ([363c07b](https://github.com/stenciljs/core/commit/363c07b4723941954dc748189a744eec01d5b74c)), partially closes [#5335](https://github.com/stenciljs/core/issues/5335)
* **runtime:** prevent ref callbacks from being called too early ([#5614](https://github.com/stenciljs/core/issues/5614)) ([81fa375](https://github.com/stenciljs/core/commit/81fa37587eb853d42bc7f92102318a3446cdea7b)), closes [#4074](https://github.com/stenciljs/core/issues/4074)



# 🚡 [4.14.0](https://github.com/stenciljs/core/compare/v4.13.0...v4.14.0) (2024-04-01)


### Bug Fixes

* **mock-doc:** provide a local name ([#5480](https://github.com/stenciljs/core/issues/5480)) ([2f67b35](https://github.com/stenciljs/core/commit/2f67b3526c7160a0c9ac71727c401a438d282474)), closes [#5342](https://github.com/stenciljs/core/issues/5342)
* **mock-doc:** resolve type issue for localName ([#5595](https://github.com/stenciljs/core/issues/5595)) ([d91af87](https://github.com/stenciljs/core/commit/d91af87d4e309a2da3cb145165cf7fe3c79ac1e7)), closes [#5342](https://github.com/stenciljs/core/issues/5342)


### Features

* **testing:** allow to set screenshot timeout option in Jest v28+ ([#5537](https://github.com/stenciljs/core/issues/5537)) ([6df12b2](https://github.com/stenciljs/core/commit/6df12b2a445ffe431f8412758f298a6e1c8fe3ac))
* **testing:** support deep piercing with Puppeteer ([#5481](https://github.com/stenciljs/core/issues/5481)) ([13d5d41](https://github.com/stenciljs/core/commit/13d5d4188ac0d3d8d002ce93c4ec7abdde5c8086))
* **typescript:** Update dependency typescript to v5.4.3 ([#5588](https://github.com/stenciljs/core/issues/5588)) ([9d489e4](https://github.com/stenciljs/core/commit/9d489e42a60391d2eb88cb0f7827a9368de18140))



# 🚞 [4.13.0](https://github.com/stenciljs/core/compare/v4.12.6...v4.13.0) (2024-03-18)


### Bug Fixes

* **compiler:** allow to set custom root directory ([#5446](https://github.com/stenciljs/core/issues/5446)) ([b6b9617](https://github.com/stenciljs/core/commit/b6b96175c5e6a7d3477ed5fc2d4ddfc17827dd63))
* **compiler:** don't validate references for @Prop, @Method and @Event decorator ([#5475](https://github.com/stenciljs/core/issues/5475)) ([3e45a82](https://github.com/stenciljs/core/commit/3e45a823534a2e36ac51cbc701ecff074c7c842d)), closes [#1352](https://github.com/stenciljs/core/issues/1352)
* **renderer:** fix conditional rendering issue ([#5365](https://github.com/stenciljs/core/issues/5365)) ([5aa886e](https://github.com/stenciljs/core/commit/5aa886eb52efb7f361d53672698e947390c4f6f0)), closes [#5335](https://github.com/stenciljs/core/issues/5335)
* **renderer:** fix missing slot ref callback handling ([#5337](https://github.com/stenciljs/core/issues/5337)) ([41f877e](https://github.com/stenciljs/core/commit/41f877ec48200dee0483691b4e5e519073d392dd)), closes [#5335](https://github.com/stenciljs/core/issues/5335)
* **runtime:** remove `forceUpdate` in `appendChild` patch ([#5437](https://github.com/stenciljs/core/issues/5437)) ([e03795b](https://github.com/stenciljs/core/commit/e03795b38e93dfc024425c11d08792a6f4b02bcb))
* **sys:** fix expected types for `createNodeLogger` and `createNodeSys` ([#5375](https://github.com/stenciljs/core/issues/5375)) ([7a70281](https://github.com/stenciljs/core/commit/7a70281bb41697c2fe9f992af571d5b7af242a79))
* **testing:** use viewport for Puppeteer screenshot clip dimensions ([#5359](https://github.com/stenciljs/core/issues/5359)) ([c879800](https://github.com/stenciljs/core/commit/c8798002aba05af0a4554351b6232ce714d9995b)), closes [#5353](https://github.com/stenciljs/core/issues/5353)


### Features

* **dev-server:** add "ping" route ([#5414](https://github.com/stenciljs/core/issues/5414)) ([b279858](https://github.com/stenciljs/core/commit/b279858e2fc242d5990817f5a3fa4181e2d49604))
* **typescript:** Update dependency typescript to ~5.4.0 ([#5464](https://github.com/stenciljs/core/issues/5464)) ([0833dc4](https://github.com/stenciljs/core/commit/0833dc4929d9048edce435b8c205917775faad52))



## 🍍 [4.12.6](https://github.com/stenciljs/core/compare/v4.12.5...v4.12.6) (2024-03-11)


### Bug Fixes

* **cli:** move version logging earlier in CLI to allow `-v`, `--version` ([#5425](https://github.com/stenciljs/core/issues/5425)) ([194b0fc](https://github.com/stenciljs/core/commit/194b0fc0d9741d45efbe17f90572fbe09fc5ec62))
* **compiler:** fix generated import statement ([#5419](https://github.com/stenciljs/core/issues/5419)) ([502da1b](https://github.com/stenciljs/core/commit/502da1bc3d1503bd82fbf0cccc312825a82772cf))
* **test:** ensure screenshot dir is cleaned up ([#5421](https://github.com/stenciljs/core/issues/5421)) ([15e7a49](https://github.com/stenciljs/core/commit/15e7a4960bc845212563141b00798fdee07cbfbd))



## 💙 [4.12.5](https://github.com/stenciljs/core/compare/v4.12.4...v4.12.5) (2024-03-04)


### Bug Fixes

* **custom-elements:** hydrate on client side ([#5317](https://github.com/stenciljs/core/issues/5317)) ([d809658](https://github.com/stenciljs/core/commit/d809658635280e115d67f1403dba946cce1bb01b)), closes [#3319](https://github.com/stenciljs/core/issues/3319)



## 🐮 [4.12.4](https://github.com/stenciljs/core/compare/v4.12.3...v4.12.4) (2024-02-26)


### Bug Fixes

* **build:** address issue with dynamic import and vite ([#5399](https://github.com/stenciljs/core/issues/5399)) ([8ebacae](https://github.com/stenciljs/core/commit/8ebacae1106704293a2b1720b44eb83209175f96)), closes [#5389](https://github.com/stenciljs/core/issues/5389)



## 🐍 [4.12.3](https://github.com/stenciljs/core/compare/v4.12.2...v4.12.3) (2024-02-20)


### Bug Fixes

* **compiler:** point crypto import at `crypto` instead of `node:crypto` ([#5369](https://github.com/stenciljs/core/issues/5369)) ([7fb783f](https://github.com/stenciljs/core/commit/7fb783fbc0d3c67136cfc0a777da03c9ac22a51c)), closes [#5358](https://github.com/stenciljs/core/issues/5358)
* **runtime:** replace `innerHTML` with `textContent` for CSS injection ([#5207](https://github.com/stenciljs/core/issues/5207)) ([8de2ab5](https://github.com/stenciljs/core/commit/8de2ab5a8ad99876d371a68c3709c5299be29974)), closes [#5206](https://github.com/stenciljs/core/issues/5206)



## 🎯 [4.12.2](https://github.com/stenciljs/core/compare/v4.12.1...v4.12.2) (2024-02-12)


### Bug Fixes

* **compiler:** support async globalScripts functions ([#5158](https://github.com/stenciljs/core/issues/5158)) ([8a129ce](https://github.com/stenciljs/core/commit/8a129ce7342ba737db70e0db6eda088cc9461d7f)), closes [#3392](https://github.com/stenciljs/core/issues/3392)
* **mock-doc:** overwrite parentElement in MockHTMLElement to return null ([#5336](https://github.com/stenciljs/core/issues/5336)) ([0d9ed22](https://github.com/stenciljs/core/commit/0d9ed22c807b1788244258d6cf5eef7c6c637e43)), closes [#5252](https://github.com/stenciljs/core/issues/5252)



## 🏸 [4.12.1](https://github.com/stenciljs/core/compare/v4.12.0...v4.12.1) (2024-02-05)


### Bug Fixes

* **mock-doc:** improve error message when `:scope` selector is used ([#5318](https://github.com/stenciljs/core/issues/5318)) ([f5d4e98](https://github.com/stenciljs/core/commit/f5d4e98d0e12a218e8b2f472853905975b964e02))
* **runtime:** dynamic slot name change ([#5304](https://github.com/stenciljs/core/issues/5304)) ([9d9fe41](https://github.com/stenciljs/core/commit/9d9fe419c669b0e85c00ce9e65ac22d564c51d9c)), closes [#2982](https://github.com/stenciljs/core/issues/2982)
* **runtime:** only generate lazy build CSS when there are component tags ([#5305](https://github.com/stenciljs/core/issues/5305)) ([a0c1bd0](https://github.com/stenciljs/core/commit/a0c1bd0f91938f7f3cfc97cc5402d3ff955d327f)), closes [#3771](https://github.com/stenciljs/core/issues/3771)



# 🌅 [4.12.0](https://github.com/stenciljs/core/compare/v4.11.0...v4.12.0) (2024-01-29)


### Bug Fixes

* **hmr:** allow changes to component decorators when using HMR ([#5290](https://github.com/stenciljs/core/issues/5290)) ([656355f](https://github.com/stenciljs/core/commit/656355fc753fe09128f6f20f33150123863839d8))


### Features

* **runtime:** automatically insert `key` attrs during compilation ([#5143](https://github.com/stenciljs/core/issues/5143)) ([9c47438](https://github.com/stenciljs/core/commit/9c47438a9a727c9d21cc7441e022097a966bd60d))



# 🍝 [4.11.0](https://github.com/stenciljs/core/compare/v4.10.0...v4.11.0) (2024-01-22)


### Bug Fixes

* **runtime:** resolve memory leak caused by global content ref ([#5266](https://github.com/stenciljs/core/issues/5266)) ([fb1b3f5](https://github.com/stenciljs/core/commit/fb1b3f5a5bf1096fa67ad0807881585975b4161b))
* **screenshot:** recognise clip options ([#5205](https://github.com/stenciljs/core/issues/5205)) ([0d61a53](https://github.com/stenciljs/core/commit/0d61a53a24a361cc5b6f9545eaccb6957f9debcc))
* **style:** fixes to watching nested and multiple styles on Stencil components ([#5244](https://github.com/stenciljs/core/issues/5244)) ([fa5ab1b](https://github.com/stenciljs/core/commit/fa5ab1b75f19e1117f0cead1caaf6b00ddccadf3))


### Features

* **compiler:** deprecate customResolveOptions config option ([#5269](https://github.com/stenciljs/core/issues/5269)) ([6faf746](https://github.com/stenciljs/core/commit/6faf746990330da4369e0d73725b0fc2becebb33))
* **deps:** upgrade rollup, commonjs plugin ([#5274](https://github.com/stenciljs/core/issues/5274)) ([661120c](https://github.com/stenciljs/core/commit/661120c6524f1bf2987547677c01654a8bfb199e))



# 🍪 [4.10.0](https://github.com/stenciljs/core/compare/v4.9.1...v4.10.0) (2024-01-15)


### Bug Fixes

* **runtime:** revert slot relocation forwarding ([#5222](https://github.com/stenciljs/core/issues/5222)) ([a2e119d](https://github.com/stenciljs/core/commit/a2e119d059ba0d0fa6155dbd3d82c17612630828))
* **runtime:** slot regressions from experimental slot fixes ([#5221](https://github.com/stenciljs/core/issues/5221)) ([3b4deaa](https://github.com/stenciljs/core/commit/3b4deaabb690963c6c807917af5a6a3401d11384))


### Features

* **deps:** update dependency typescript to ~5.3.0 ([#5248](https://github.com/stenciljs/core/issues/5248)) ([e0e6a96](https://github.com/stenciljs/core/commit/e0e6a9629e937c13d00653398b3c4f472d8b6757))
* **runtime:** add extras flag for scoped slot changes ([#5220](https://github.com/stenciljs/core/issues/5220)) ([15ff950](https://github.com/stenciljs/core/commit/15ff9509a4530a73b5d6c4a3723bbd085d535534))



## 🍬 [4.9.1](https://github.com/stenciljs/core/compare/v4.9.0...v4.9.1) (2024-01-08)


### Bug Fixes

* **declarations:** bundle child_process type for portability ([#5165](https://github.com/stenciljs/core/issues/5165)) ([59ecd9e](https://github.com/stenciljs/core/commit/59ecd9e82ae43e7db67c81959bc34afa0d852087))



# 🐏 [4.9.0](https://github.com/stenciljs/core/compare/v4.8.2...v4.9.0) (2023-12-18)


### Bug Fixes

* **compiler:** fix transforming method parameters into docs ([#5166](https://github.com/stenciljs/core/issues/5166)) ([2d16db6](https://github.com/stenciljs/core/commit/2d16db6d6e7b1b9559c895d3c7a0970207c0df7f))
* **mock-doc:** add HTMLUListElement ([#5169](https://github.com/stenciljs/core/issues/5169)) ([6233cb5](https://github.com/stenciljs/core/commit/6233cb5ed8f8767cf69b328adc697b0f70030b6d)), closes [#3382](https://github.com/stenciljs/core/issues/3382)
* **runtime:** allow setting `key` attr on nested Stencil components ([#5164](https://github.com/stenciljs/core/issues/5164)) ([f6903a8](https://github.com/stenciljs/core/commit/f6903a86caec1dda655290d99eaf8c42a8e102ac))
* **runtime:** patch `removeChild` for `scoped` components ([#5148](https://github.com/stenciljs/core/issues/5148)) ([956c196](https://github.com/stenciljs/core/commit/956c19651772ce1770598e605b6c50e20b39cefa)), closes [#3278](https://github.com/stenciljs/core/issues/3278)
* **screenshot:** reject pixel match process on exit ([#5167](https://github.com/stenciljs/core/issues/5167)) ([c2ee40d](https://github.com/stenciljs/core/commit/c2ee40db4b515224376b94019067de896d2f1a24))


### Features

* **compiler:** Stencil decorator import aliasing ([#5161](https://github.com/stenciljs/core/issues/5161)) ([97dcb45](https://github.com/stenciljs/core/commit/97dcb45d44751d239b0afb6380bea217818b211a)), closes [#3137](https://github.com/stenciljs/core/issues/3137)



## 🐳 [4.8.2](https://github.com/stenciljs/core/compare/v4.8.1...v4.8.2) (2023-12-11)


### Bug Fixes

* **compiler:** make sure typesDir exist before writing to it ([#5109](https://github.com/stenciljs/core/issues/5109)) ([9e4e27e](https://github.com/stenciljs/core/commit/9e4e27e58ad918cb6a0358d63bd348880a6c04e4))
* **compiler:** reapply changes to style import transformer ([#5125](https://github.com/stenciljs/core/issues/5125)) ([#5131](https://github.com/stenciljs/core/issues/5131)) ([735d45a](https://github.com/stenciljs/core/commit/735d45afdda420420f6d3992662cb63ded2c937e)), closes [#5016](https://github.com/stenciljs/core/issues/5016)
* **runtime:** hide slotted content with no destination in scoped components ([#5135](https://github.com/stenciljs/core/issues/5135)) ([77bce27](https://github.com/stenciljs/core/commit/77bce27e028a8c2e72b51bada45ecae9e35420fb)), closes [#4284](https://github.com/stenciljs/core/issues/4284)
* **runtime:** relocate slotted content when slot parent element tag changes ([#5120](https://github.com/stenciljs/core/issues/5120)) ([4303d6a](https://github.com/stenciljs/core/commit/4303d6af1bbcd995e3e02891b5e50768e8eeaffd)), closes [#4284](https://github.com/stenciljs/core/issues/4284)
* **runtime:** update `textContent` patch to mimic Shadow Root ([#5146](https://github.com/stenciljs/core/issues/5146)) ([55c56d6](https://github.com/stenciljs/core/commit/55c56d69a6e7d049bd8da17c6aec54667ec89489)), closes [#3977](https://github.com/stenciljs/core/issues/3977)
* **testing:** make Puppeteer an optional dependency ([#5145](https://github.com/stenciljs/core/issues/5145)) ([43cf0dc](https://github.com/stenciljs/core/commit/43cf0dc5324fb90547d97a0592c3a2d98e69fb0d))



## 🍹 [4.8.1](https://github.com/stenciljs/core/compare/v4.8.0...v4.8.1) (2023-12-04)


### Bug Fixes

* **runtime:** apply nonce to data styles before DOM insert ([#5112](https://github.com/stenciljs/core/issues/5112)) ([df46fdc](https://github.com/stenciljs/core/commit/df46fdc0cb9168171546e335a5628b25909fdd89)), closes [#5102](https://github.com/stenciljs/core/issues/5102)
* **runtime:** call form-associated lifecycle callbacks w/ `this` ([#5104](https://github.com/stenciljs/core/issues/5104)) ([1ac8aa3](https://github.com/stenciljs/core/commit/1ac8aa3da139656c82914fda7eb9e8de62cba56d))
* **testing:** re-add Puppeteer `asElement()` calls ([#5114](https://github.com/stenciljs/core/issues/5114)) ([0c843f8](https://github.com/stenciljs/core/commit/0c843f8d19e6ee04c02ae8699c76c33d5ebb1c70)), closes [#5113](https://github.com/stenciljs/core/issues/5113)



# 🌞 [4.8.0](https://github.com/stenciljs/core/compare/v4.7.2...v4.8.0) (2023-11-27)


### Bug Fixes

* **hydrate:** prevent dead code elimination of patch dom implementation ([#4966](https://github.com/stenciljs/core/issues/4966)) ([5e36057](https://github.com/stenciljs/core/commit/5e3605779589105d6a3da73fcfc2bbe5ceeb5def))
* **mock-doc:** add `getAttributeNode` to mock elements ([#5070](https://github.com/stenciljs/core/issues/5070)) ([4e840e0](https://github.com/stenciljs/core/commit/4e840e0e0e6af86e1cda551f3ec9e50ac57417fa))
* **mock-doc:** add inert to HTMLAttributes ([#5072](https://github.com/stenciljs/core/issues/5072)) ([71a4110](https://github.com/stenciljs/core/commit/71a4110bbce310d2f405557acb25de552db4f78f)), closes [#5071](https://github.com/stenciljs/core/issues/5071)
* **runtime:** apply textnodes to shadow DOM instead of light DOM ([#4946](https://github.com/stenciljs/core/issues/4946)) ([217d588](https://github.com/stenciljs/core/commit/217d58894959d4b05d6dda590f006c35772c321c))
* **test:** pass jest args correctly for v28/29 ([#5068](https://github.com/stenciljs/core/issues/5068)) ([5c4ac32](https://github.com/stenciljs/core/commit/5c4ac328052c1a1f1c13d6393c3d9875ba3573c1))


### Features

* **declarations:** add popover attributes to JSX declarations ([#5064](https://github.com/stenciljs/core/issues/5064)) ([f73aa14](https://github.com/stenciljs/core/commit/f73aa149f06dd3014bfbc2ab7223f8363b859b41))
* **runtime:** proxy form associated custom element lifecycle callbacks ([#4939](https://github.com/stenciljs/core/issues/4939)) ([ca53dbb](https://github.com/stenciljs/core/commit/ca53dbb02ec4babd2957c12eb1a787eee98d2645))



## 🐄 [4.7.2](https://github.com/stenciljs/core/compare/v4.7.1...v4.7.2) (2023-11-13)


### Bug Fixes

* **compiler:** normalize paths on windows ([#4997](https://github.com/stenciljs/core/issues/4997)) ([bb0b1d4](https://github.com/stenciljs/core/commit/bb0b1d46f63175dc09d0a23445be4d4a0d891a01)), closes [#4980](https://github.com/stenciljs/core/issues/4980) [#4961](https://github.com/stenciljs/core/issues/4961)
* **runtime:** add display style to slot-fb elements ([#5028](https://github.com/stenciljs/core/issues/5028)) ([72c1f1a](https://github.com/stenciljs/core/commit/72c1f1a352e8b9ce3c965f6dc751e16acd9cb3ae))
* **test:** don't fail build when jest typings can't be resolved ([#5031](https://github.com/stenciljs/core/issues/5031)) ([5df16e6](https://github.com/stenciljs/core/commit/5df16e69d25db818737a8d827386f8acf3800281)), closes [#5030](https://github.com/stenciljs/core/issues/5030)
* **vite:** resolve PURE comment warnings ([#5018](https://github.com/stenciljs/core/issues/5018)) ([0a1fbe1](https://github.com/stenciljs/core/commit/0a1fbe144e72acdb28af1fcc208c6a1e6a1fdf73)), closes [#5008](https://github.com/stenciljs/core/issues/5008)



## 🍿 [4.7.1](https://github.com/stenciljs/core/compare/v4.7.0...v4.7.1) (2023-11-06)


### Bug Fixes

* **compiler:** correctly generate CSS rules using `::slotted` outside shadow DOM ([#4969](https://github.com/stenciljs/core/issues/4969)) ([4fd0ecd](https://github.com/stenciljs/core/commit/4fd0ecd17e72f6892c96b8256a0206f6e583be13))
* **compiler:** ignore TS diagnostics on builds where typedef file changes ([#5013](https://github.com/stenciljs/core/issues/5013)) ([2a75b65](https://github.com/stenciljs/core/commit/2a75b6501f4f76dad0d8fa8304af57be1c04eef1))



# 💪 [4.7.0](https://github.com/stenciljs/core/compare/v4.6.0...v4.7.0) (2023-10-30)


### Bug Fixes

* **runtime:** prevent additional attempted move of slot content ([#4921](https://github.com/stenciljs/core/issues/4921)) ([adb3ccf](https://github.com/stenciljs/core/commit/adb3ccf2d58c4a2f3f97d2dc9fbe8c8fd4daac62))
* **runtime:** relocate slot content from non-shadow to shadow components w/ slot name change ([#4940](https://github.com/stenciljs/core/issues/4940)) ([0fe78c7](https://github.com/stenciljs/core/commit/0fe78c74ceea857641d0ce1ad7634c4fbd372e8e))
* **runtime:** slot name forwarding & attribute reset ([#4993](https://github.com/stenciljs/core/issues/4993)) ([ee60f3b](https://github.com/stenciljs/core/commit/ee60f3b33bcd44acb29261ab444c111513cccd4b))
* **runtime:** slotted content order with sibling elements ([#4994](https://github.com/stenciljs/core/issues/4994)) ([740c1e4](https://github.com/stenciljs/core/commit/740c1e4faaf8bc221a2db32e2923c1efc553fd8b))
* **runtime:** support "capture" style events ([#4968](https://github.com/stenciljs/core/issues/4968)) ([2c8cfac](https://github.com/stenciljs/core/commit/2c8cfac6389730f82bfeff776c5f495cafe0b627))
* **www:** ensure that files necessary for www build are on disk ([#4992](https://github.com/stenciljs/core/issues/4992)) ([b74220b](https://github.com/stenciljs/core/commit/b74220bed26bfa0c869cf1be0e3ebb5b8527f594))
* **www:** fix an inconsistency between www builds ([#4983](https://github.com/stenciljs/core/issues/4983)) ([f113b05](https://github.com/stenciljs/core/commit/f113b052af728a0e5dbc96b1cdc443405c277ec1))


### Features

* **test:** jest 28 support ([#4979](https://github.com/stenciljs/core/issues/4979)) ([d3aa539](https://github.com/stenciljs/core/commit/d3aa5395b8c6c54ccf9eb90811649749875b5a17))
* **test:** jest 29 support ([#4981](https://github.com/stenciljs/core/issues/4981)) ([4959295](https://github.com/stenciljs/core/commit/4959295c24ec3effcc8d63a8305dffd6e07a617d))



# 💥 [4.6.0](https://github.com/stenciljs/core/compare/v4.5.0...v4.6.0) (2023-10-23)


### Bug Fixes

* **compiler:** consistently generate additional type files ([#4938](https://github.com/stenciljs/core/issues/4938)) ([70cba50](https://github.com/stenciljs/core/commit/70cba503e881755f5d24d2f23a8e121aedf5a805))
* **compiler:** persist polyfills on build ([#4932](https://github.com/stenciljs/core/issues/4932)) ([b97dadc](https://github.com/stenciljs/core/commit/b97dadc967b1fde892cb75a544b1eecd2361b194)), closes [#4661](https://github.com/stenciljs/core/issues/4661)
* **runtime:** add height, width Source attrs ([#4943](https://github.com/stenciljs/core/issues/4943)) ([c9a3eac](https://github.com/stenciljs/core/commit/c9a3eac789c8fe9c6fdb6b7be2037a19ee361c6d)), closes [#4942](https://github.com/stenciljs/core/issues/4942)


### Features

* **types:** generate addEventListener and removeEventListener overloads to component html element type ([#4909](https://github.com/stenciljs/core/issues/4909)) ([0249798](https://github.com/stenciljs/core/commit/024979841f7124aa3bcce6a6ecd094dfecf1566c))



# 📢 [4.5.0](https://github.com/stenciljs/core/compare/v4.4.1...v4.5.0) (2023-10-16)


### Features

* **compiler, runtime:** add support for form-associated elements ([#4784](https://github.com/stenciljs/core/issues/4784)) ([5976c9b](https://github.com/stenciljs/core/commit/5976c9b6a6e7b49d470390021b9c31e4d3cbbf4b))



## ❤️ [4.4.1](https://github.com/stenciljs/core/compare/v4.4.0...v4.4.1) (2023-10-09)


### Bug Fixes

* **screenshot:** alert user when toMatchScreenshot uses NaN ([#4891](https://github.com/stenciljs/core/issues/4891)) ([a251946](https://github.com/stenciljs/core/commit/a251946106f116701787853893b3fa53dfaa8c9f))



# 🍫 [4.4.0](https://github.com/stenciljs/core/compare/v4.3.0...v4.4.0) (2023-10-02)


### Bug Fixes

* **jest:** use correct minimum jest version ([#4851](https://github.com/stenciljs/core/issues/4851)) ([2f7fb88](https://github.com/stenciljs/core/commit/2f7fb88dcd75312f658421c4c518fa76292517db))


### Features

* **typescript:** upgrade to TypeScript 5.2 ([#4852](https://github.com/stenciljs/core/issues/4852)) ([b589a07](https://github.com/stenciljs/core/commit/b589a07188a956dbde858bab2b6abf1ad7a1e65b))



# 🐫 [4.3.0](https://github.com/stenciljs/core/compare/v4.2.1...v4.3.0) (2023-09-18)


### Bug Fixes

* **compiler:** restrict config extras slot fix flags ([#4767](https://github.com/stenciljs/core/issues/4767)) ([f2c3229](https://github.com/stenciljs/core/commit/f2c322959c13400b1a17bb698ae3ee37295ab08d))
* **test:** ensure legacy decorators are used when using transpile ([#4771](https://github.com/stenciljs/core/issues/4771)) ([2ef9ec7](https://github.com/stenciljs/core/commit/2ef9ec7549930ef2b9fcfeba11374c8a543ed36f))


### Features

* **compiler:** computed properties can be used with Stencil decorators ([#4746](https://github.com/stenciljs/core/issues/4746)) ([a848269](https://github.com/stenciljs/core/commit/a848269f9883d68a44237caae469cd8a3ba5fa65))
* **runtime:** watch native HTML attributes ([#4760](https://github.com/stenciljs/core/issues/4760)) ([fc86c23](https://github.com/stenciljs/core/commit/fc86c23e3bf690b19fa84d8bb34e7da4598291dc))



## 😀 [4.2.1](https://github.com/stenciljs/core/compare/v4.2.0...v4.2.1) (2023-09-11)


### Bug Fixes

* **compiler:** add heritage clauses earlier in native transform ([#4769](https://github.com/stenciljs/core/issues/4769)) ([9a92ad1](https://github.com/stenciljs/core/commit/9a92ad12f628a5c2eae3048bda983fed2bc140b5))



# 🌲 [4.2.0](https://github.com/stenciljs/core/compare/v4.2.0-0...v4.2.0) (2023-09-05)


### Bug Fixes

* **compiler:** resolve implicit enum types ([#4739](https://github.com/stenciljs/core/issues/4739)) ([f5a3bd8](https://github.com/stenciljs/core/commit/f5a3bd8739a4b9eab3b8b9b1f9c808c47b2aa4fc))
* **runtime:** patch methods for scoped slot `append`, `prepend`, and `insertAdjacent` ([#4719](https://github.com/stenciljs/core/issues/4719)) ([1d98462](https://github.com/stenciljs/core/commit/1d98462135a196b9d9037dd46f0e7fe55d108496))


### Features
* **typescript:** upgrade to TypeScript 5.1 ([#4718](https://github.com/stenciljs/core/pull/4718)) ([49df0e7](https://github.com/stenciljs/core/commit/49df0e7b9bc1862d690e3239404243de1c838d6d))



# ⚽️ [4.2.0-0](https://github.com/stenciljs/core/compare/v4.1.0...v4.2.0-0) (2023-09-05)


### Bug Fixes

* **compiler:** resolve implicit enum types ([#4739](https://github.com/stenciljs/core/issues/4739)) ([f5a3bd8](https://github.com/stenciljs/core/commit/f5a3bd8739a4b9eab3b8b9b1f9c808c47b2aa4fc))
* **runtime:** patch methods for scoped slot `append`, `prepend`, and `insertAdjacent` ([#4719](https://github.com/stenciljs/core/issues/4719)) ([1d98462](https://github.com/stenciljs/core/commit/1d98462135a196b9d9037dd46f0e7fe55d108496))


### Features
* **typescript:** upgrade to TypeScript 5.1 ([#4718](https://github.com/stenciljs/core/pull/4718)) ([49df0e7](https://github.com/stenciljs/core/commit/49df0e7b9bc1862d690e3239404243de1c838d6d))



# 🐟 [4.1.0](https://github.com/stenciljs/core/compare/v4.0.5...v4.1.0) (2023-08-21)


### Bug Fixes

* **runtime:** adds a testing check to the forceUpdate method ([#4682](https://github.com/stenciljs/core/issues/4682)) ([7e9544d](https://github.com/stenciljs/core/commit/7e9544d4c9c586d9bdd969a0ae9a6a0bb7681d90))
* **typings:** add crossorigin html attr to img ([#4686](https://github.com/stenciljs/core/issues/4686)) ([65d60fb](https://github.com/stenciljs/core/commit/65d60fbef16efd35f5680787c0e72a4b4b410a2b)), closes [#4685](https://github.com/stenciljs/core/issues/4685)


### Features

* **compiler:** include `getAssetPath` in generated export statement ([#4683](https://github.com/stenciljs/core/issues/4683)) ([821da79](https://github.com/stenciljs/core/commit/821da79c3b4e32f8580257f45bea4733577c08f3))
* **config:** add experimentalSlotFixes config value ([#4652](https://github.com/stenciljs/core/issues/4652)) ([392af26](https://github.com/stenciljs/core/commit/392af26f08a8c2b08b90d367a30e737f6612b979))



## 🚣 [4.0.5](https://github.com/stenciljs/core/compare/v4.0.4...v4.0.5) (2023-08-14)


### Bug Fixes

* **compiler:** match tsconfig include paths properly ([#4676](https://github.com/stenciljs/core/issues/4676)) ([664ecb7](https://github.com/stenciljs/core/commit/664ecb78cba3a267fa436cada551d878655cd2ab)), closes [#4667](https://github.com/stenciljs/core/issues/4667)



## 🍧 [4.0.4](https://github.com/stenciljs/core/compare/v4.0.3...v4.0.4) (2023-08-07)


### Bug Fixes

* **runtime:** `forceUpdate` calls only execute when in a browser env ([#4591](https://github.com/stenciljs/core/issues/4591)) ([b203263](https://github.com/stenciljs/core/commit/b203263482140fde31edfb7a91ac6054f5f98460))
* **typings:** add additional transition events to DOMAttributes ([#4645](https://github.com/stenciljs/core/issues/4645)) ([420052f](https://github.com/stenciljs/core/commit/420052f26b9429906476584f174493d1d42db9ac)), closes [#4643](https://github.com/stenciljs/core/issues/4643)



## 🎾 [4.0.3](https://github.com/stenciljs/core/compare/v4.0.2...v4.0.3) (2023-07-31)


### Bug Fixes

* **compiler:** custom elements relative typedef import paths ([#4633](https://github.com/stenciljs/core/issues/4633)) ([feba98c](https://github.com/stenciljs/core/commit/feba98c35bab96ee0e7c72617a2f3a20c4bf7b72))
* **docs-json:** use dts-bundle-generator to bundle types for docs-json ([#4619](https://github.com/stenciljs/core/issues/4619)) ([6ba3249](https://github.com/stenciljs/core/commit/6ba3249cab485f09ab6e16d4eb63076d40a564a0))
* **runtime:** add onSelect to textarea and input ([#4616](https://github.com/stenciljs/core/issues/4616)) ([8ae64f2](https://github.com/stenciljs/core/commit/8ae64f21a046c88204f785519e3b59fbe1670612))
* **runtime:** handle lazy-instance promises for connected & disconnected callbacks ([#4072](https://github.com/stenciljs/core/issues/4072)) ([dffc5bb](https://github.com/stenciljs/core/commit/dffc5bb4c3c6f19274051a4953601e2af5ac6f95))
* **runtime:** override attrs set on Host with values from host element ([#4548](https://github.com/stenciljs/core/issues/4548)) ([b088b9e](https://github.com/stenciljs/core/commit/b088b9e48d8c4799cfa2b7210f4bc9feb4d6ef94))
* **testing:** remove use of `emulate` field in `E2EPage()` ([#4632](https://github.com/stenciljs/core/issues/4632)) ([4d7b138](https://github.com/stenciljs/core/commit/4d7b138a6d57509d8ecc25c5b9cbb7932752881c))



## 😈 [4.0.2](https://github.com/stenciljs/core/compare/v4.0.1...v4.0.2) (2023-07-24)


### Bug Fixes

* **compiler:** ensures transformed paths are relative paths for `dist-collection` ([#4552](https://github.com/stenciljs/core/issues/4552)) ([e11ac0e](https://github.com/stenciljs/core/commit/e11ac0e52f8ed1e3bc605779d893df3d4e767957))
* **compiler:** handle `@supports` blocks when scoping css ([#4572](https://github.com/stenciljs/core/issues/4572)) ([18ed5fc](https://github.com/stenciljs/core/commit/18ed5fc0a8828c3df4a5b31e2778ceda48f49730))
* **compiler:** only create one class member when transforming `@Element()` decorators ([#4547](https://github.com/stenciljs/core/issues/4547)) ([13fac03](https://github.com/stenciljs/core/commit/13fac0399fd08672832adb52ee3caed57aef2f2f))
* **compiler:** sourcemap errors for dist-custom-elements + dist-hydrate-script ([#4527](https://github.com/stenciljs/core/issues/4527)) ([1d79672](https://github.com/stenciljs/core/commit/1d79672809dcaa3b56ec3761e46f9d1ef51915ad))
* **compiler:** sourcemap generation without ext runtime ([#4570](https://github.com/stenciljs/core/issues/4570)) ([d1be334](https://github.com/stenciljs/core/commit/d1be334b5ed12381eafbcd05ab56029a9366a21d))
* **lazy:** adjust the type of `defineCustomElements` ([#4592](https://github.com/stenciljs/core/issues/4592)) ([5c85c33](https://github.com/stenciljs/core/commit/5c85c332a7390b30fdba1d8598e618e5bf0f2b59))
* **mock-doc:** adjust matchMedia mock return ([#4509](https://github.com/stenciljs/core/issues/4509)) ([3cda014](https://github.com/stenciljs/core/commit/3cda014035412c775f2b03b4feda337944907b8f))
* **output-targets:** fix path normalization logic ([#4545](https://github.com/stenciljs/core/issues/4545)) ([cd5849c](https://github.com/stenciljs/core/commit/cd5849c6e1853750adde2b71791ca825f38f730d))
* **rollup-config:** deprecate BundlingConfig#namedExports ([#4532](https://github.com/stenciljs/core/issues/4532)) ([a353769](https://github.com/stenciljs/core/commit/a353769b0094cd502a9ce35f797f74c7dc1d9232)), closes [#2523](https://github.com/stenciljs/core/issues/2523)
* **runtime:** properly type color-interpolation-filter ([#4530](https://github.com/stenciljs/core/issues/4530)) ([3ccf753](https://github.com/stenciljs/core/commit/3ccf753f13ced6fa1339850882919192e912da30))


### Thanks

🎉 Thanks for @bdriguesdev for their contributions! 🎉


## ⛹ [4.0.1](https://github.com/stenciljs/core/compare/v4.0.0...v4.0.1) (2023-06-28)


### Bug Fixes

* **compiler:** address when a home module cannot be found ([#4521](https://github.com/stenciljs/core/issues/4521)) ([06eaa8f](https://github.com/stenciljs/core/commit/06eaa8f4edbf83e48be1e83b7b5db4e7b48e5918))
* **compiler:** normalize recommended `collection` path for `package.json` validation ([#4522](https://github.com/stenciljs/core/issues/4522)) ([af9639c](https://github.com/stenciljs/core/commit/af9639c8c286a8863f7f384f38a7efaa9ec8fafa))



# 🐅 [4.0.0](https://github.com/stenciljs/core/compare/v3.4.1...v4.0.0) (2023-06-26)


### Bug Fixes

* **compiler:** re-enable build caching ([#4503](https://github.com/stenciljs/core/issues/4503)) ([5c34609](https://github.com/stenciljs/core/commit/5c346098b0d4567702d4cb9607b484037fc69531))


### Features

* **compiler:** remove in-browser compilation support ([#4317](https://github.com/stenciljs/core/issues/4317)) ([b042d8b](https://github.com/stenciljs/core/commit/b042d8b6e02c2df09a920db14abe551879cde5a2))
* **compiler:** primary package output target validation ([#4395](https://github.com/stenciljs/core/issues/4395)) ([e53ee07](https://github.com/stenciljs/core/commit/e53ee076547c834f3867f866925d04eab0739b0d))
* **compiler** remove shadow dom shim ([#4440](https://github.com/stenciljs/core/pull/4440)) ([8ecdec9](https://github.com/stenciljs/core/commit/8ecdec9fafffa7d3ca5cc9621e26481c70cfbb89))
* **compiler** remove CSS var shim & patchEsm() ([#4419](https://github.com/stenciljs/core/pull/4419)) ([4977f38](https://github.com/stenciljs/core/commit/4977f38f6b248f1e9644f2fc78d255b4ef7bbb03))
* **compiler** remove safari10 extra flag ([#4421](https://github.com/stenciljs/core/pull/4421)) ([283fd5c](https://github.com/stenciljs/core/commit/283fd5c1bf93a4f89c84127c49c26c34559da644))
* **compiler** remove dynamicImportShim ([#4420](https://github.com/stenciljs/core/pull/4420)) ([3ee20b7](https://github.com/stenciljs/core/commit/3ee20b7aa9704de5811f7fec7c517012b88ed5b6))
* **config:** set new defaults for transformAliasedImportPaths ([#4418](https://github.com/stenciljs/core/issues/4418)) ([52d4209](https://github.com/stenciljs/core/commit/52d4209b6f211a329555e1ca5eccc0883fecfd32))
* **docs:** enrich type information for docs-json Output Target ([#4212](https://github.com/stenciljs/core/issues/4212)) ([7c0511e](https://github.com/stenciljs/core/commit/7c0511ef1fa5a30fbe9c60e987855fea64be87f5))
* **runtime:** drop Node 14 support ([#4472](https://github.com/stenciljs/core/issues/4472)) ([ce18945](https://github.com/stenciljs/core/commit/ce189456bd601c647bb47871ccd5897707d48ee0))
* **props:** removal of deprecated connect and context APIs ([#4437](https://github.com/stenciljs/core/issues/4437)) ([4691e9f](https://github.com/stenciljs/core/commit/4691e9f1e6b98008bbf557953ec844b987a98808))

### BREAKING CHANGES

See [BREAKING_CHANGES.md - v4.0.0](./BREAKING_CHANGES.md#stencil-v400) for a comprehensive list of breaking changes.

See [the v4.0.0 Migration Guide](https://stenciljs.com/docs/introduction/upgrading-to-stencil-four) for a guide to migrate to Stencil v4.0.0.

### Additional Changes

This release includes the latest changes from Stencil v3.4.1.


# 🍜 [4.0.0-rc.0](https://github.com/stenciljs/core/compare/v3.4.0...v4.0.0-rc.0) (2023-06-16)


### Features

The following changes are new to this release:

* **props:** removal of deprecated connect and context APIs ([#4437](https://github.com/stenciljs/core/issues/4437)) ([f399ef1](https://github.com/stenciljs/core/commit/f399ef162e8db8046e39d6f3c6aa4a589ee68ca6))
* **runtime:** drop Node 14 support ([#4472](https://github.com/stenciljs/core/issues/4472)) ([ce18945](https://github.com/stenciljs/core/commit/ce189456bd601c647bb47871ccd5897707d48ee0))

The following changes are also present from previous beta releases:

* **compiler:** remove in-browser compilation support ([#4317](https://github.com/stenciljs/core/issues/4317)) ([b042d8b](https://github.com/stenciljs/core/commit/b042d8b6e02c2df09a920db14abe551879cde5a2))
* **compiler:** primary package output target validation ([#4395](https://github.com/stenciljs/core/issues/4395)) ([e53ee07](https://github.com/stenciljs/core/commit/e53ee076547c834f3867f866925d04eab0739b0d))
* **compiler** remove shadow dom shim ([#4440](https://github.com/stenciljs/core/pull/4440)) ([8ecdec9](https://github.com/stenciljs/core/commit/8ecdec9fafffa7d3ca5cc9621e26481c70cfbb89))
* **compiler** remove CSS var shim & patchEsm() ([#4419](https://github.com/stenciljs/core/pull/4419)) ([4977f38](https://github.com/stenciljs/core/commit/4977f38f6b248f1e9644f2fc78d255b4ef7bbb03))
* **compiler** remove safari10 extra flag ([#4421](https://github.com/stenciljs/core/pull/4421)) ([283fd5c](https://github.com/stenciljs/core/commit/283fd5c1bf93a4f89c84127c49c26c34559da644))
* **compiler** remove dynamicImportShim ([#4420](https://github.com/stenciljs/core/pull/4420)) ([3ee20b7](https://github.com/stenciljs/core/commit/3ee20b7aa9704de5811f7fec7c517012b88ed5b6))


### BREAKING CHANGES

See [BREAKING_CHANGES.md - v4.0.0](./BREAKING_CHANGES.md#stencil-v400) for a comprehensive list of breaking changes.

See [the v4.0.0 Migration Guide](https://stenciljs.com/docs/introduction/upgrading-to-stencil-four) for a guide to migrate to Stencil v4.0.0.

### Additional Changes

This release includes the latest changes from Stencil v3.4.0.



# 👻 [4.0.0-beta.2](https://github.com/stenciljs/core/compare/v3.3.1...v4.0.0-beta.2) (2023-06-07)


### Features

* **compiler:** remove in-browser compilation support ([#4317](https://github.com/stenciljs/core/issues/4317)) ([b042d8b](https://github.com/stenciljs/core/commit/b042d8b6e02c2df09a920db14abe551879cde5a2))
* **compiler:** primary package output target validation ([#4395](https://github.com/stenciljs/core/issues/4395)) ([e53ee07](https://github.com/stenciljs/core/commit/e53ee076547c834f3867f866925d04eab0739b0d))

### BREAKING CHANGES

See [BREAKING_CHANGES.md - v4.0.0](./BREAKING_CHANGES.md#stencil-v400) for a comprehensive list of breaking changes.

See [the v4.0.0 Migration Guide](https://stenciljs.com/docs/introduction/upgrading-to-stencil-four) for a guide to migrate to Stencil v4.0.0.

### Additional Changes

This release includes the latest changes from Stencil v3.3.1.


# 🐐 [4.0.0-beta.1](https://github.com/stenciljs/core/compare/v3.3.1...v4.0.0-beta.1) (2023-06-02)

### Features

* **compiler** remove shadow dom shim ([#4440](https://github.com/stenciljs/core/pull/4440)) ([8ecdec9](https://github.com/stenciljs/core/commit/8ecdec9fafffa7d3ca5cc9621e26481c70cfbb89))

### BREAKING CHANGES

See [BREAKING_CHANGES.md - v4.0.0](./BREAKING_CHANGES.md#stencil-v400) for a comprehensive list of breaking changes.

See [the v4.0.0 Migration Guide](https://stenciljs.com/docs/introduction/upgrading-to-stencil-four) for a guide to migrate to Stencil v4.0.0.

### Additional Changes

This release includes the latest changes from Stencil v3.3.1.

# 🎬 [4.0.0-beta.0](https://github.com/stenciljs/core/compare/v3.3.0...v4.0.0-beta.0) (2023-05-30)


### Bug Fixes

* **e2e:** honor devtools and browserDevtools settings ([#4403](https://github.com/stenciljs/core/issues/4403)) ([fe433b6](https://github.com/stenciljs/core/commit/fe433b6005ac3e544501ab9d6c481864c84b20f2))


### Features

* **compiler** remove CSS var shim & patchEsm() ([#4419](https://github.com/stenciljs/core/pull/4419)) ([4977f38](https://github.com/stenciljs/core/commit/4977f38f6b248f1e9644f2fc78d255b4ef7bbb03))
* **compiler** remove safari10 extra flag ([#4421](https://github.com/stenciljs/core/pull/4421)) ([283fd5c](https://github.com/stenciljs/core/commit/283fd5c1bf93a4f89c84127c49c26c34559da644))
* **compiler** remove dynamicImportShim ([#4420](https://github.com/stenciljs/core/pull/4420)) ([3ee20b7](https://github.com/stenciljs/core/commit/3ee20b7aa9704de5811f7fec7c517012b88ed5b6))

### BREAKING CHANGES

See [BREAKING_CHANGES.md - v4.0.0](./BREAKING_CHANGES.md#stencil-v400) for a comprehensive list of breaking changes.

See [the v4.0.0 Migration Guide](https://stenciljs.com/docs/introduction/upgrading-to-stencil-four) for a guide to migrate to Stencil v4.0.0.


## ☀️ [3.4.2](https://github.com/stenciljs/core/compare/v3.4.1...v3.4.2) (2023-07-24)


### Bug Fixes

* **compiler:** ensures transformed paths are relative paths for `dist-collection` (v3) ([#4553](https://github.com/stenciljs/core/issues/4553)) ([2d3e0d3](https://github.com/stenciljs/core/commit/2d3e0d30507ad251b88b3381de8828a95a0057d0))


## 🐨 [3.4.1](https://github.com/stenciljs/core/compare/v3.4.0...v3.4.1) (2023-06-26)


### Bug Fixes

* **compiler:** fix issue with aliased paths getting cut off ([#4481](https://github.com/stenciljs/core/issues/4481)) ([1a2c160](https://github.com/stenciljs/core/commit/1a2c1608a41bbe0420ec066d2bf56f32ed6613b8))
* **compiler:** reorder tsconfig#path transforms ([#4501](https://github.com/stenciljs/core/issues/4501)) ([6b4fe58](https://github.com/stenciljs/core/commit/6b4fe58deeb1cf9097763aec3bbb3ee7a56afec9))



# ✨ [3.4.0](https://github.com/stenciljs/core/compare/v3.3.1...v3.4.0) (2023-06-13)


### Bug Fixes

* **compiler:** handle static members with stencil decorators ([#4463](https://github.com/stenciljs/core/issues/4463)) ([dc3925e](https://github.com/stenciljs/core/commit/dc3925e86d27d4f7360d0b7d398a251f60042265))
* **runtime:** add autocomplete to textarea ([#4465](https://github.com/stenciljs/core/issues/4465)) ([7f42430](https://github.com/stenciljs/core/commit/7f42430196d1bb9c928df9f0dbd0bfebcd20d01a))
* **runtime:** issue with update-component and patched Promise ([#4460](https://github.com/stenciljs/core/issues/4460)) ([1187694](https://github.com/stenciljs/core/commit/1187694f4ccfc5911d352d6770dafa5b46a29432))


### Features

* **compiler:** primary package output target validation ([#4395](https://github.com/stenciljs/core/issues/4395)) ([e53ee07](https://github.com/stenciljs/core/commit/e53ee076547c834f3867f866925d04eab0739b0d))



## 🎀 [3.3.1](https://github.com/stenciljs/core/compare/v3.3.0...v3.3.1) (2023-06-02)


### Bug Fixes

* **compiler:** handle ts 5.0 static members ([#4447](https://github.com/stenciljs/core/issues/4447)) ([6dbe9a5](https://github.com/stenciljs/core/commit/6dbe9a5b4548ddb2cd08b389509f22f9895639f9)), closes [#4424](https://github.com/stenciljs/core/issues/4424)
* **e2e:** honor devtools and browserDevtools settings ([#4403](https://github.com/stenciljs/core/issues/4403)) ([fe433b6](https://github.com/stenciljs/core/commit/fe433b6005ac3e544501ab9d6c481864c84b20f2)), closes [#2537](https://github.com/stenciljs/core/issues/2537)



# 🍭 [3.3.0](https://github.com/stenciljs/core/compare/v3.2.2...v3.3.0) (2023-05-23)


### Bug Fixes

* **compiler:** components typedef path aliases ([#4365](https://github.com/stenciljs/core/issues/4365)) ([fd63c17](https://github.com/stenciljs/core/commit/fd63c1779a2b4889be536e23ad763199f02d861d))


### Features

* **node** add support for node v20 ([#4368](https://github.com/stenciljs/core/pull/4368)) ([ffe1847](https://github.com/stenciljs/core/commit/ffe1847062ccae0e2b525ac290e3ac977e3ad6a3))
* **testing:** support puppeteer's 'headless': 'new' ([#4356](https://github.com/stenciljs/core/issues/4356)) ([79dc015](https://github.com/stenciljs/core/commit/79dc0159d216824d623e34f814dfeb32474a1550))
* **typescript:** upgrade to TypeScript 5 ([#4315](https://github.com/stenciljs/core/issues/4315)) ([0b6621f](https://github.com/stenciljs/core/commit/0b6621f21634b7498de0666a872ffcacc93fef87))



## 🏒 [3.2.2](https://github.com/stenciljs/core/compare/v3.2.1...v3.2.2) (2023-05-01)


### Bug Fixes

* **declarations:** add `onCancel` to dialog attributes ([#4280](https://github.com/stenciljs/core/issues/4280)) ([725ff7e](https://github.com/stenciljs/core/commit/725ff7e5a4fac5aa5cd0adb263e484f2ada5cc40)), fixes [#4267](https://github.com/stenciljs/core/issues/4267)
* **runtime:** initialize custom elements even when there is no styles ([#4296](https://github.com/stenciljs/core/issues/4296)) ([23f1e66](https://github.com/stenciljs/core/commit/23f1e66fb1a092266dfd17c31987499b2ece0b0d)), fixes [#4221](https://github.com/stenciljs/core/issues/4221)
* **testing:** jest component disconnected callback ([#4269](https://github.com/stenciljs/core/issues/4269)) ([4ec3b69](https://github.com/stenciljs/core/commit/4ec3b694454fddfc71bf9999e31e1341e10117e2)), fixes [#4053](https://github.com/stenciljs/core/issues/4053)



## 🎙 [3.2.1](https://github.com/stenciljs/core/compare/v3.2.0...v3.2.1) (2023-04-10)


### Bug Fixes

* **compiler:** sourcemap for dist-custom-elements generation ([#4200](https://github.com/stenciljs/core/issues/4200)) ([62ad269](https://github.com/stenciljs/core/commit/62ad269ca34f665e41bce825f54de9f81d5ed4a4))
* **compiler:** write exports for defineCustomElement typedefs ([#4194](https://github.com/stenciljs/core/issues/4194)) ([89cd845](https://github.com/stenciljs/core/commit/89cd8456a6d274cb3e74e839c7fde228dcdcabc6))
* **mock-doc:** add missing properties of object returned by matchMedia ([#2880](https://github.com/stenciljs/core/issues/2880)) ([69176f8](https://github.com/stenciljs/core/commit/69176f8290767c05206f324bccb5bea2cf780448))
* **test:** fix infinite loops w/ react and @testing-library/dom ([#4188](https://github.com/stenciljs/core/issues/4188)) ([51750a2](https://github.com/stenciljs/core/commit/51750a28ece1638dae6bc5c02221d70f485bfb44)), closes [#3434](https://github.com/stenciljs/core/issues/3434)


## Thanks

🎉 Thanks for @cam-narzt for their contributions! 🎉


# 🌷 [3.2.0](https://github.com/stenciljs/core/compare/v3.1.0...v3.2.0) (2023-03-14)


### Bug Fixes

* **cli:** support Jest-specific CLI flag aliases ([#4124](https://github.com/stenciljs/core/issues/4124)) ([56389a4](https://github.com/stenciljs/core/commit/56389a452d9b072976112ca6339d60b1aea9f73d))
* **compiler:** use file system polling events in watch mode ([#4146](https://github.com/stenciljs/core/issues/4146)) ([4a12b06](https://github.com/stenciljs/core/commit/4a12b067f5dcc1048eeabe21fb551c071a3e67b4)), fixes [#3952](https://github.com/stenciljs/core/issues/3952), [#4011](https://github.com/stenciljs/core/issues/4011), [#4044](https://github.com/stenciljs/core/issues/4044)
* **test:** support importing from ES modules in spec tests ([#4136](https://github.com/stenciljs/core/issues/4136)) ([23a73f0](https://github.com/stenciljs/core/commit/23a73f0954db1cbc14f3c1d630cc7b5f81382128)), closes [#3251](https://github.com/stenciljs/core/issues/3251)
* **typo:** fix info task output ([#4099](https://github.com/stenciljs/core/issues/4099)) ([d88bf30](https://github.com/stenciljs/core/commit/d88bf3055123953cff8417c06cd07fc79680c76e))


### Features

* **config:** add enableImportInjection flag ([#4156](https://github.com/stenciljs/core/issues/4156)) ([2f23a8a](https://github.com/stenciljs/core/commit/2f23a8af5b0516218f352b41f6241bea96b28774))


## Thanks

🎉 Thanks for @sandrooco for their contributions! 🎉


# 🍕 [3.1.0](https://github.com/stenciljs/core/compare/v3.0.1...v3.1.0) (2023-02-28)


### Bug Fixes

* **browser:** polyfill assert, process ([#4066](https://github.com/stenciljs/core/issues/4066)) ([d493987](https://github.com/stenciljs/core/commit/d49398715fd1ff1fd7eca261c1dd0d778081948c))
* **runtime:** prevent null data-opts access ([#4101](https://github.com/stenciljs/core/issues/4101)) ([9526633](https://github.com/stenciljs/core/commit/9526633f1630478cc6e4ea45ab62550b064996e3)), closes [#2431](https://github.com/stenciljs/core/issues/2431)


### Features

* **compiler:** transform module aliases in emitted js, typedefs ([#4042](https://github.com/stenciljs/core/issues/4042)) ([7bccf68](https://github.com/stenciljs/core/commit/7bccf68ef6c92b6e074924be7e5cf01a60963b4f))
* **testing:** add support for transforming path aliases in spec tests ([#4090](https://github.com/stenciljs/core/issues/4090)) ([92fbd1c](https://github.com/stenciljs/core/commit/92fbd1c4345ed6b1071b4b8de930dc9ffddf77f3))



## 🍒 [3.0.1](https://github.com/stenciljs/core/compare/v3.0.0...v3.0.1) (2023-02-13)


### Bug Fixes

* **compiler:** ensure rollup outputs a single file for hydrateFactory ([#4023](https://github.com/stenciljs/core/issues/4023)) ([91092ab](https://github.com/stenciljs/core/commit/91092abaac9e16f66b3fa3285549099462fb0cd0))


### Thanks

🎉 Thanks for @George-Payne for their contributions! 🎉


# 🍇 [3.0.0](https://github.com/stenciljs/core/compare/v2.22.2...v3.0.0) (2023-01-25)


### Bug Fixes

* **compiler:** fix 'destroy' callback naming ([#3289](https://github.com/stenciljs/core/issues/3289)) ([602b322](https://github.com/stenciljs/core/commit/602b3228b4a42c191a36f5db27154647f5aefb65))
* **declarations:** correct event handler names for composition events ([#3777](https://github.com/stenciljs/core/issues/3777)) ([e09fdf8](https://github.com/stenciljs/core/commit/e09fdf81bd0fc105a5280fae12e1b654290f7518))
* **runtime:** type autocapitalize property as a string ([#3692](https://github.com/stenciljs/core/issues/3692)) ([650a355](https://github.com/stenciljs/core/commit/650a3554873edbec6693d27e0f3e66e2756d3b09))
* **runtime:** narrow onInput & onCapture event type ([#3135](https://github.com/stenciljs/core/issues/3135)) ([38198f7](https://github.com/stenciljs/core/commit/38198f786082e112f37f3c181467c7b286c9b41c))

### Features

* **api** remove `sys` parameter from `parseFlags` public API ([#3489](https://github.com/stenciljs/core/pull/3489)) ([674bf51](https://github.com/stenciljs/core/commit/674bf51ebc31269263dcc53549527142cb841be2))
* **cli:** update configuration flag defaults for V3 ([#3502](https://github.com/stenciljs/core/issues/3502)) ([c78dd20](https://github.com/stenciljs/core/commit/c78dd20aa4765e1acb775da72c28991f7de2aa36))
* **compiler:** remove inlineDynamicImports from custom elements targets ([#3897](https://github.com/stenciljs/core/issues/3897)) ([238b267](https://github.com/stenciljs/core/commit/238b26775449103567354b6e3a5eff3fd46678cb))
* **compiler:** export custom types in compiled output ([#3710](https://github.com/stenciljs/core/issues/3710)) ([509869c](https://github.com/stenciljs/core/commit/509869c592f8e847e4b98ed2b20e424105ac6593))
* **compiler** remove deprecated assetsDir field ([#3341](https://github.com/stenciljs/core/issues/3341)) ([6074a29](https://github.com/stenciljs/core/commit/6074a2909428849e717b73e5bd6946b220539c48))
* **e2e:** add support for puppeteer v19 ([#3810](https://github.com/stenciljs/core/issues/3810)) ([0c3bb50](https://github.com/stenciljs/core/commit/0c3bb50fe8d8ca6f52e2da8b48a5ce3605b24a1d))
* **node:** drop node 12 support ([#3302](https://github.com/stenciljs/core/issues/3302)) ([cb1f5fc](https://github.com/stenciljs/core/commit/cb1f5fc71132cfb6ac0637e202e6b23436441f70))
* **output_targets:** remove legacy angular target ([#3493](https://github.com/stenciljs/core/issues/3493)) ([9916612b](https://github.com/stenciljs/core/commit/3b480c62cac18ecbf719e6df1fcf69fbd96c931d))
* **output_targets:** remove `dist-custom-elements-bundle` ([#3579](https://github.com/stenciljs/core/pull/3579)) ([9916612](https://github.com/stenciljs/core/commit/9916612b8bdb10b3020a0385f8b57256264cfc64))
* **output_targets:** add `CustomElementExportBehavior` to `dist-custom-elements` ([#3562](https://github.com/stenciljs/core/issues/3562)) ([8158b88](https://github.com/stenciljs/core/commit/8158b88d66b418bf7a8b3ed2cd3eea03d5b24208))
* **output_targets:** add `defineCustomElements` method & signature typedef to `dist-custom-elements` ([#3619](https://github.com/stenciljs/core/issues/3619)) ([1cac95d](https://github.com/stenciljs/core/commit/1cac95d3b0c8af76e25962c217b6051806007dd6))
* **output_targets:** moves `autoDefineCustomElements` to an export behavior for `dist-custom-elements` ([#3615](https://github.com/stenciljs/core/issues/3615)) ([b8ed386](https://github.com/stenciljs/core/commit/b8ed3867c9b7d8f259f60a88b7d62bc89adb443d))
* **runtime:** Support for older browsers, including Internet Explorer 11 and Safari 10, has been marked as deprecated via:
  * mark `dynamicImportShim` as deprecated ([#3895](https://github.com/stenciljs/core/pull/3895)) ([96d39a2](https://github.com/stenciljs/core/commit/96d39a203d2ad163b9c8cce5906d10ef34719b1d))
  * mark `cssVarsShim` as deprecated ([#3894](https://github.com/stenciljs/core/pull/3894)) ([45f90ef](https://github.com/stenciljs/core/commit/45f90ef43e0d93225e35febf4e4f1a2663e0f4da))
  * mark `shadowDomShim` as deprecated ([#3898](https://github.com/stenciljs/core/pull/3898)) ([f67fc6c](https://github.com/stenciljs/core/commit/f67fc6cef81fca4d9daa174ecef155c1c2dfc1ae))
  * mark `safari10` as deprecated ([#3899](https://github.com/stenciljs/core/pull/3899)) ([a380947](https://github.com/stenciljs/core/commit/a3809472335b0f6137e259f364ecd9b7addef04a))
* **testing:** puppeteer v10 support ([#2934](https://github.com/stenciljs/core/pull/2934)) ([09afd3f](https://github.com/stenciljs/core/commit/09afd3fed1ad1c294d6c1677c038287212b721d2))


### BREAKING CHANGES

See [BREAKING_CHANGES.md - v3.0.0](./BREAKING_CHANGES.md#stencil-v300) for a comprehensive list of breaking changes.

See [the v3.0.0 Migration Guide](https://stenciljs.com/docs/introduction/upgrading-to-stencil-three) for a guide to migrate to Stencil v3.0.0.


# 🍀 [3.0.0-rc.1](https://github.com/stenciljs/core/compare/v2.22.2...v3.0.0-rc.1) (2023-01-23)


This release includes all feature and bug fixes from all prior Stencil 3 pre-releases, and syncs the Stencil
`v3.0.0-dev` branch with `main`.


# ⭐️ [3.0.0-rc.0](https://github.com/stenciljs/core/compare/v2.22.1...v3.0.0-rc.0) (2023-01-17)

This release includes all feature and bug fixes from all prior Stencil 3 pre-releases, and as well as all features
included in [Stencil v2.22.1](#-2221--2023-01-17-)


# 🚚 [3.0.0-beta.1](https://github.com/stenciljs/core/compare/v2.21.0...v3.0.0-beta.1) (2023-01-09)


This release includes all feature and bug fixes from all prior Stencil 3 pre-releases, and syncs the Stencil
`v3.0.0-dev` branch with `main`.


# 👑 [3.0.0-beta.0](https://github.com/stenciljs/core/compare/v3.0.0-alpha.2...v3.0.0-beta.0) (2022-12-19)


### Features

* **compiler:** remove inlineDynamicImports from custom elements targets ([#3897](https://github.com/stenciljs/core/issues/3897)) ([90aa4f5](https://github.com/stenciljs/core/commit/90aa4f5a4b73ea12bf0fd527fd622c22d897217b))
* **runtime:** Support for older browsers, including Internet Explorer 11 and Safari 10, has been marked as deprecated via:
  * mark `dynamicImportShim` as deprecated ([#3895](https://github.com/stenciljs/core/pull/3895)) ([5fb32af](https://github.com/stenciljs/core/commit/5fb32afa253d43f48a01b077412f67682e282851))
  * mark `cssVarsShim` as deprecated ([#3894](https://github.com/stenciljs/core/pull/3894)) ([d15972f](https://github.com/stenciljs/core/commit/d15972f0a7347d686262861ff6c0d726dfdb76ff))
  * mark `shadowDomShim` as deprecated ([#3898](https://github.com/stenciljs/core/pull/3898)) ([cea184a](https://github.com/stenciljs/core/commit/cea184aa031a6e9a22c6a690c5824169d7295bce))
  * mark `safari10` as deprecated ([#3899](https://github.com/stenciljs/core/pull/3899)) ([cd0a52d](https://github.com/stenciljs/core/commit/cd0a52d46d6a817eeee3c7fbcabbabcb9bb6ed52))

This release includes all feature and bug fixes from all prior Stencil 3 pre-releases, as well as the following
unreleased Stencil v2 features:

* **compiler:** copy doc block from component to generated types ([#3525](https://github.com/stenciljs/core/issues/3525)) ([2e4b1fc](https://github.com/stenciljs/core/commit/2e4b1fcdc0b3fd41928d27cf9ee525a15b02d617))
* **typescript:** add support for typescript 4.9 ([#3863](https://github.com/stenciljs/core/issues/3863)) ([542c46a](https://github.com/stenciljs/core/commit/542c46a94400246f1b995df0840c918e080a9e57))



# 🐙 [3.0.0-alpha.2](https://github.com/stenciljs/core/compare/v3.0.0-alpha.1...v3.0.0-alpha.2) (2022-12-12)


This release includes all feature and bug fixes from all prior Stencil 3 pre-releases, as well as the following
unreleased Stencil v2 features:

* **compiler:** copy doc block from component to generated types ([#3525](https://github.com/stenciljs/core/issues/3525)) ([2e4b1fc](https://github.com/stenciljs/core/commit/2e4b1fcdc0b3fd41928d27cf9ee525a15b02d617))
* **typescript:** add support for typescript 4.9 ([#3863](https://github.com/stenciljs/core/issues/3863)) ([542c46a](https://github.com/stenciljs/core/commit/542c46a94400246f1b995df0840c918e080a9e57))



# 🎷 [3.0.0-alpha.1](https://github.com/stenciljs/core/compare/v2.20.0...v3.0.0-alpha.1) (2022-12-05)


### Features

* **e2e:** add support for puppeteer v19 ([#3810](https://github.com/stenciljs/core/issues/3810)) ([22c7424](https://github.com/stenciljs/core/commit/22c74241ebb471123680d6629d7fa9c17b86c897))


### Miscellaneous

This release includes all feature and bug fixes from
- Prior Stencil 3 pre-releases
- [Stencil v2.20.0](https://github.com/stenciljs/core/releases/tag/v2.20.0) and below


# ☕️ [3.0.0-alpha.0](https://github.com/stenciljs/core/compare/v2.19.3...v3.0.0-alpha.0) (2022-11-28)


### Bug Fixes

* **compiler:** fix 'destroy' callback naming ([#3289](https://github.com/stenciljs/core/issues/3289)) ([b733e79](https://github.com/stenciljs/core/commit/b733e79743948a063275fe93bd49e02101cea532))
* **declarations:** correct event handler names for composition events ([#3777](https://github.com/stenciljs/core/issues/3777)) ([4d6a842](https://github.com/stenciljs/core/commit/4d6a842bd1330d4b9857ab4bc77b82db92c77fe1))
* **runtime:** type autocapitalize property as a string ([#3692](https://github.com/stenciljs/core/issues/3692)) ([2cec0a6](https://github.com/stenciljs/core/commit/2cec0a61c50f2831f9000059ab33968c235f7326))
* **runtime:** narrow onInput & onCapture event type ([#3135](https://github.com/stenciljs/core/issues/3135)) ([8316a62](https://github.com/stenciljs/core/commit/8316a62f5767639e3b70661a0d6b902c9e6daf0b))


### Features

* **api** remove `sys` parameter from `parseFlags` public API ([#3489](https://github.com/stenciljs/core/pull/3489) ([b5db83c](https://github.com/stenciljs/core/commit/b5db83cfe933c6bfbe47aa7d1bd2b131f14f5a23)))
* **cli:** update configuration flag defaults for V3 ([#3502](https://github.com/stenciljs/core/issues/3502)) ([7241968](https://github.com/stenciljs/core/commit/72419685e993935380349be27e4ed1fd9fac9d8b))
* **compiler:** export custom types in compiled output ([#3710](https://github.com/stenciljs/core/issues/3710)) ([e52489e](https://github.com/stenciljs/core/commit/e52489e5851f06d742bf243c553490313ccf1321))
* **compiler** remove deprecated assetsDir field ([#3341](https://github.com/stenciljs/core/issues/3341)) ([eb61f89](https://github.com/stenciljs/core/commit/eb61f896baade0d22e04298624dd32d2886173a8))
* **node:** drop node 12 support ([#3302](https://github.com/stenciljs/core/issues/3302)) ([72779d9](https://github.com/stenciljs/core/commit/72779d9c31318c70bce99cabb8aec14e0a088493))
* **output_targets:** remove legacy angular target ([#3493](https://github.com/stenciljs/core/issues/3493)) ([62bacc8](https://github.com/stenciljs/core/commit/62bacc8733669b5305a81f2c4676af9df33afb77))
* **output_targets:** remove `dist-custom-elements-bundle` ([#3579](https://github.com/stenciljs/core/pull/3579)) ([3c97c0f](https://github.com/stenciljs/core/commit/3c97c0f61142dcb4d2d0dcfa92766493a0f307d3))
* **output_targets:** add `CustomElementExportBehavior` to `dist-custom-elements` ([#3562](https://github.com/stenciljs/core/issues/3562)) ([c9a9366](https://github.com/stenciljs/core/commit/c9a936637acbf8a3244cd4266e1559f458bae19e))
* **output_targets:** add `defineCustomElements` method & signature typedef to `dist-custom-elements` ([#3619](https://github.com/stenciljs/core/issues/3619)) ([7521e17](https://github.com/stenciljs/core/commit/7521e17c9b106dda60debfd02d80b9e90328e9ce))
* **output_targets:** moves `autoDefineCustomElements` to an export behavior for `dist-custom-elements` ([#3615](https://github.com/stenciljs/core/issues/3615)) ([6b60ef3](https://github.com/stenciljs/core/commit/6b60ef34f0de17cf9328c30bd0cd004fb0ce0995))
* **testing:** puppeteer v10 support ([#2934](https://github.com/stenciljs/core/issues/2934)) ([0c09aaa](https://github.com/stenciljs/core/commit/0c09aaacca8a1164e254edc58a7cc0357fb42fde))
* **testing:** update puppeteer supported version ranges ([#3321](https://github.com/stenciljs/core/issues/3321)) ([81ab42f](https://github.com/stenciljs/core/commit/81ab42fb0152250c245fb7bde33b65ce875d9f8f))


### BREAKING CHANGES

See [BREAKING_CHANGES.md - v3.0.0](./BREAKING_CHANGES.md#stencil-v300) for a comprehensive list of breaking changes.

See [the v3.0.0 Migration Guide](https://stenciljs.com/docs/introduction/upgrading-to-stencil-three) for a guide to migrate to Stencil v3.0.0.



## 🎆 [2.22.3](https://github.com/stenciljs/core/compare/v2.22.2...v2.22.3) (2023-03-14)


### Bug Fixes

* **compiler:** use file system polling events in watch mode ([#4147](https://github.com/stenciljs/core/issues/4147)) ([7f3d514](https://github.com/stenciljs/core/commit/7f3d514c5a12e6563e315a834329da40026dd538)), fixes [#3952](https://github.com/stenciljs/core/issues/3952), [#4011](https://github.com/stenciljs/core/issues/4011), [#4044](https://github.com/stenciljs/core/issues/4044)


## 🎈 [2.22.2](https://github.com/stenciljs/core/compare/v2.22.1...v2.22.2) (2023-01-23)


### Bug Fixes

* **runtime:** workaround for performance slowing in Chrome 109 ([#3995](https://github.com/stenciljs/core/issues/3995)) ([6544422](https://github.com/stenciljs/core/commit/65444226303bf2ccb678576b4fb57b4df35e0a18))



## ✈️ [2.22.1](https://github.com/stenciljs/core/compare/v2.21.0...v2.22.1) (2023-01-17)


### Note

v2.22.0 was never published to NPM, nor GitHub. The team had originally intended to release v2.22.0 on 2023.01.17.
However, the publish attempt occurred during an NPM outage (unbeknown to the team). The result of this outage left the
package 'marked' as published, although the publish did not succeed. v2.22.1 is identical to the version that the
Stencil team originally intended to release as v2.22.0.


### Features

* **runtime:** support for CSP nonces ([#3823](https://github.com/stenciljs/core/issues/3823), [#3955](https://github.com/stenciljs/core/issues/3955)) ([c91ed48](https://github.com/stenciljs/core/commit/c91ed48ddef36e77b3e7f0c26a47e527ce6b9dd6))



# 🍟 [2.21.0](https://github.com/stenciljs/core/compare/v2.20.0...v2.21.0) (2023-01-04)


### Features

* **compiler:** copy doc block from component to generated types ([#3525](https://github.com/stenciljs/core/issues/3525)) ([2e4b1fc](https://github.com/stenciljs/core/commit/2e4b1fcdc0b3fd41928d27cf9ee525a15b02d617))
* **typescript:** add support for typescript 4.9 ([#3863](https://github.com/stenciljs/core/issues/3863)) ([542c46a](https://github.com/stenciljs/core/commit/542c46a94400246f1b995df0840c918e080a9e57))


### Thanks

🎉 Thanks for @jgroth for their contributions! 🎉


# 🍁 [2.20.0](https://github.com/stenciljs/core/compare/v2.19.3...v2.20.0) (2022-12-05)


### Bug Fixes

* **cli:** ensure that argument order is correct for Jest ([#3827](https://github.com/stenciljs/core/issues/3827)) ([eb44060](https://github.com/stenciljs/core/commit/eb440602d79396eebbf3f8a509f60f3e03417440))


### Features

* **typescript:** support typescript 4.8 ([#3743](https://github.com/stenciljs/core/issues/3743)) ([8fa35f2](https://github.com/stenciljs/core/commit/8fa35f2e12a5da09cf28e7b92103675164957d08))


### Thanks

🎉 Thanks for @PengBoUESTC for their contributions! 🎉


## 🌏 [2.19.3](https://github.com/stenciljs/core/compare/v2.19.2...v2.19.3) (2022-11-15)


### Bug Fixes

* **cli:** refactor CLI argument parser ([#3765](https://github.com/stenciljs/core/issues/3765)) ([d34c4f2](https://github.com/stenciljs/core/commit/d34c4f24c27493197caeb2548a0652ef574f2be2)), closes [#3712](https://github.com/stenciljs/core/issues/3712)
* **generate:** prevent type error when existing task ([#3793](https://github.com/stenciljs/core/issues/3793)) ([f553fde](https://github.com/stenciljs/core/commit/f553fdeaf256e02f084bd64b4329e77e634965a8))


### Thanks

🎉 Thanks for @PengBoUESTC and @boahc077 for their contributions! 🎉


## 🍋 [2.19.2](https://github.com/stenciljs/core/compare/v2.19.2-0...v2.19.2) (2022-10-27)


### Bug Fixes

* **compiler:** account for an existing constructor in convert-decorators ([#3776](https://github.com/stenciljs/core/issues/3776)) ([7c92dbf](https://github.com/stenciljs/core/commit/7c92dbfe5888529619898ff7ed42d690a54d6eb5)), closes [#3773](https://github.com/stenciljs/core/issues/3773)



## 🌵 [2.19.2-0](https://github.com/stenciljs/core/compare/v2.19.1...v2.19.2-0) (2022-10-27)


### Bug Fixes

* **compiler:** account for an existing constructor in convert-decorators ([#3776](https://github.com/stenciljs/core/issues/3776)) ([7c92dbf](https://github.com/stenciljs/core/commit/7c92dbfe5888529619898ff7ed42d690a54d6eb5)), closes [#3773](https://github.com/stenciljs/core/issues/3773)



## 📻 [2.19.1](https://github.com/stenciljs/core/compare/v2.19.1-0...v2.19.1) (2022-10-26)


### Bug Fixes

* **docs:** avoid duplicating manual documentation ([#3766](https://github.com/stenciljs/core/issues/3766)) ([82d3596](https://github.com/stenciljs/core/commit/82d359673f65c87ff89980beb2f118b6169698ff)), closes [#3762](https://github.com/stenciljs/core/issues/3762)



## 🐺 [2.19.1-0](https://github.com/stenciljs/core/compare/v2.19.0...v2.19.1-0) (2022-10-25)


### Bug Fixes

* **docs:** avoid duplicating manual documentation ([#3766](https://github.com/stenciljs/core/issues/3766)) ([82d3596](https://github.com/stenciljs/core/commit/82d359673f65c87ff89980beb2f118b6169698ff)), closes [#3762](https://github.com/stenciljs/core/issues/3762)



# 💾 [2.19.0](https://github.com/stenciljs/core/compare/v2.18.1...v2.19.0) (2022-10-24)


### Bug Fixes

* **cli:** "Browserslist: caniuse-lite is outdated" spams output when buildEs5 is truthy ([#3649](https://github.com/stenciljs/core/issues/3649)) ([d30cf58](https://github.com/stenciljs/core/commit/d30cf5800c22d77d93bd68d9139877f89d524263))
* **compiler:** update handling of decorators to support emitting ES2022+ ([#3614](https://github.com/stenciljs/core/issues/3614)) ([f977830](https://github.com/stenciljs/core/commit/f97783029274f9ee5ea58ba74ab15905c5113c93))
* **jest:** adjust conversion of CLI args to Jest args ([#3730](https://github.com/stenciljs/core/issues/3730)) ([5b76a0a](https://github.com/stenciljs/core/commit/5b76a0a90527b290420506036efbbb7c8e8451a4)), closes [#3724](https://github.com/stenciljs/core/issues/3724)


### Features

* **docs-readme:** add overview to readme ([#3635](https://github.com/stenciljs/core/issues/3635)) ([2db4f4d](https://github.com/stenciljs/core/commit/2db4f4de62c9547ccafb1d382130fcf82fd9ebf4))


## 😛 [2.18.1](https://github.com/stenciljs/core/compare/v2.18.0...v2.18.1) (2022-10-03)


### Bug Fixes

* **cli:** typo in telemetry command ([#3602](https://github.com/stenciljs/core/issues/3602)) ([3013f5e](https://github.com/stenciljs/core/commit/3013f5e9b03bf48db5c70472e7b4a3f89c444bfc))
* **logger:** fix possibly-null property access in logger-typescript.ts ([#3627](https://github.com/stenciljs/core/issues/3627)) ([49ead11](https://github.com/stenciljs/core/commit/49ead1172b60385868a61ba958bb8bc8cb2fb15c)), partially fixes [#3443](https://github.com/stenciljs/core/issues/3443)



# 🔥 [2.18.0](https://github.com/stenciljs/core/compare/v2.17.4...v2.18.0) (2022-09-12)


### Bug Fixes

* **collection:** properly transform imports ([#3523](https://github.com/stenciljs/core/issues/3523)) ([ac2c09e](https://github.com/stenciljs/core/commit/ac2c09e41ab1dee497a695e93b01ff434334883c))


### Features

* **loader:** add private field to loader's package.json ([#3566](https://github.com/stenciljs/core/issues/3566)) ([fc8efb3](https://github.com/stenciljs/core/commit/fc8efb3ae6f3aac50c2a7f6dc0d4283d37b27a2c))
* **typescript:** add support for typescript v4.7 ([#3530](https://github.com/stenciljs/core/issues/3530)) ([1226e56](https://github.com/stenciljs/core/commit/1226e56169af916862e9f50e7fe35d6fac96d881))



## 🐞 [2.17.4](https://github.com/stenciljs/core/compare/v2.17.3...v2.17.4) (2022-08-22)


### Bug Fixes

* **compiler:** don't break HMR by mangling CSS ([#3517](https://github.com/stenciljs/core/issues/3517)) ([f5b2b69](https://github.com/stenciljs/core/commit/f5b2b69c23de044825fccb054610a52a345415e4)), closes [#3461](https://github.com/stenciljs/core/issues/3461)
* **task:** consider config sys in task runner ([#3518](https://github.com/stenciljs/core/issues/3518)) ([103ec60](https://github.com/stenciljs/core/commit/103ec6098a5367d0de26450e1010bddb7ae8e890)), closes [#3510](https://github.com/stenciljs/core/issues/3510)



## 🌭 [2.17.3](https://github.com/stenciljs/core/compare/v2.17.2...v2.17.3) (2022-08-02)


### Bug Fixes

* **validation:** update module location suggestion ([#3508](https://github.com/stenciljs/core/issues/3508)) ([9ccde5e](https://github.com/stenciljs/core/commit/9ccde5e5b693e564326f6c3f1104a7e3ebf1d1b1)), closes [#3507](https://github.com/stenciljs/core/issues/3507)



## 🍤 [2.17.2](https://github.com/stenciljs/core/compare/v2.17.2-0...v2.17.2) (2022-08-01)


### Bug Fixes

* **cli:** fix bug with parsing --fooBar=baz type CLI flags  ([#3483](https://github.com/stenciljs/core/issues/3483)) ([65f5275](https://github.com/stenciljs/core/commit/65f5275ea64ba8c733eb959b5cf0c83a271877dc)), closes [#3471](https://github.com/stenciljs/core/issues/3471) [#3481](https://github.com/stenciljs/core/issues/3481)
* **cli:** remove usage of deprecated npm env var from arg parser ([#3486](https://github.com/stenciljs/core/issues/3486)) ([22d9858](https://github.com/stenciljs/core/commit/22d985807587f500124af06a6436985b203fbc42)), closes [#3482](https://github.com/stenciljs/core/issues/3482)
* **compiler:** fix typedef file generated for dist-custom-elements ([#3468](https://github.com/stenciljs/core/issues/3468)) ([854d498](https://github.com/stenciljs/core/commit/854d498840c15c152b003f0ea3e96d98c97a991d))
* **compiler:** update package.json validation for the 'module' field ([#3475](https://github.com/stenciljs/core/issues/3475)) ([47c4ccb](https://github.com/stenciljs/core/commit/47c4ccb032fd0be8927a23187ba6d560a1832b1e))
* **mock-doc:** add missing methods to the element mock ([#3480](https://github.com/stenciljs/core/issues/3480)) ([835e00f](https://github.com/stenciljs/core/commit/835e00fb16073616a07a9d59e9696d4cfec4277b))

### Features

* **mock-doc:** dispatch blur and focus events ([#3449](https://github.com/stenciljs/core/issues/3449)) ([15520b7](https://github.com/stenciljs/core/commit/15520b7066b366078f79be95ccc59d33aeff40d9))

## 🏜 [2.17.2-0](https://github.com/stenciljs/core/compare/v2.17.1...v2.17.2-0) (2022-07-19)


### Bug Fixes

* **compiler:** fix typedef file generated for dist-custom-elements ([#3468](https://github.com/stenciljs/core/issues/3468)) ([854d498](https://github.com/stenciljs/core/commit/854d498840c15c152b003f0ea3e96d98c97a991d))


### Features

* **mock-doc:** dispatch blur and focus events ([#3449](https://github.com/stenciljs/core/issues/3449)) ([15520b7](https://github.com/stenciljs/core/commit/15520b7066b366078f79be95ccc59d33aeff40d9))



## 😊 [2.17.1](https://github.com/stenciljs/core/compare/v2.17.0...v2.17.1) (2022-07-11)


### Bug Fixes

* **cli:** add explicit support for Jest CLI arguments  ([#3444](https://github.com/stenciljs/core/issues/3444)) ([700b3a9](https://github.com/stenciljs/core/commit/700b3a9e010072db293a385eb90e30afc746cbef))
* **compiler:** handle null window.location.origin ([#2813](https://github.com/stenciljs/core/issues/2813)) ([255cd66](https://github.com/stenciljs/core/commit/255cd6619e30e1af738f0690edb9e758871ed950))
* **styles:** ensure styles are applied before paint ([#3452](https://github.com/stenciljs/core/issues/3452)) ([c47cec6](https://github.com/stenciljs/core/commit/c47cec6581d4409e8261b3516b78532b5c49d079))



# 🚂 [2.17.0](https://github.com/stenciljs/core/compare/v2.16.1...v2.17.0) (2022-06-21)


### Features

* **compiler:** export all built components from index.js w/ dist-custom-elements ([ff0e8cc](https://github.com/stenciljs/core/commit/ff0e8cc54e5e68631cd83302d59b19f2626d43cb)), closes [#3368](https://github.com/stenciljs/core/issues/3368)
* **compiler:** update generation of type declaration file w/ dist-custom-elements ([9d3bf15](https://github.com/stenciljs/core/commit/9d3bf154f99abbb6228df5456f318a49f8333362)), closes [#3368](https://github.com/stenciljs/core/issues/3368)
* **mock-doc:** add matrix and tspan props for svgelement ([#3408](https://github.com/stenciljs/core/issues/3408)) ([d3b93c1](https://github.com/stenciljs/core/commit/d3b93c15902215e550f01f8beadbd4b1a40d6244))
* **telemetry:** add stencil config to telemetry object ([#3401](https://github.com/stenciljs/core/issues/3401)) ([9fe3f15](https://github.com/stenciljs/core/commit/9fe3f1589c51e7f7e93777fa8291cb58b75818d2))



## 🎻 [2.16.1](https://github.com/stenciljs/core/compare/v2.16.1-0...v2.16.1) (2022-06-03)

### Bug Fixes

* **config:** fix faulty build output w/ `--esm` flag ([#3404](https://github.com/stenciljs/core/issues/3404)) ([a847a6e](https://github.com/stenciljs/core/commit/a847a6e457685a7b91efd09117503f012f0af5e3))



## 🌸 [2.16.1-0](https://github.com/stenciljs/core/compare/v2.16.0...v2.16.1-0) (2022-06-03)


### Bug Fixes

* **config:** fix faulty build output w/ `--esm` flag ([#3404](https://github.com/stenciljs/core/issues/3404)) ([a847a6e](https://github.com/stenciljs/core/commit/a847a6e457685a7b91efd09117503f012f0af5e3))



# 🎉 [2.16.0](https://github.com/stenciljs/core/compare/v2.15.2...v2.16.0) (2022-05-31)


### Bug Fixes

* **bundler:** prevent vite bundling errors in downstream projects ([#3349](https://github.com/stenciljs/core/issues/3349)) ([4c8d8c0](https://github.com/stenciljs/core/commit/4c8d8c02d4f45047f50a11f55c7e7225c7272ab1))
* **compiler:** prevent double full builds ([#3374](https://github.com/stenciljs/core/issues/3374)) ([267e3dd](https://github.com/stenciljs/core/commit/267e3dd03887eafa7b58f4d4efae9bc833cd6581))
* **mock-doc:** handle children in contains() ([#3363](https://github.com/stenciljs/core/issues/3363)) ([2f8a6c0](https://github.com/stenciljs/core/commit/2f8a6c01b3f32be95fdfd8190d87608116775b79))


### Features

* **compiler:** generate component custom event types with HTML target ([#3296](https://github.com/stenciljs/core/issues/3296)) ([846740f](https://github.com/stenciljs/core/commit/846740fa1f074e401fa20be90d64e87f8db99c88))



## 🎢 [2.15.2](https://github.com/stenciljs/core/compare/v2.15.1...v2.15.2) (2022-05-09)


### Bug Fixes

* **cli:** don't generate files if they would overwrite existing code ([#3326](https://github.com/stenciljs/core/issues/3326)) ([9fc3a44](https://github.com/stenciljs/core/commit/9fc3a44a17f9b97e19ea62b6188d3611bcf2f9d4))
* **sys:** make NodeLazyRequire complain if package versions aren't right ([#3346](https://github.com/stenciljs/core/issues/3346)) ([b7adc33](https://github.com/stenciljs/core/commit/b7adc33fc25956e9562b56edb3ce8a1b671eb53d))
* **sys:** tweak NodeLazyRequire logic around too-high-versions errors ([#3347](https://github.com/stenciljs/core/issues/3347)) ([9bfef1a](https://github.com/stenciljs/core/commit/9bfef1ad4637fe82c349eadbd9153e04417b1337))
* **types:** components.d.ts type resolution for duplicate types ([#3337](https://github.com/stenciljs/core/issues/3337)) ([31eae6e](https://github.com/stenciljs/core/commit/31eae6eb027904163cc52f73eb6811dc98006559))



## 🐼 [2.15.1](https://github.com/stenciljs/core/compare/v2.15.0...v2.15.1) (2022-04-18)


### Bug Fixes

* **mock-doc:** Add missing DOMParser stub to MockWindow ([#3279](https://github.com/stenciljs/core/issues/3279)) ([f88fb2e](https://github.com/stenciljs/core/commit/f88fb2e04ff4f30c926a5795549b2939dcc3b167))
* **tests:** ensure jest respects passed flags ([#3329](https://github.com/stenciljs/core/issues/3329)) ([c6a1d42](https://github.com/stenciljs/core/commit/c6a1d424b31df9c2c3077612545256ce5dcf88e2))



# ⛷ [2.15.0](https://github.com/stenciljs/core/compare/v2.14.2...v2.15.0) (2022-03-28)


### Bug Fixes

* **testing:** handle snapshot filepaths ([#3282](https://github.com/stenciljs/core/issues/3282)) ([d164dba](https://github.com/stenciljs/core/commit/d164dba7d7f7769064716409bd57308e1777e4c0))
* **types:** generate types for dist-custom-elements ([#3270](https://github.com/stenciljs/core/pull/3270)) ([04fb830](https://github.com/stenciljs/core/commit/04fb83090c968010a400cee96b129f067c5cb6f0))



## 😃 [2.14.2](https://github.com/stenciljs/core/compare/v2.14.1...v2.14.2) (2022-03-10)


### Bug Fixes

* **testing:** fix test regex for 'e2e.ts' ([#3277](https://github.com/stenciljs/core/issues/3277)) ([cf42114](https://github.com/stenciljs/core/commit/cf42114edf04520c11421c60673e4f03be22df49))


### Features

* **node:** add warning of future node support ([#3271](https://github.com/stenciljs/core/issues/3271)) ([11e174e](https://github.com/stenciljs/core/commit/11e174edbe7e86a5b8b5110345bef0592c27214b))



## 🐦 [2.14.1](https://github.com/stenciljs/core/compare/v2.14.0...v2.14.1) (2022-03-07)


### Bug Fixes

* **bundling:** allow proper webpack treeshaking ([#3248](https://github.com/stenciljs/core/issues/3248)) ([5dccc85](https://github.com/stenciljs/core/commit/5dccc856cdaf19592d2a08f0f9b945b8bf2c4f7c))
* **renderer:** prevent infinite loops for NaN ([#3254](https://github.com/stenciljs/core/issues/3254)) ([e2d4e16](https://github.com/stenciljs/core/commit/e2d4e1693a6aa253d7cca32649d34dfda78dac8d))
* **testing:** don't run tests against non-test files ([#3237](https://github.com/stenciljs/core/issues/3237)) ([c6fda39](https://github.com/stenciljs/core/commit/c6fda394f256eb3be68a1a6ff2f0c2ef0193958f))



# 💫 [2.14.0](https://github.com/stenciljs/core/compare/v2.13.0...v2.14.0) (2022-02-14)


### Features

* **typescript:** typescript 4.5 support ([#3205](https://github.com/stenciljs/core/issues/3205)) ([806012e](https://github.com/stenciljs/core/commit/806012ebc38f611ccb7a687938af839577c85ea8))



# 🍣 [2.13.0](https://github.com/stenciljs/core/compare/v2.12.1...v2.13.0) (2022-01-24)


### Features

* **mock-doc:** add simple MockEvent#composedPath() impl ([#3204](https://github.com/stenciljs/core/issues/3204)) ([7b47d96](https://github.com/stenciljs/core/commit/7b47d96e1e3c6c821d5c416fbe987646b4cd1551))
* **test:** jest 27 support ([#3189](https://github.com/stenciljs/core/issues/3189)) ([10efeb6](https://github.com/stenciljs/core/commit/10efeb6f74888f05a13a47d8afc00b5e83a3f3db))



## 🍔 [2.12.1](https://github.com/stenciljs/core/compare/v2.12.0...v2.12.1) (2022-01-04)


### Bug Fixes

* **vdom:** properly warn for step attr on input ([#3196](https://github.com/stenciljs/core/issues/3196)) ([7ffc02e](https://github.com/stenciljs/core/commit/7ffc02e5d07b05de45cbaf4f0cce3f3e165b3eb0))


### Features

* **typings:** add optional key and ref to slot elements ([#3177](https://github.com/stenciljs/core/issues/3177)) ([ce27a18](https://github.com/stenciljs/core/commit/ce27a18ba8ecdb2cc5401470747a7e9d91e40a44))


### Reverts

* **ionitron:** holiday triage 2020 ([#3199](https://github.com/stenciljs/core/issues/3199)) ([d95d43e](https://github.com/stenciljs/core/commit/d95d43e3055f3fe45b67be2c068f6072e83482c4)), closes [#3187](https://github.com/stenciljs/core/issues/3187)



# ⛸ [2.12.0](https://github.com/stenciljs/core/compare/v2.11.0...v2.12.0) (2021-12-13)


### Bug Fixes

* **cli:** wait for help task to finish before exiting ([#3160](https://github.com/stenciljs/core/issues/3160)) ([f10cee1](https://github.com/stenciljs/core/commit/f10cee12a8d00e7581fcf13216f01ded46227f49))
* **mock-doc:** make Node.contains() return true for self ([#3150](https://github.com/stenciljs/core/issues/3150)) ([f164407](https://github.com/stenciljs/core/commit/f164407f7463faba7a3c39afca942c2a26210b82))
* **mock-doc:** allow urls as css values ([#2857](https://github.com/stenciljs/core/issues/2857)) ([6faa5f2](https://github.com/stenciljs/core/commit/6faa5f2f196ff786ffc4b818ac09708ba5de9b35))
* **sourcemaps:** do not encode inline sourcemaps ([#3163](https://github.com/stenciljs/core/issues/3163)) ([b2eb083](https://github.com/stenciljs/core/commit/b2eb083306802645ee6e31987917dea942882e46)), closes [#3147](https://github.com/stenciljs/core/issues/3147)


### Features

* **dist-custom-elements-bundle:** add deprecation warning ([#3167](https://github.com/stenciljs/core/issues/3167)) ([c7b07c6](https://github.com/stenciljs/core/commit/c7b07c65265c7d4715f29835632cc6538ea63585))



# 🐌 [2.11.0](https://github.com/stenciljs/core/compare/v2.11.0-0...v2.11.0) (2021-11-22)


### Bug Fixes

* **dist-custom-elements:** add ssr checks ([#3131](https://github.com/stenciljs/core/issues/3131)) ([9a232ea](https://github.com/stenciljs/core/commit/9a232ea368324f49993bd079cfdbc344abd0c69e))


### Features

* **css:** account for escaped ':' in css selectors ([#3087](https://github.com/stenciljs/core/issues/3087)) ([6000681](https://github.com/stenciljs/core/commit/600068168c86dba9ea610b5e8a0dbba00ff4d1f4))



# 🚟 [2.11.0-0](https://github.com/stenciljs/core/compare/v2.10.0...v2.11.0-0) (2021-11-09)


### Bug Fixes

* **dist-custom-elements:** add ssr checks ([#3131](https://github.com/stenciljs/core/issues/3131)) ([9a232ea](https://github.com/stenciljs/core/commit/9a232ea368324f49993bd079cfdbc344abd0c69e))


### Features

* **css:** account for escaped ':' in css selectors ([#3087](https://github.com/stenciljs/core/issues/3087)) ([6000681](https://github.com/stenciljs/core/commit/600068168c86dba9ea610b5e8a0dbba00ff4d1f4))



# 🦁 [2.10.0](https://github.com/stenciljs/core/compare/v2.9.0...v2.10.0) (2021-11-01)


### Bug Fixes

* **compiler:** add delegatesFocus to custom elements targets ([#3117](https://github.com/stenciljs/core/issues/3117)) ([2ffb503](https://github.com/stenciljs/core/commit/2ffb5033e8eacc3eb8c38f6d8e3be4f91d1b1f22))
* **runtime:** prevent unnecessary re-renders when reflecting props ([#3106](https://github.com/stenciljs/core/issues/3106)) ([63dbb47](https://github.com/stenciljs/core/commit/63dbb47a14cc840c8d37f1bf7ce315d306194788))


### Features

* **sourcemap:** enable rfc-3986 urls ([#3100](https://github.com/stenciljs/core/issues/3100)) ([4b2018a](https://github.com/stenciljs/core/commit/4b2018a99de1ecbc155bb1122414bdb36014bed1))
* **typescript:** update to typescript 4.3.5 ([#3103](https://github.com/stenciljs/core/issues/3103)) ([e1d4e66](https://github.com/stenciljs/core/commit/e1d4e66462102f01395da0b092dad66e39b6a858))



# 🚙 [2.9.0](https://github.com/stenciljs/core/compare/v2.9.0-0...v2.9.0) (2021-10-11)


### Bug Fixes

* **docs:** fix docs generation for method return values ([#3064](https://github.com/stenciljs/core/issues/3064)) ([dc2f6fb](https://github.com/stenciljs/core/commit/dc2f6fb64c4a48c2e1247de2c5411c5bcc10dfd4))
* **output-targets:** restore stats output target ([#3030](https://github.com/stenciljs/core/issues/3030)) ([c76dca7](https://github.com/stenciljs/core/commit/c76dca7f2c01e73e1da691e45ba9c009724660d3))
* **preamble:** restore preamble functionality ([#3085](https://github.com/stenciljs/core/issues/3085)) ([39caa8c](https://github.com/stenciljs/core/commit/39caa8cd0ff401c932eda2cc0b664ac533d2330a))
* **test:** attempt to fix flaky prerender test ([#3095](https://github.com/stenciljs/core/issues/3095)) ([16b8ea4](https://github.com/stenciljs/core/commit/16b8ea4dabb22024872a38bc58ba1dcf1c7cc25b))


### Features

* **compiler:** consumer sourcemap support ([#3005](https://github.com/stenciljs/core/issues/3005)) ([bb3bf90](https://github.com/stenciljs/core/commit/bb3bf900884c1cc5904df16f90c1460220c1a717))
* **deno:** remove deno from codebase ([#3067](https://github.com/stenciljs/core/issues/3067)) ([037b228](https://github.com/stenciljs/core/commit/037b228b2ffb62385a15081a84b82a345d55d880))
* **dist-custom-elements:** automatically import and define dependencies ([#3039](https://github.com/stenciljs/core/issues/3039)) ([6987e43](https://github.com/stenciljs/core/commit/6987e4321b9dfd10710aa27a55e53e983e867729))
* **mock-doc:** add pathname to mock anchors ([#3090](https://github.com/stenciljs/core/issues/3090)) ([99428c7](https://github.com/stenciljs/core/commit/99428c79c5202d2ffc9d6961060f105696623d6b))
* **telemetry:** adding yarn 1 support, sanitizing data pre-flight ([#3082](https://github.com/stenciljs/core/issues/3082)) ([07f69cb](https://github.com/stenciljs/core/commit/07f69cb5b232333103cc4edaf3cf96bd36c2e8bc))


# ⚡️ [2.9.0-0](https://github.com/stenciljs/core/compare/v2.8.1...v2.9.0-0) (2021-10-05)


### Bug Fixes

* **docs:** fix docs generation for method return values ([#3064](https://github.com/stenciljs/core/issues/3064)) ([dc2f6fb](https://github.com/stenciljs/core/commit/dc2f6fb64c4a48c2e1247de2c5411c5bcc10dfd4))
* **output-targets:** restore stats output target ([#3030](https://github.com/stenciljs/core/issues/3030)) ([c76dca7](https://github.com/stenciljs/core/commit/c76dca7f2c01e73e1da691e45ba9c009724660d3))
* **preamble:** restore preamble functionality ([#3085](https://github.com/stenciljs/core/issues/3085)) ([39caa8c](https://github.com/stenciljs/core/commit/39caa8cd0ff401c932eda2cc0b664ac533d2330a))


### Features

* **dist-custom-elements:** automatically import and define dependencies ([#3039](https://github.com/stenciljs/core/issues/3039)) ([6987e43](https://github.com/stenciljs/core/commit/6987e4321b9dfd10710aa27a55e53e983e867729))
* **telemetry:** adding yarn 1 support, sanitizing data pre-flight ([#3082](https://github.com/stenciljs/core/issues/3082)) ([07f69cb](https://github.com/stenciljs/core/commit/07f69cb5b232333103cc4edaf3cf96bd36c2e8bc))



## 🐱 [2.8.1](https://github.com/stenciljs/core/compare/v2.8.0...v2.8.1) (2021-09-15)

### Bug Fixes

* **runtime:** textContent for scoped components with slots ([#3047](https://github.com/stenciljs/core/issues/3047)) ([9fc7657](https://github.com/stenciljs/core/commit/9fc76579a3a3e1127ba43b354a572ac40eda3770))

# 🎲 [2.8.0](https://github.com/stenciljs/core/compare/v2.7.1...v2.8.0) (2021-09-01)

### Bug Fixes

* **types:** add referrerPolicy to AnchorHTMLAttributes ([#3006](https://github.com/stenciljs/core/issues/3006)) ([4f7c073](https://github.com/stenciljs/core/commit/4f7c073311192c8601bcedcacc9e8daef2b349e3))
* **docs:** update app-es5-disabled.ts message ([#2993](https://github.com/stenciljs/core/issues/2993)) ([4f7c073](https://github.com/stenciljs/core/commit/a6ebc51fd71a98898d99cde45c9e5a14585a44c7))

### Features

* **compiler:** allow disabling the injected hydration stylesheet ([#2989](https://github.com/stenciljs/core/issues/2989)) ([a3d2928](https://github.com/stenciljs/core/commit/a3d2928dbc31b786aa273020b88f09d107b05474))

## 🐔 [2.7.1](https://github.com/stenciljs/core/compare/v2.7-0...v2.7.1) (2021-08-24)

### Bug Fixes

* **ci:** vendor deno for builds ([#3020](https://github.com/stenciljs/core/issues/3020)) ([6d8a61d](https://github.com/stenciljs/core/commit/6d8a61d166859ca165d85b7c7cea35b99acc53ee))
* **compiler:** solve issue where worker thread didn't have access to fetch ([#3012](https://github.com/stenciljs/core/issues/3012)) ([925d4e9](https://github.com/stenciljs/core/commit/925d4e924264df424c3519f4c0a91b22356a2ea6))
* **telemetry:** handle malformed telemetry tokens ([#3014](https://github.com/stenciljs/core/issues/3014)) ([ff75a47](https://github.com/stenciljs/core/commit/ff75a473279aa7b59d3dadf308566df361c74f71))

## ⛰ [2.7.1-0](https://github.com/stenciljs/core/compare/v2.7.0...v2.7.1-0) (2021-08-24)

### Bug Fixes

* **ci:** vendor deno for builds ([#3020](https://github.com/stenciljs/core/issues/3020)) ([6d8a61d](https://github.com/stenciljs/core/commit/6d8a61d166859ca165d85b7c7cea35b99acc53ee))
* **compiler:** solve issue where worker thread didn't have access to fetch ([#3012](https://github.com/stenciljs/core/issues/3012)) ([925d4e9](https://github.com/stenciljs/core/commit/925d4e924264df424c3519f4c0a91b22356a2ea6))
* **telemetry:** handle malformed telemetry tokens ([#3014](https://github.com/stenciljs/core/issues/3014)) ([ff75a47](https://github.com/stenciljs/core/commit/ff75a473279aa7b59d3dadf308566df361c74f71))

# 🌟 [2.7.0](https://github.com/stenciljs/core/compare/v2.6.0...v2.7.0) (2021-08-19)

### Bug Fixes

* **dev-server:** allow file change events to pass through ([#3001](https://github.com/stenciljs/core/issues/3001)) ([b84dd11](https://github.com/stenciljs/core/commit/b84dd1124e6171cdb6be58f4cc703b2e956b8fc8))
* **dev-server:** allow web server to be run in Docker ([#2973](https://github.com/stenciljs/core/issues/2973)) ([42cdeae](https://github.com/stenciljs/core/commit/42cdeaec424fb053648a5ae97e611a7c58d69788))
* **dev-server:** prevent crash with Safari 15 ([ed173cd](https://github.com/stenciljs/core/commit/ed173cdbbe53342338aa8d6b6fa305fbbf1f74ab))
* **runtime:** prevent watchers from prematurely firing in custom elements build ([#2971](https://github.com/stenciljs/core/issues/2971)) ([8c375bd](https://github.com/stenciljs/core/commit/8c375bd4bc1b55e269db69af542fa404714c9b26))
* **runtime:** prevent shadowing on non-upgraded components ([#2949](https://github.com/stenciljs/core/issues/2949)) ([afbd129](https://github.com/stenciljs/core/commit/afbd129be49d636a09c986e97ae85e3f9cf5080c))
* **testing:** puppeteer v10 support ([#2939](https://github.com/stenciljs/core/issues/2939)) ([09afd3f](https://github.com/stenciljs/core/commit/09afd3fed1ad1c294d6c1677c038287212b721d2))

### Features

* **cli:**  add telemetry and cli features ([#2964](https://github.com/stenciljs/core/issues/2964)) ([1381cc7](https://github.com/stenciljs/core/commit/1381cc7e920d7d9880d046693762b0f2348c8b5d))
* **cli:**  writing and reading the ionic config file ([#2963](https://github.com/stenciljs/core/issues/2963)) ([f981812](https://github.com/stenciljs/core/commit/f981812c3378310a41ce53f3020316321527f62a))

# 🕹 [2.7.0-0](https://github.com/stenciljs/core/compare/v2.6.0...v2.7.0-0) (2021-07-07)

### Bug Fixes

* **runtime:** prevent shadowing on non-upgraded components ([#2949](https://github.com/stenciljs/core/issues/2949)) ([afbd129](https://github.com/stenciljs/core/commit/afbd129be49d636a09c986e97ae85e3f9cf5080c))
* **testing:** puppeteer v10 support ([#2939](https://github.com/stenciljs/core/issues/2939)) ([09afd3f](https://github.com/stenciljs/core/commit/09afd3fed1ad1c294d6c1677c038287212b721d2))

# 📟 [2.6.0](https://github.com/stenciljs/core/compare/v2.6.0-0...v2.6.0) (2021-06-02)

### Features

- **platform:** add setPlatformHelpers() api ([f09abe6](https://github.com/stenciljs/core/commit/f09abe6455887025d508e645e7c8c024a5c42fa2))

## 🛥 [2.5.2](https://github.com/stenciljs/core/compare/v2.5.1...v2.5.2) (2021-03-30)

### Bug Fixes

- worker support for safari ([#2869](https://github.com/stenciljs/core/issues/2869)) ([f91548f](https://github.com/stenciljs/core/commit/f91548fa90da39937a8f7b7320134a2ca8db71e0))

## 🐭 [2.5.1](https://github.com/stenciljs/core/compare/v2.5.0...v2.5.1) (2021-03-25)

### Bug Fixes

- worker transferable work both ways ([#2866](https://github.com/stenciljs/core/issues/2866)) ([46ee1a2](https://github.com/stenciljs/core/commit/46ee1a2520b31636e2f58ea37ced71c852a5d2e8))
- **worker-plugin:** transfer OffscreenCanvas ([#2849](https://github.com/stenciljs/core/issues/2849)) ([969da47](https://github.com/stenciljs/core/commit/969da47ef752cfb74a84f0bb7cea017854205071))

# 🎠 [2.5.0](https://github.com/stenciljs/core/compare/v2.4.0...v2.5.0) (2021-03-22)

### Features

- **dev-server:** provide custom request listener ([eec7651](https://github.com/stenciljs/core/commit/eec7651fa723658c2c8d853dc44b6316709b2317))
- **typescript:** update to typescript 4.2.3 ([50d4afb](https://github.com/stenciljs/core/commit/50d4afbb78a0d1aa50f948031906fd636f0b2e6a))
- **rollup:** update to rollup 2.42.3 ([0af5d6a](https://github.com/stenciljs/core/commit/0af5d6a679432ff9e530098b12ca2341f4c1391a))
- **terser:** update to terser 5.6.1 ([3a480f5](https://github.com/stenciljs/core/commit/3a480f541dbfde6751753cbf0954c62116c4a8ce))
- **autoprefixer:** update to autoprefixer 10.2.5 and postcss 8.2.8 ([9c6f8d5](https://github.com/stenciljs/core/commit/9c6f8d57a024faa258cc188bbba3c74a4d760b91))
- **sizzle:** update to sizzle 2.3.6 ([4f94a13](https://github.com/stenciljs/core/commit/4f94a13cc2b0e6c3cf42de429874773e3481e007))
- **graceful-fs:** update to graceful-fs 4.2.6 ([c15ba1c](https://github.com/stenciljs/core/commit/c15ba1c9267a88abb4b020e8e880f39c5c6d3372))
- **mime-db:** update to mime-db 1.46.0 ([27db7ae](https://github.com/stenciljs/core/commit/27db7ae8f8facc5abc5c92f6868c45bb4b068cc1))
- **open:** update to open 8.0.4 ([0208698](https://github.com/stenciljs/core/commit/0208698cf994a5ed611a2d950faa4e268e5de137))

### Bug Fixes

- **mock-doc:** set document.dir property from document.documentElement ([9a65494](https://github.com/stenciljs/core/commit/9a6549471e4bc48edfb483565505bc6cc15eddc9))

# 📷 [2.4.0](https://github.com/stenciljs/core/compare/v2.3.0...v2.4.0) (2021-01-28)

### Features

- **custom-elements:** enable dist-custom-elements output ([fc70564](https://github.com/stenciljs/core/commit/fc70564b8ab551f19b76b4fc034557d17b86643c))
- **output:** includeGlobalScripts option for custom elements ([e7fa9c8](https://github.com/stenciljs/core/commit/e7fa9c8d175dc1b721c449cdf0efd7b326e91b59))
- **setPlatformOptions:** add setPlatformOptions for ce builds ([12fec21](https://github.com/stenciljs/core/commit/12fec21b2eb270cf2a8c30fa9deb09e8a49da5fd))
- **typescript:** update to typescript 4.1.3 ([adf9c93](https://github.com/stenciljs/core/commit/adf9c93dfed04a91dc4cf29ac5a09eebd523e96c))

* TypeScript 4.1.3
* Rollup 2.35.1
* Terser 5.5.1
* Puppeteer 5.4.2

### Bug Fixes

- **events:** map onFocusIn/Out to correct events ([#2745](https://github.com/stenciljs/core/issues/2745)) ([2dc930f](https://github.com/stenciljs/core/commit/2dc930fdc6b6a64ca99e15edf0fe3b26d129d2e2))
- **vdom:** prevent error for parentless nodes ([#2761](https://github.com/stenciljs/core/issues/2761)) ([a08f3a8](https://github.com/stenciljs/core/commit/a08f3a82b5b472ec605aa07a8df53d976336da44))
- **devserver:** expose startupTimeout ([0046051](https://github.com/stenciljs/core/commit/004605114d7996d1829348d81ee1fef7afcffc0c))
- **runtime:** don't render when crashing ([#2746](https://github.com/stenciljs/core/issues/2746)) ([c91e0c8](https://github.com/stenciljs/core/commit/c91e0c8fd16b4709533c8023b90bd68c43f31b2d))
- **vdom:** hide fallback slot when content present in scoped/non-shadow components ([#2650](https://github.com/stenciljs/core/issues/2650)) ([2ae6f5f](https://github.com/stenciljs/core/commit/2ae6f5f2a2b0950b8d7890e1a3b3b59212dc7540))
- **worker:** update \*?worker declaration ([#2754](https://github.com/stenciljs/core/issues/2754)) ([7b96ada](https://github.com/stenciljs/core/commit/7b96ada03e1cd7bd620f7cde6f36777cd2a5d514))
- **mock-doc:** make MockAttributeMap iterable ([#2788](https://github.com/stenciljs/core/issues/2788)) ([1aa9cae](https://github.com/stenciljs/core/commit/1aa9cae288288f84a85b9e636c09502544431458))
- show warning when immutable props change ([9c18fa0](https://github.com/stenciljs/core/commit/9c18fa0da217be0bd9e28672f2a0b3c9599de2db)), closes [#2433](https://github.com/stenciljs/core/issues/2433)
- **client:** test for presence of replace method of CSSStyleSheet ([#2773](https://github.com/stenciljs/core/issues/2773)) ([67e0ea8](https://github.com/stenciljs/core/commit/67e0ea841985cdc506edd03aef7c5678fe5a0fae))
- **bundles:** add sideEffects false to package ([d3bc9e6](https://github.com/stenciljs/core/commit/d3bc9e67fb806d97aa5b9d57c725fbb0b45a7d85))
- **autoprefixer:** update autoprefixer ([75acfca](https://github.com/stenciljs/core/commit/75acfcab0c3ee767a3f75d17b224f866d0c0e1f9))
- **hydrate:** check for fetch patch ([16a3330](https://github.com/stenciljs/core/commit/16a333014e6f453c5383d7c9e0bcce4ca0aa7362))
- **polyfill:** convert checkIfURLIsSupported to function expression ([#2799](https://github.com/stenciljs/core/issues/2799)) ([f8618d6](https://github.com/stenciljs/core/commit/f8618d6d2db00c3735fbb585843bf8cd7e8eb288))

# ⛵️ [2.3.0](https://github.com/stenciljs/core/compare/v2.2.0...v2.3.0) (2020-11-06)

### Features

- **config:** env ([#2732](https://github.com/stenciljs/core/issues/2732)) ([ab6dff1](https://github.com/stenciljs/core/commit/ab6dff1a55bd746335f3f3cbc33af9a94788c10a))
- **devserver:** dev server startup timeout configurable ([#2719](https://github.com/stenciljs/core/issues/2719)) ([455adb3](https://github.com/stenciljs/core/commit/455adb32662edb2e40dac543842e3896dcb3a08a))
- **jest:** update to jest 26.6.3 ([b6ca680](https://github.com/stenciljs/core/commit/b6ca680428b2b4b776a163f001963424a7b69bc2))
- **rollup:** update to rollup 2.33.1 ([bb1f55e](https://github.com/stenciljs/core/commit/bb1f55e587d965ec7c81cc951b068cb5829f50e3))

### Bug Fixes

- **path:** export win32 ([a536654](https://github.com/stenciljs/core/commit/a536654c58851a59ce07fd32896df24b0d4e96ce))

# 🍉 [2.2.0](https://github.com/stenciljs/core/compare/v2.1.2...v2.2.0) (2020-10-27)

### Bug Fixes

- **prerender:** cache writing hashed assets ([96c44f8](https://github.com/stenciljs/core/commit/96c44f8edf8605c9b474e89a012b462bf1d9de47))
- **prerender:** fix component graph tmp file ([bb9b6a8](https://github.com/stenciljs/core/commit/bb9b6a8f157dd9978b0793a03869490d3cf009ea))

### Features

- **jest:** update to jest 26.6.1 ([aafb1a3](https://github.com/stenciljs/core/commit/aafb1a3f3be6d860b968bcbe9efcf28da9328d79))
- **prerender:** do not inline external styles by default ([044aa96](https://github.com/stenciljs/core/commit/044aa963347aa68be1e5af60fee9c1c9c1f208d7))
- **puppeteer:** update to puppeteer 5.4.1 ([cf8847b](https://github.com/stenciljs/core/commit/cf8847b4da78ed8c1f026a850b9a9e7bf5ee0521))
- **rollup:** update to rollup 2.32.1 ([83236f9](https://github.com/stenciljs/core/commit/83236f9bc3185772c301f0ddbc2cc0663e578d7e))
- **terser:** update to terser 5.3.8 ([46a0207](https://github.com/stenciljs/core/commit/46a0207bac586bc17c3f8e7a7a04c9aa7fd8613b))
- **typescript:** update to typescript 4.0.5 ([0ca07a1](https://github.com/stenciljs/core/commit/0ca07a19e5ea87a14b40b2d592cdef74a350bfae))

## 🍗 [2.1.2](https://github.com/stenciljs/core/compare/v2.1.1...v2.1.2) (2020-10-26)

### Bug Fixes

- **devserver:** fix dev server static data with trailing slash ([d70423d](https://github.com/stenciljs/core/commit/d70423d9c0eac832128adb94adea886988747315))
- **hydrate:** do not add html comments inside inline scripts ([3c16737](https://github.com/stenciljs/core/commit/3c167374f15571e990eb8ff66321a7019ea2c6fe))

## 🎂 [2.1.1](https://github.com/stenciljs/core/compare/v2.1.0...v2.1.1) (2020-10-23)

### Bug Fixes

- **prerender:** fix slot relocation and inline styles ([2af380f](https://github.com/stenciljs/core/commit/2af380f7e5f403ff71998ba6a34ac386e4468cf7))
- **worker:** capture worker errors ([#2709](https://github.com/stenciljs/core/issues/2709)) ([dcd49c0](https://github.com/stenciljs/core/commit/dcd49c0fedad464bd9e482db8fd98ed28f6ebd69))

# 🖍 [2.1.0](https://github.com/stenciljs/core/compare/v2.0.3...v2.1.0) (2020-10-20)

### Features

- TypeScript 4.0.3
- Rollup 2.32.0
- Terser 5.3.7
- Jest 26.6.0
- Puppeteer 5.3.1
- Open 7.3.0
- Node Fetch 2.6.1

* **prerender:** hash assets and add version querystring ([e20c284](https://github.com/stenciljs/core/commit/e20c284d74a3366f8b5c31c11037334e4a138316))
* **prerender:** hash assets in page.state static content ([baeb842](https://github.com/stenciljs/core/commit/baeb842a805972b81ff662e3bb48e7582501c643))
* **prerender:** add buildId, hydrate externals, DOMContentLoaded ([4d49c63](https://github.com/stenciljs/core/commit/4d49c636bb7764c500bc4c87f07a161ea20630a2))
* **prerender:** server-side only bundle modules w/ .server directory ([d8fcb60](https://github.com/stenciljs/core/commit/d8fcb60caedff6ac4a8b166e51f14143abe0c73a))
* **prerender:** write page.state.json data from hydrat
* add setErrorHandler() ([#2704](https://github.com/stenciljs/core/issues/2704)) ([5d2780a](https://github.com/stenciljs/core/commit/5d2780ac98cc046a71f8b766e4ffd4e750c3a903))
* **docs-custom:** add config argument ([#2696](https://github.com/stenciljs/core/issues/2696)) ([d285879](https://github.com/stenciljs/core/commit/d285879ec596f42d1542152d42afa1619e27ff62))
* **sys:** add encoding option to readFile ([99ef518](https://github.com/stenciljs/core/commit/99ef5184e86101ed6695bfc0af3c4e8ee54ecd51))
* **sys:** add sys.generateFileHash() for more efficient file hashing ([d762c6d](https://github.com/stenciljs/core/commit/d762c6d082d6e794eab7697c228c1456a4417f41))
* **dev-server:** add ssr option for dev server for prerending dev ([2574094](https://github.com/stenciljs/core/commit/2574094df12a22fc699c53242cbfbd84ab712801))
* **e2e:** e2e timeout configurable ([8b69731](https://github.com/stenciljs/core/commit/8b69731080efd5febab83620e6624870e4f45dc5)), closes [#2662](https://github.com/stenciljs/core/issues/2662)
* **nodeRequire:** export nodeRequire utility from compiler ([10ea2fb](https://github.com/stenciljs/core/commit/10ea2fbbf291409a16a6a8fe43d54534d0a94878))e builds ([a2c93f6](https://github.com/stenciljs/core/commit/a2c93f6a989bfcc44e07e0a15aa4f8ba284e3f6b))

### Bug Fixes

- **hmr:** reload from changed css import in global styles ([4f8934d](https://github.com/stenciljs/core/commit/4f8934d7f5432c2c06fbd0d6f1a0b3c5ae880a73))
- **runtime:** do regular clone of normal slotting ([#2694](https://github.com/stenciljs/core/issues/2694)) ([602c1e2](https://github.com/stenciljs/core/commit/602c1e2b70dc9980bcd90f726c0045307a8cb942))
- **mock-doc:** set hostname when location is updated ([#2689](https://github.com/stenciljs/core/issues/2689)) ([9598a05](https://github.com/stenciljs/core/commit/9598a05e778538656a233cf02f276084b59d4098))
- **worker:** Build.isDev in worker ([#2702](https://github.com/stenciljs/core/issues/2702)) ([e8ced45](https://github.com/stenciljs/core/commit/e8ced45654b0de41170541d193c0a3bdff77ffcb))
- **dev-server:** clear module cache on ssr reload ([cfd5d39](https://github.com/stenciljs/core/commit/cfd5d39bad4ce2cab431595ae8c8f11d1fabb192))
- **mock-doc:** no indentation w/in whitespace sensitive elements ([46ff715](https://github.com/stenciljs/core/commit/46ff71588e20cd7f0bdc3173e6cdca9b126d05d5))
- **dev-server:** improve exiting dev server process ([eb02517](https://github.com/stenciljs/core/commit/eb025171f327a28de002fa6b73ffffc03ae0f905))
- **e2e:** update to use page.waitForTimeout() ([e48d306](https://github.com/stenciljs/core/commit/e48d30682565c08acd72f791e73319453234b0fb))
- **hydrate:** improve dev server console error ([9cb31a5](https://github.com/stenciljs/core/commit/9cb31a5ee4d24fbbb29e7d78061ce4d47350150a))
- **mock-doc:** do not pretty print whitespace senstive elements ([de0dc65](https://github.com/stenciljs/core/commit/de0dc651f51adefe0a189c4ccb5ba60b1dff456a))
- **mock-doc:** provide mocked global fetch() fn ([8fbc694](https://github.com/stenciljs/core/commit/8fbc694eb46dd8f88b1c65a81091880bcd729f21))
- **types:** do not require @types/node because of puppeteer types ([1a907f7](https://github.com/stenciljs/core/commit/1a907f784f58463cfe52f87518f1a1d38a2908e5))
- **types:** export h() function types ([be20372](https://github.com/stenciljs/core/commit/be2037290f55ac4ac49c128e62fc2468b58082cf))

## 🍮 [2.0.3](https://github.com/stenciljs/core/compare/v2.0.2...v2.0.3) (2020-09-03)

### Bug Fixes

- **watch:** do not rebuild on docs output target file changes ([4529de7](https://github.com/stenciljs/core/commit/4529de75171f6702f3c277208bdb5b85298e9417))

### Features

- **worker:** can import Build from @stencil/core ([3058143](https://github.com/stenciljs/core/commit/30581437481f1375ee267c0e4387f40c66eefa7b))

## 🐡 [2.0.2](https://github.com/stenciljs/core/compare/v2.0.1...v2.0.2) (2020-09-02)

### Bug Fixes

- **prerender:** export Fragment for prerender builds ([142adc8](https://github.com/stenciljs/core/commit/142adc852dc080a3c936d263ba645b6a31c6ad7a))
- **test:** do not build docs from test command ([557b371](https://github.com/stenciljs/core/commit/557b3712f047d789122caf398aed46199c7b41e2))
- **watch:** fix config.watchIgnoredRegex and update w/ RegExp array ([981e0ae](https://github.com/stenciljs/core/commit/981e0aebc5cf2e5fc42b33226dba8c9c2f1c7351))

## 👽 [2.0.1](https://github.com/stenciljs/core/compare/v2.0.0...v2.0.1) (2020-08-31)

### Bug Fixes

- **custom-elements:** update package json module recommendation ([9f29dbd](https://github.com/stenciljs/core/commit/9f29dbda9ab53d892ebf1713856d022103729b78))
- **jest:** update to jest 26.4.2 ([6aeb2f7](https://github.com/stenciljs/core/commit/6aeb2f7a49df1ee96d405f1b0ef004df28791547))
- **rollup:** update to rollup 2.26.8 ([cac6482](https://github.com/stenciljs/core/commit/cac648264a47dc6f014eaa3241df778a4264471a))
- **testing:** use default jest maxConcurrency ([c5d216f](https://github.com/stenciljs/core/commit/c5d216fdf5b0f9e9f6a6f07cca71a4ab9db3d4ff))

### Features

- **cli:** add changlog link to stencil version update message ([5fa5991](https://github.com/stenciljs/core/commit/5fa59915ef7aed7a79f138dbc8d8e2090fdaf6be))

# 🚗 [2.0.0](https://github.com/stenciljs/core/compare/v1.17.3...v2.0.0) (2020-08-31)

In keeping with [Semver](https://semver.org/), Stencil `2.0.0` was released due to changes in the API (mainly from some updates to the config API).

Even though this is a new major version, there are few [BREAKING CHANGES](BREAKING_CHANGES.md), and any changes will be flagged and described by the compiler during development. For the most part, most of the changes are removal of deprecated APIs that have been printing out warning logs for quite some time now.

### TypeScript 4

- **typescript:** bundle typescript ([1973032](https://github.com/stenciljs/core/commit/197303210e76f048b470d3cf91237b015ce3f116))
- **typescript:** update to typescript 4.0.0-beta ([a274e11](https://github.com/stenciljs/core/commit/a274e1149c2da53b224bfba69e0a798c47920417))
- **typescript:** update to typescript 4.0.1-rc ([def2e6b](https://github.com/stenciljs/core/commit/def2e6b8c926c6b4d79ffcfd9bcb4300f82312fa))
- **typescript:** update to typescript 4.0.2 ([f55f0bf](https://github.com/stenciljs/core/commit/f55f0bf7e331d043dbee990b8bd5b7934cbac92b))

The other change is the update to [TypeScript 4](https://devblogs.microsoft.com/typescript/announcing-typescript-4-0/). With Stencil 2, TypeScript will no longer be a `dependency`, but instead included within the Stencil compiler. There are a few advantages to this we'll be experimenting with:

- Faster compiler startup times and overall smaller install size.
- The custom elements build should have a `dependency` of `@stencil/core`, so not having TypeScript as a dependency of `@stencil/core` simplifies the dependency graph for end-users and libraries.
- Drastically simplifies the Stencil compiler by not having to dynamically import TypeScript, which quickly gets complicated since the compiler can work within Node, Deno, web workers and the browser's main thread. By bundling internally many of the complexities are no longer an issue.
- Stencil compiler guaranteed to run with the exact version of TypeScript it was designed with.
- Easier to adjust to breaking changes. For example, TypeScript 4 introduced a few breaking changes, but with this update it made it easier for the compiler to adjust internally.

### Removal of Deprecated APIs

- **assetsDir:** remove deprecated component assetsDir ([b5cba6a](https://github.com/stenciljs/core/commit/b5cba6a2c4f2cd9bc162289bab498355f61f9e10))
- **attr:** remove deprecated prop attr/reflectToAttr ([133dd49](https://github.com/stenciljs/core/commit/133dd49e9fdf3d4cf9bf0de72ce787fddf196a0a))
- **collection:** remove deprecated collection parsing ([1a94d1e](https://github.com/stenciljs/core/commit/1a94d1e19aa58bd3ea9a2fd8b98325101badd4eb))
- **compiler:** remove deprecated compile/compileSync ([58a27d2](https://github.com/stenciljs/core/commit/58a27d2c546f6517aa3a4fd6a6045ce475688cb0))
- **config:** remove deprecated includeSrc/excludeSrc ([c18cb1f](https://github.com/stenciljs/core/commit/c18cb1f608c7c4668b081b94f292d1f8af721641))
- **context:** remove deprecated prop context/connect ([a87b738](https://github.com/stenciljs/core/commit/a87b738782b12e0110cd217bb2d522aa468c4d05))
- **copy:** remove deprecated copy config ([6cf3134](https://github.com/stenciljs/core/commit/6cf313442b4a93a9da5265075223eede8aff4711))
- **docs:** remove deprecated 'docs' type ([043e2d8](https://github.com/stenciljs/core/commit/043e2d8d2f1553926e4051db574a7ddb2437bb2d))
- **experimental-dist-module:** remove deprecated experimental-dist-module ([41189a6](https://github.com/stenciljs/core/commit/41189a6ab0c8e6e65fca86ac16fe843acb22e22b))
- **forceUpdate:** remove deprecated elm.forceUpdate() ([dfc1e59](https://github.com/stenciljs/core/commit/dfc1e593f19e32d37cc9bd2f869512d1b51e0fc0))
- **legacyLoader:** remove deprecated legacy loader ([7480f92](https://github.com/stenciljs/core/commit/7480f9258f6aff17a3035c1531aacc0751d086d8))
- **listen:** remove Listen target: 'parent' option ([ed63707](https://github.com/stenciljs/core/commit/ed6370743a99e0965b62fa3b118215fb26383747))
- **listen:** remove deprecated listen target ([1a3b519](https://github.com/stenciljs/core/commit/1a3b5197103d9f4fbfbfb1972b65743bad936a92))
- **reflectToAttr:** remove deprecated prop reflectToAttr ([6eae6f8](https://github.com/stenciljs/core/commit/6eae6f83085ff084f672e27cdafb8be4483b5eac))
- **prerender:** use internal typescript ([8f0bb51](https://github.com/stenciljs/core/commit/8f0bb516dbe2b143375dc6397d0852543600daa1))
- **test:** do not require typescript for tests ([43c5d98](https://github.com/stenciljs/core/commit/43c5d98dc6bcb495b048de7d8435ff04fc2dad3e))
- **test:** remove deprecated testing configs ([fb8a02b](https://github.com/stenciljs/core/commit/fb8a02b4be0f7214d131e7c228964ca8423c3be0))
- **transpile:** remove deprecated "script" option ([75dfebb](https://github.com/stenciljs/core/commit/75dfebb68659e09a5d2139e4cd16616448ebd122))
- **watch:** remove deprecated PropWillChange/PropDidChange ([fa2b400](https://github.com/stenciljs/core/commit/fa2b400cf36696365487b7c2445ab096ee354e50))

### Removal of `Context`

The `Context` object was originally added in the `0.x.x` versions of Stencil, before ES Modules were widely adopted. Since then we've deprecated it in Stencil 1, and have ported any external libraries off of it. The remaining one was `@stencil/redux`, and we've released `0.2.0` to be used with Stencil 2 (and can also work with Stencil 1). Additionally, now might be a good time to look into using [@stencil/store](https://stenciljs.com/docs/stencil-store) instead.

### Bug Fixes

- **assetsDirs:** allow same destination asset dir copy task ([b6379b3](https://github.com/stenciljs/core/commit/b6379b31da4fe40bf6251d307368d43e7ceee091)), closes [#2615](https://github.com/stenciljs/core/issues/2615)
- **compiler:** normalizePath result from fs.realpathSync ([#2625](https://github.com/stenciljs/core/issues/2625)) ([df83c83](https://github.com/stenciljs/core/commit/df83c8341e4690aee54efaae5e8c527e1b6323b6))
- **dist:** ensure src dts files not emitted still get shipped in dist ([dea56be](https://github.com/stenciljs/core/commit/dea56be32d17d208c5d9456c6de61d93a1606b0d)), closes [#1797](https://github.com/stenciljs/core/issues/1797)
- **dist:** export Components, JSX types from custom-elements build ([abae5d1](https://github.com/stenciljs/core/commit/abae5d1f695647ea04bac66ff4b9ee2b933a102b))
- **Fragment:** fix tsconfig Fragment ([ba0ea8d](https://github.com/stenciljs/core/commit/ba0ea8d3c324c5a8589a1a3c674a369c8f926aa8))
- **exit:** ensure all node processes are destroyed on exit ([73a04c2](https://github.com/stenciljs/core/commit/73a04c2a9d8c7c224b9ca95ea856665c41f3f410))
- **exit:** sys.exit() returns a promise ([208ef8c](https://github.com/stenciljs/core/commit/208ef8c90dd2e65b46823c0420f7c5811bfa3c86))
- **export:** export client runtime from @stencil/core ([4c6cb60](https://github.com/stenciljs/core/commit/4c6cb6099581843fd00a3eb7dddda77c9675f0de))
- **hmr:** fix dev server hmr ([fa480b6](https://github.com/stenciljs/core/commit/fa480b60d1d0867a741506c9aff953c3534c63dc))
- **hydrate:** ensure all timers are cleared ([db1d747](https://github.com/stenciljs/core/commit/db1d7475f81dfb575365c75636eb26c9f7835fed))
- **monorepos:** do not lazy require missing dependencies ([7f739a0](https://github.com/stenciljs/core/commit/7f739a0cac7423e91ac8614206b71894796965d8))
- **parse:** parse decorator shorthand property assignment ([6b9e035](https://github.com/stenciljs/core/commit/6b9e0357c43e155c03d450d5209e87dbe3a92d60))
- **plugin:** ensure external plugin css do not require physical file ([b5a2536](https://github.com/stenciljs/core/commit/b5a2536d0ac40a6ad940c55fcc52c8cdfcfa8b15)), closes [#2622](https://github.com/stenciljs/core/issues/2622)
- **prerender:** flatten hAsync children to resolve promises ([363d258](https://github.com/stenciljs/core/commit/363d2585faa1f0a365f86b564a14440e5777e0cc))
- **prerender:** hAsync only returns promise if it has to ([25a547a](https://github.com/stenciljs/core/commit/25a547a359a4cdb9fde83723497b75c99c11a5cc))
- **safari:** fix safari10 builds ([63f02f8](https://github.com/stenciljs/core/commit/63f02f8fc125a21c0338850ef9060f27a9ebb87b))
- **sys:** set ts.getExecutingFilePath() from stencil sys ([2b21f2d](https://github.com/stenciljs/core/commit/2b21f2d01af313be32310de29f297172a1318b56))
- **taskQueue:** fix "immediate" rendering ([#2630](https://github.com/stenciljs/core/issues/2630)) ([62ea511](https://github.com/stenciljs/core/commit/62ea51121b8b77b9e9122e37657ce4c911538a5d))
- **testing:** add collectCoverageFrom jest parameter ([#2613](https://github.com/stenciljs/core/issues/2613)) ([370a701](https://github.com/stenciljs/core/commit/370a70122789570f80290e6b3ef7683cf00d9b5a))
- **treeshaking:** move environment helpers out of utils ([c9306b9](https://github.com/stenciljs/core/commit/c9306b9f3d359620f10b5a756bd717b1a210a576))
- **ts:** update ts lib default local module path ([16f30bc](https://github.com/stenciljs/core/commit/16f30bcd1db5dec163dbaa7d719a01110b471a32))
- **watch:** fix rebuild components on e2e w/ watch ([7cd28ca](https://github.com/stenciljs/core/commit/7cd28ca3f59d0b13b746bee43597b8255f4d6160)), closes [#2642](https://github.com/stenciljs/core/issues/2642)
- **watch:** hmr scss \_partial reload on file change ([4ffbe4a](https://github.com/stenciljs/core/commit/4ffbe4a23bb971a5878544db1a8b0cc81b896909)), closes [#2205](https://github.com/stenciljs/core/issues/2205)
- **worker:** error passing ([03864f2](https://github.com/stenciljs/core/commit/03864f2ce258df293c4a3ba69fd4f954a9c917a2))

### Features

- **buildEs5:** add "prod" as an option for config.buildEs5 ([1af30a2](https://github.com/stenciljs/core/commit/1af30a2177e6cc920c88c30a6c0c939a73918c1b))
- **dev-server:** single-threaded dev-server for debugging ([cf335e3](https://github.com/stenciljs/core/commit/cf335e312a25335fd3c2cec55278ff74dcdb82e1))
- **runtime:** add jsx Fragment ([#2647](https://github.com/stenciljs/core/issues/2647)) ([f3abee7](https://github.com/stenciljs/core/commit/f3abee768df833308c69e4693a5d2a84af9b6d2e))
- **jest:** update to jest 26.4.0 ([9e3a6a8](https://github.com/stenciljs/core/commit/9e3a6a85cf40ad61bdc687fa047beda30b47f8a4))
- **prerendering:** async h() function ([d6eabb9](https://github.com/stenciljs/core/commit/d6eabb9359ef0f271817426137eb5cacb1b54aac))
- **rollup:** update to rollup 2.26.6 ([6424254](https://github.com/stenciljs/core/commit/6424254e2914c26dfcd06aa8bbcd0f2a2174d9f2))
- **terser:** update to terser 5.1.0 and use its esm build ([4b67c5a](https://github.com/stenciljs/core/commit/4b67c5a229541fcf3ab3d943c4fb2b650a11e80a))
- **terser:** update to terser 5.2.1 ([7582974](https://github.com/stenciljs/core/commit/758297447e512a8d5753ab2c5be950bd6cdc2045))

## ⛱ [1.17.3](https://github.com/stenciljs/core/compare/v1.17.2...v1.17.3) (2020-08-04)

### Bug Fixes

- **build:** dist-custom-elements-bundle types ([#2597](https://github.com/stenciljs/core/issues/2597)) ([7f2f5ad](https://github.com/stenciljs/core/commit/7f2f5ad7ca2ea6f1259721ca853cf029ebc34176)), closes [#2596](https://github.com/stenciljs/core/issues/2596)
- **test:** update module ext order ([79ba207](https://github.com/stenciljs/core/commit/79ba207b595dc43d8740ba26c2a208b7ec1ca232)), closes [#2608](https://github.com/stenciljs/core/issues/2608)

## ☎️ [1.17.2](https://github.com/stenciljs/core/compare/v1.17.1...v1.17.2) (2020-07-28)

### Bug Fixes

- **dev-server:** fix dev client requesting build results ([91564f4](https://github.com/stenciljs/core/commit/91564f4dd954575843273d4437165cb408c735ef))
- **env:** add os.plaform() polyfill ([93b53e2](https://github.com/stenciljs/core/commit/93b53e2119a5d4b4cac28e655c97041106a40048))
- **resolve:** fix ts resolve module for transpile sync ([7e538f4](https://github.com/stenciljs/core/commit/7e538f438b55e52104f0b5398a07e51c6699f589))
- **sys:** node sys prerender applyPrerenderGlobalPatch ([517891d](https://github.com/stenciljs/core/commit/517891d3aabcddf456321a52b9a7d477663da47e))
- **worker:** mock worker instance for hydrate builds ([207ce44](https://github.com/stenciljs/core/commit/207ce44ef319cd4406b8018e53df26fca5b92016))

## 🐚 [1.17.1](https://github.com/stenciljs/core/compare/v1.17.0...v1.17.1) (2020-07-26)

### Bug Fixes

- **bundling:** downgrade `@rollup/plugin-commonjs` ([#2589](https://github.com/stenciljs/core/issues/2589)) ([be1bdd1](https://github.com/stenciljs/core/commit/be1bdd1b06b8512b55f8d29e62627d41859ff7a0))
- Parse5 6.0.1

# 🍩 [1.17.0](https://github.com/stenciljs/core/compare/v1.16.5...v1.17.0) (2020-07-24)

### Features

- **runtime:** ability to hook into creating CustomEvent, so vue binding can lowercase event names ([a2ce019](https://github.com/stenciljs/core/commit/a2ce019d1731c5cee42534fa5c8652e91f6f6cd9))
- **setAssetPath:** customize path of asset base urls ([a06a941](https://github.com/stenciljs/core/commit/a06a9419b23f0f2624226162744d63bd6a8cfcce))
- **dev-server:** pick up scheme and host from forwarding proxy. ([#2492](https://github.com/stenciljs/core/issues/2492)) ([3be1d72](https://github.com/stenciljs/core/commit/3be1d72d2c0e3d9bb1554abde14a03a57efe6ff2))
- Rollup 2.23.0

### Bug Fixes

- **polyfill:** use core-js promise and iife fetch polyfill ([#2443](https://github.com/stenciljs/core/issues/2443)) ([7b7ed0b](https://github.com/stenciljs/core/commit/7b7ed0b94d56f71a218a568e976ed2de1099c350))
- **render:** allow mapping of childNode to functional component ([#2548](https://github.com/stenciljs/core/issues/2548)) ([d0176c9](https://github.com/stenciljs/core/commit/d0176c93b52436289857f4413c1e3685a068af57))
- **resolve:** fix typescript resolve patch ([1ef8097](https://github.com/stenciljs/core/commit/1ef8097ebab16a1475958ab3580c690f767036de))
- **screenshot:** update compare.html in e2e screenshot ([#2585](https://github.com/stenciljs/core/issues/2585)) ([85f6504](https://github.com/stenciljs/core/commit/85f6504bf89a05321a1990f6b4e1244044244fb4))
- **sys:** ensure in-memory sys checks file data ([f7c03c2](https://github.com/stenciljs/core/commit/f7c03c2708aab1953a4536fbd9c3b927ebfb6fcd))
