# Stencil v5 Planning Document

> **Living Document** - This plan will evolve across multiple sessions as we work through the unknowns and refine the approach.

## Vision

Stencil v5 represents a major modernization effort after 10 years of development. The goal is to shed accumulated tech debt, embrace modern tooling, and simplify the architecture while maintaining Stencil's core value proposition: a compiler for building fast, reusable web components.

---

## Major Goals

### 1. 🧪 Remove Integrated Testing (Jest/Puppeteer)
**Status:** Planning

Remove the deeply integrated Jest runners and Puppeteer integration that have constrained Stencil's evolution.

### 2. 🗑️ Remove Legacy Features
**Status:** Planning

- ES5 builds
- CommonJS (internally, potentially keep as output option)
- Ancient browser polyfills
- In-browser compilation

### 3. ⚡ Move to Vite
**Status:** Exploring

Replace the entire custom build infrastructure with Vite - including the scripts/esbuild internal bundling, Rollup component bundling, and custom dev server.

### 4. 📦 Mono-repo Restructure
**Status:** Exploring

Move to a proper mono-repo structure (potentially using Nx or similar). This enables:
- Extracting self-contained pieces into their own packages (e.g., mock-doc)
- Bringing in external output targets that are currently separate repos
- Better separation of concerns
- Independent versioning where appropriate

---

## Current Architecture Analysis

### Build Pipeline (What We Have Now)

```
Source (.tsx)
    ↓
[TypeScript + Custom Transformers]
    ↓
[esbuild] ─── Internal bundling (CLI, compiler, dev-server, testing)
             └── scripts/esbuild/*.ts (TO BE REMOVED)
    ↓
[Rollup + 10+ Custom Plugins] ─── Component bundling
    ↓
[Custom Dev Server + HMR]
    ↓
Output Targets (dist-lazy, dist-custom-elements, etc.)
```

### Key Directories

| Path | Purpose | v5 Impact |
|------|---------|-----------|
| `src/testing/` | Jest/Puppeteer integration | **REMOVE** |
| `src/testing/jest/` | Multi-version Jest support (27-29) | **REMOVE** |
| `src/testing/puppeteer/` | Browser automation | **REMOVE** |
| `src/mock-doc/` | DOM mocking for SSR/hydration | **KEEP** - Move to own package in mono-repo |
| `src/dev-server/` | Custom dev server + HMR | **REPLACE** with Vite |
| `src/client/polyfills/` | ES5/legacy browser polyfills | **REMOVE** |
| `src/compiler/bundle/` | Rollup bundling | **REPLACE** with Vite |
| `scripts/esbuild/` | Internal bundling infrastructure | **REMOVE** - Vite handles this |

---

## Goal 1: Remove Integrated Testing

### Current State

The testing integration is extensive:

```
src/testing/
├── jest/
│   ├── jest-29/           # Jest 29 adapter
│   ├── jest-28/           # Jest 28 adapter
│   ├── jest-27-and-under/ # Legacy Jest adapter
│   ├── jest-apis.ts       # newSpecPage(), newE2EPage()
│   └── jest-stencil-connector.ts
├── puppeteer/
│   ├── puppeteer-browser.ts
│   ├── puppeteer-page.ts
│   ├── puppeteer-element.ts
│   └── ...
└── index.ts
```

### Why It's Problematic

1. **Version lock-in**: Supporting Jest 27-29 simultaneously is maintenance burden
2. **Coupling**: Custom Jest preprocessor reaches deep into compiler internals
3. **Puppeteer fragility**: Browser automation is notoriously flaky
4. **TypeScript on-the-fly**: The Jest preprocessor compiles `.tsx` using Stencil's compiler, creating tight coupling

### The Replacement Packages ✅ AUDITED

We have **two packages** that together fully replace the built-in testing:

| Package | Replaces | Purpose |
|---------|----------|---------|
| `@stencil/vitest` | `newSpecPage()` + Jest | Unit/spec testing (DOM environments) |
| `@stencil/playwright` | `newE2EPage()` + Puppeteer | E2E testing (real browsers) |

**Key Clarification**: Inline testing (compiling TypeScript on-the-fly within tests) is **only used internally by Stencil**, not by end users. This means:
- User migration path is straightforward
- Internal migration is the complex part

---

#### `@stencil/vitest` - Unit/Spec Testing

**Core API:** `render(<my-component />)` returns `{ root, instance, waitForChanges, setProps, spyOnEvent, unmount }`

| Feature | Jest (`@stencil/core`) | Vitest (`@stencil/vitest`) |
|---------|------------------------|----------------------------|
| Component rendering | `newSpecPage()` | `render()` ✅ |
| DOM environments | Fixed (jsdom) | Configurable: mock-doc, jsdom, happy-dom ✅ |
| Event spying | Manual | `spyOnEvent()` + 6 matchers ✅ |
| Custom matchers | 15+ | 19+ ✅ |
| Shadow DOM assertions | ✅ | ✅ (with `<mock:shadow-root>` format) |
| Instance access | Via page methods | Via `instance` property ✅ |
| Props/state changes | Properties + methods | `setProps()` + `waitForChanges()` ✅ |

**Architecture Difference:**
- **Jest (current):** Compiles TypeScript on-the-fly within tests
- **Vitest:** Components pre-compiled by Stencil, then tested

This is *cleaner* - separates build from test, matching production.

**CLI:** `stencil-test` orchestrates Stencil build + Vitest execution

---

#### `@stencil/playwright` - E2E Testing

**Core API:** Extended Playwright with Stencil fixtures

| Feature | Puppeteer (Core) | Playwright (`@stencil/playwright`) |
|---------|------------------|-------------------------------------|
| Browser support | Chrome only | Chrome, Firefox, WebKit ✅ |
| Test runner | Jest | Playwright test runner ✅ |
| Page API | `E2EPage` with find/findAll | Playwright locators ✅ |
| Event spying | `spyOnEvent()` | `page.spyOnEvent()` + `locator.spyOnEvent()` ✅ |
| Matchers | 5 built-in | 5 custom Playwright matchers ✅ |
| Hydration waiting | `waitForChanges()` | `waitForChanges()` ✅ |

**Event Testing:**
```typescript
const spy = await page.spyOnEvent('myEvent');
// ... trigger event ...
expect(spy).toHaveReceivedEvent();
expect(spy).toHaveReceivedEventDetail({ value: 42 });
```

**Config:** `createConfig()` reads `stencil.config.ts` automatically

---

#### Migration Complexity: LOW for Users

```typescript
// Before (Jest + newSpecPage)
const page = await newSpecPage({
  components: [MyButton],
  html: '<my-button>Click</my-button>'
});

// After (Vitest)
const { root } = await render(<my-button>Click</my-button>);
```

```typescript
// Before (Jest + newE2EPage + Puppeteer)
const page = await newE2EPage();
await page.setContent('<my-button>Click</my-button>');

// After (Playwright)
await page.setContent('<my-button>Click</my-button>');
await page.waitForChanges();
```

---

### Open Questions

1. **Migration tooling?**
   - Codemod for `newSpecPage()` → `render()` syntax?
   - Auto-generate `vitest-setup.ts` from stencil.config?

2. **Documentation priority?**
   - Clear migration guide from Jest → Vitest + Playwright

### Proposed Approach

```
Phase 1: Document current test API surface
Phase 2: Audit @stencil/vitest capabilities
Phase 3: Deprecation warnings in v4.x
Phase 4: Remove in v5.0
```

### Internal Test Migration

Since inline testing is internal-only, we need to:

1. Audit which internal tests use `newSpecPage()` / `newE2EPage()`
2. Migrate Stencil's own tests to Vitest
3. This is a prerequisite for removing `src/testing/`

### Files to Remove

```
src/testing/                    # Entire directory
scripts/esbuild/testing.ts      # Build script
testing/                        # Distribution output
```

---

## Goal 2: Remove Legacy Features

### 2.1 ES5 Builds

**Current Implementation:**
- `src/client/polyfills/` - Core polyfills
- `src/compiler/app-core/app-es5-disabled.ts` - Feature flags for ES5
- Output targets generate dual ES5/ES2017+ builds
- `src/client/polyfills/es5-html-element.ts` - IE11 HTMLElement shim

**Impact:**
- Simplifies output targets significantly
- Removes need for dual builds
- Removes complex polyfill injection logic

**Files to Remove:**
```
src/client/polyfills/
src/compiler/app-core/app-es5-disabled.ts
# Plus ES5-related code in output targets
```

**Open Questions:**
1. What's the browser support floor for v5? (ES2020? ES2022?)
2. Do we still need any polyfills for web component APIs?

### 2.2 CommonJS

**Current State:**
- Internal build uses CJS for Node.js entry points
- Output targets support CJS bundles
- Rollup plugins handle CJS interop

**Proposed Change:**
- Internal: Move to pure ESM
- External: Consider keeping CJS output as an option (for users with legacy bundlers)

**Open Questions:**
1. What Node.js version is the floor for v5?
2. Do users need CJS output, or can we drop it entirely?

### 2.3 Ancient Browser Polyfills

**Files to Remove:**
```
src/client/polyfills/system.js    # SystemJS loader
src/client/polyfills/dom.js       # Promise, fetch polyfills
src/client/polyfills/core-js.js   # Core.js integration
```

**Keep (maybe):**
- ResizeObserver polyfill? (Still patchy support)
- Custom Elements polyfill for specific edge cases?

### 2.4 In-Browser Compilation

**Current Implementation:**
- `src/compiler/transpile.ts` - Browser-compatible transpile API
- Bundled TypeScript (~9MB in compiler bundle)
- Used for: playground tools, live editors, REPL experiences

**Why Remove:**
- Massive bundle size impact
- Rare use case
- Modern tools (StackBlitz, CodeSandbox) handle this better

**Open Questions:**
1. Who uses in-browser compilation?
2. Can we provide a separate package for this use case?
3. What about the Stencil playground/documentation?

---

## Goal 3: Move to Vite

### Current Custom Stack (To Be Replaced)

```
┌─────────────────────────────────────────────┐
│ scripts/esbuild/ (REMOVE)                   │
│  - compiler.ts, cli.ts, dev-server.ts       │
│  - internal.ts, mock-doc.ts, etc.           │
│  - Custom build orchestration               │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Custom Dev Server (src/dev-server/) REMOVE  │
│  - HTTP server                              │
│  - WebSocket HMR                            │
│  - Worker thread architecture               │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Rollup Bundling (src/compiler/bundle/)      │
│  - 10+ custom plugins                       │
│  - Component graph analysis                 │
│  - Output target generation                 │
└─────────────────────────────────────────────┘
```

### Proposed Vite Architecture

```
┌─────────────────────────────────────────────┐
│ Vite                                        │
│  - Dev server (built-in)                    │
│  - HMR (built-in)                           │
│  - Rollup bundling (built-in)               │
│  - esbuild transforms (built-in)            │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Stencil Vite Plugin                         │
│  - Component transformations                │
│  - Build conditionals                       │
│  - Output target generation                 │
└─────────────────────────────────────────────┘
```

### What Gets Removed

The entire `scripts/esbuild/` directory:
```
scripts/esbuild/
├── compiler.ts           # REMOVE - Vite handles compiler bundling
├── internal.ts           # REMOVE - Vite handles runtime bundling
├── dev-server.ts         # REMOVE - Vite IS the dev server
├── cli.ts                # REMOVE - Vite handles CLI bundling
├── mock-doc.ts           # REMOVE - Vite handles mock-doc bundling
├── screenshot.ts         # REMOVE
├── sys-node.ts           # REMOVE
├── testing.ts            # REMOVE
├── internal-platform-*.ts # REMOVE
└── utils/                # REMOVE
    ├── options.ts
    ├── banner.ts
    ├── typescript-source.ts
    ├── terser.ts
    └── parse5.ts
```

### Benefits of Vite

1. **Maintained by others**: Dev server, HMR, bundling maintained by Vite team
2. **Ecosystem**: Access to Vite plugin ecosystem
3. **Performance**: Native ESM dev server, optimized builds
4. **Familiarity**: Developers know Vite
5. **Drastically simpler codebase**: Remove 20+ custom build scripts

### Challenges

1. **Custom transformers**: We have complex TypeScript transformers
2. **Build conditionals**: 50+ feature flags that optimize bundles
3. **Output targets**: Multiple output formats (lazy, custom-elements, hydrate)
4. **Component graph**: Dependency analysis for code splitting

### Open Questions

1. **Can Vite plugins handle our transformer complexity?**
   - Need to prototype

2. **How do we preserve build conditionals?**
   - Dead code elimination in Vite/Rollup?
   - Custom plugin approach?

3. **What happens to output targets?**
   - Vite has its own output format opinions
   - Can we still support dist-lazy, dist-custom-elements, etc.?

4. **Migration path?**
   - Gradual adoption or big bang?
   - Can users opt-in during v4.x?

5. **Internal builds?**
   - Does Vite build Stencil itself, or just user projects?
   - Might need Vite for both internal + external

### Prototype Plan

1. Create a minimal Vite plugin that compiles a single Stencil component
2. Validate that transformers work within Vite's plugin API
3. Test HMR behavior with Stencil components
4. Evaluate build output against current Rollup output

---

### Vite Plugin Architecture ✅ DESIGNED

#### What Stencil Is

**Stencil = Web Component Compiler + Runtime**

- **Compiler**: Transforms `@Component` TSX → optimized JS (the transformers)
- **Runtime**: Reactivity, vDOM, lifecycle, lazy loading coordination

The runtime is just JavaScript - Vite/Rollup bundles it like any other dependency. The complexity is in the compiler integration.

#### Two Modes

**Dev Mode (Simple - Per-file)**
```
Request → Vite → transform hook → Stencil compile → Response
```
- Transform each `.tsx` file on-demand as Vite requests it
- Include full runtime (no tree-shaking needed in dev)
- HMR via Vite's built-in system

**Build Mode (Complex - Whole-project)**
```
buildStart → Analyze ALL components → Configure Rollup → Optimized output
```
- `buildStart` hook: Scan all components, build component graph
- Determine which of 50+ features are actually used
- Configure Rollup with build conditionals for tree-shaking
- Generate lazy-loading manifests if needed

#### Plugin Hooks

```typescript
export function stencil(options): Plugin {
  let componentRegistry: Map<string, ComponentMeta>;
  let buildConditionals: BuildConditionals;

  return {
    name: 'vite-plugin-stencil',
    enforce: 'pre',

    // === BUILD MODE: Whole-project analysis ===
    async buildStart() {
      // Scan all .tsx files for @Component
      // Build component graph (which components use which)
      // Determine which runtime features are used
      // Store in buildConditionals for transform phase
    },

    // === DEV + BUILD: Per-file transformation ===
    async transform(code, id) {
      if (!isStencilComponent(code)) return null;

      // In dev: use full runtime, fast compilation
      // In build: apply buildConditionals from analysis phase
      const result = await compileComponent(code, id, buildConditionals);

      return { code: result.code, map: result.map };
    },

    // === BUILD MODE: Output generation ===
    generateBundle(options, bundle) {
      // For lazy output: generate loader manifest
      // For custom-elements: nothing extra needed
    },

    // === DEV MODE: HMR ===
    handleHotUpdate(ctx) {
      // Component changed → re-transform → browser update
    },
  };
}
```

#### What This Replaces

| v4 (Current) | v5 (Vite) |
|--------------|-----------|
| `scripts/esbuild/*` | Vite builds Stencil packages |
| `src/dev-server/` | Vite dev server |
| `src/compiler/bundle/` (Rollup config) | Vite's Rollup |
| Custom HMR | Vite HMR |
| Custom file watcher | Vite watcher |

#### What Stays (Moves Into Plugin)

| Component | Notes |
|-----------|-------|
| `src/compiler/transformers/` | Core compilation - the "secret sauce" |
| `src/runtime/` | Bundled by Vite like any JS dependency |
| Build conditionals logic | Runs in `buildStart`, configures Rollup |
| `src/compiler/sys/in-memory-fs.ts` | Used for user project compilation (until Goal 3 complete) |

### What Gets Replaced Eventually (Goal 3)

When we wire Vite behind `stencil.config.ts` for user projects:

| Component | Replaced By |
|-----------|-------------|
| In-memory FS | Vite's transform pipeline |
| Custom Rollup plugins | Vite plugin hooks |
| File caching | Vite's built-in caching |
| Rollup bundling | Vite's Rollup integration |

**Key insight:** In-memory FS is for compiling USER projects, not building Stencil itself.
- Level 1 (current): Keep it - still needed for user project compilation
- Goal 3 (later): Remove it - Vite handles file transforms for user projects

#### Key Questions to Prototype

| Question | How to Validate |
|----------|-----------------|
| Do transformers work in Vite transform? | Compile a component, verify output |
| Does runtime bundle correctly? | Import @stencil/core, check it's included |
| Can buildStart analyze all components? | Scan project, build feature flags |
| Does lazy loading work with Vite chunks? | Build, verify loader + chunks work |

---

## Goal 4: Mono-repo Restructure

### Current State

Stencil is a single repo with everything bundled together. Several related packages live in separate repositories:
- Output targets (external repos)
- `@stencil/vitest` (external)
- Framework integrations (external)

### Proposed Structure

```
stencil/
├── packages/
│   ├── core/                 # Main Stencil compiler & runtime
│   ├── mock-doc/             # DOM mocking (extracted from src/)
│   ├── cli/                  # CLI package
│   ├── vite-plugin/          # Vite integration
│   │
│   ├── output-angular/       # Angular output target (BRING IN)
│   ├── output-react/         # React output target (BRING IN)
│   ├── output-vue/           # Vue output target (BRING IN)
│   │
│   ├── vitest/               # Vitest integration (BRING IN)
│   └── ...
├── nx.json                   # Or turborepo.json, pnpm workspaces, etc.
└── package.json
```

### Benefits

1. **Self-contained packages**: mock-doc, CLI, etc. can be versioned independently
2. **Consolidated ecosystem**: Output targets in one place
3. **Easier contributions**: Clear boundaries between packages
4. **Shared tooling**: Common build, lint, test configuration
5. **Atomic changes**: Cross-package changes in single PR

### Candidates to Extract

| Current Location | New Package | Notes |
|------------------|-------------|-------|
| `src/mock-doc/` | `@stencil/mock-doc` | Used for SSR, relatively self-contained |
| `src/cli/` | `@stencil/cli` | Could be separate entry point |
| New | `@stencil/vite-plugin` | Core of v5 architecture |

### Candidates to Bring In

| External Repo | New Package | Notes |
|---------------|-------------|-------|
| stencil-ds-output-targets | `@stencil/output-*` | Angular, React, Vue wrappers |
| stencil-test-utils | `@stencil/vitest` | Unit/spec testing |
| stencil-playwright | `@stencil/playwright` | E2E testing |

### Tooling Options

| Tool | Pros | Cons |
|------|------|------|
| **Nx** | Powerful, great caching, good DX | Learning curve, config overhead |
| **Turborepo** | Simple, fast, Vercel backed | Less features than Nx |
| **pnpm workspaces** | Minimal, just workspaces | Manual orchestration |
| **Lerna** | Established, simple | Maintenance concerns |

### Open Questions

1. **Which mono-repo tool?** Nx vs Turborepo vs pnpm workspaces
2. **What to extract first?** mock-doc seems safest
3. **What to bring in first?** Output targets or vitest?
4. **Versioning strategy?** Independent vs synchronized

---

## Unknown Unknowns (To Investigate)

### Testing
- [x] Full audit of `@stencil/vitest` capabilities ✅
- [x] Full audit of `@stencil/playwright` capabilities ✅
- [ ] Internal test migration scope (how many tests use inline compilation?)

### Legacy Removal
- [ ] Browser support floor decision (ES2020? ES2022?)
- [ ] Node.js version floor (18? 20?)
- [ ] Survey of CJS usage in user projects
- [ ] In-browser compilation use cases

### Vite Migration
- [ ] Proof of concept: Stencil component in Vite
- [ ] Transformer compatibility assessment
- [ ] Build conditional preservation strategy
- [ ] Output target compatibility
- [ ] Can Vite build Stencil itself? (replace scripts/esbuild entirely)

### Mono-repo
- [ ] Evaluate Nx vs Turborepo vs alternatives
- [ ] Identify all external repos to consolidate
- [ ] Plan migration order

### General
- [ ] Breaking change inventory
- [ ] Migration guide outline
- [ ] Deprecation timeline for v4.x

---

## Migration Strategy

### For Users

```
v4.x (Current)
  ├── Deprecation warnings for removed features
  ├── Documentation of migration paths
  └── Optional Vite mode (if feasible)

v5.0
  ├── Breaking changes with clear migration guide
  ├── Codemod tooling where possible
  └── New defaults with escape hatches
```

### For Stencil Internal

```
Phase 1: Research & Prototyping
  ├── Audit current architecture ✓
  ├── Prototype Vite integration
  ├── Evaluate mono-repo tools
  └── Document all breaking changes

Phase 2: Infrastructure
  ├── Set up mono-repo structure
  ├── Migrate internal tests to Vitest
  ├── Replace scripts/esbuild with Vite
  └── Extract mock-doc to own package

Phase 3: Consolidation
  ├── Bring in external output targets
  ├── Bring in @stencil/vitest
  └── Remove legacy code paths

Phase 4: Beta
  ├── Public beta for early adopters
  ├── Gather feedback
  └── Iterate on migration tooling

Phase 5: Release
  ├── v5.0 stable release
  └── LTS support for v4.x
```

---

## Files Inventory

### To Remove

| Path | Reason |
|------|--------|
| `src/testing/` | Jest/Puppeteer integration |
| `src/client/polyfills/` | Legacy browser polyfills |
| `src/dev-server/` | Custom dev server (replaced by Vite) |
| `scripts/esbuild/` | Entire internal build infrastructure (replaced by Vite) |

### To Extract (Mono-repo)

| Path | New Package |
|------|-------------|
| `src/mock-doc/` | `@stencil/mock-doc` |
| `src/cli/` | `@stencil/cli` (maybe) |

### To Bring In (Mono-repo)

| External | New Location |
|----------|--------------|
| stencil-ds-output-targets | `packages/output-*` |
| stencil-test-utils | `packages/vitest` |
| stencil-playwright | `packages/playwright` |

### To Modify Heavily

| Path | Changes |
|------|---------|
| `src/compiler/bundle/` | Replace Rollup with Vite |
| `src/compiler/output-targets/` | Adapt for Vite builds |
| `package.json` | Mono-repo root |
| `scripts/build.ts` | Complete rewrite for Vite |

---

## Next Actions

1. [x] **Audit `@stencil/vitest`** - ✅ Complete replacement for unit testing
2. [x] **Audit `@stencil/playwright`** - ✅ Complete replacement for E2E testing
3. [x] **Prototype Vite plugin** - ✅ Works! See `vite-prototype/`
4. [ ] **Level 1: Build Stencil with Vite** - Replace scripts/esbuild with Vite (pure ESM)
   - [ ] **Modernize alias system** - Current aliases are opaque (hard to trace source → output)
5. [ ] **Wire Vite behind stencil.config.ts** - User-facing API stays same
6. [ ] **Evaluate mono-repo tools** - Nx vs Turborepo demo
7. [ ] **Survey internal tests** - Scope of migration
8. [ ] **Decide browser floor** - ES2020 vs ES2022
9. [ ] **Decide Node.js floor** - 18 vs 20 LTS

---

## Session Log

### Session 1 (2026-02-07)
- Created initial planning document
- Analyzed current architecture
- Identified major areas of work
- Documented known unknowns
- Clarified: mock-doc stays (needed for SSR)
- Clarified: Goal is to remove ALL of scripts/esbuild with Vite
- Clarified: Inline testing is internal-only, not user-facing
- Added: Goal 4 - Mono-repo restructure (Nx or similar)
  - Extract self-contained pieces (mock-doc)
  - Bring in external output targets
- **Audited `@stencil/vitest`** (local: `/Users/John.Jenkins/projects/stencil-test-utils`)
  - Provides `render()` API replacing `newSpecPage()`
  - Supports 3 DOM environments: mock-doc, jsdom, happy-dom
  - 19+ custom matchers, event spying, snapshot testing
  - `stencil-test` CLI orchestrates build + test
- **Audited `@stencil/playwright`** (local: `/Users/John.Jenkins/projects/stencil-playwright`)
  - Provides E2E testing replacing `newE2EPage()` + Puppeteer
  - Multi-browser support (Chrome, Firefox, WebKit)
  - `createConfig()` reads stencil.config automatically
  - 5 event matchers, `spyOnEvent()` on page and locators
- **Conclusion**: Testing replacement story is complete for users
  - `@stencil/vitest` → unit/spec tests
  - `@stencil/playwright` → E2E tests
  - Migration complexity: LOW
- **Explored Vite architecture**
  - Analyzed Stencil's TypeScript transformer pipeline (two-phase: decorators→static, static→meta)
  - Researched Vite plugin API (transform hook, buildStart, generateBundle)
  - Clarified: Stencil = WC Compiler + Runtime (not "just a compiler")
  - Runtime bundling is straightforward (Vite/Rollup handles it like any JS)
  - **Two modes identified:**
    - Dev: Per-file transform, full runtime, simple
    - Build: Whole-project analysis first, then optimized output
  - Key complexity: build conditionals (50+ flags) require analyzing ALL components before build
- **Built working Vite prototype** (`vite-prototype/`)
  - Plugin uses `transpile()` in Vite's transform hook
  - Component compiles and loads in browser ✅
  - Runtime bundles correctly via aliases
  - Proved: Vite can replace dev server + bundling
  - Note: Current compiler is CJS, needs `createRequire` workaround
- **Key clarification: User experience stays the same**
  - `stencil.config.ts` still exists (not replaced by vite.config)
  - Output targets work the same
  - Users don't see Vite - it's internal implementation
  - `stencil build` wraps Vite internally

**Next session: Level 1 (build Stencil itself with Vite) or wire prototype behind stencil.config API**

### Session 2 (2026-02-08)

**Level 1: Build Stencil with Vite - STARTED**

**Current Build Infrastructure Audit:**

Stencil currently builds 8 packages using esbuild:
1. **compiler** - Main compiler bundle (`scripts/esbuild/compiler.ts`) ✅ KEEP
2. **cli** - CLI entry point (`scripts/esbuild/cli.ts`) ✅ KEEP
3. **dev-server** - Development server (`scripts/esbuild/dev-server.ts`) ❌ REMOVE (Vite IS the dev server)
4. **internal** - Runtime bundles and internal APIs (`scripts/esbuild/internal.ts`) ✅ KEEP
5. **mock-doc** - DOM mocking library (`scripts/esbuild/mock-doc.ts`) ✅ KEEP (extract to mono-repo later)
6. **screenshot** - Screenshot testing utilities (`scripts/esbuild/screenshot.ts`) ❌ REMOVE
7. **sys-node** - Node.js system APIs (`scripts/esbuild/sys-node.ts`) ✅ KEEP
8. **testing** - Jest/Puppeteer integration (`scripts/esbuild/testing.ts`) ❌ REMOVE (replaced by @stencil/vitest)

**v5 Packages (5 total):**
1. compiler
2. cli  
3. internal
4. mock-doc
5. sys-node

**The Alias Problem:**

Current aliases in `tsconfig.json` map from source → build output:
```typescript
"@stencil/core/compiler": ["src/compiler/index.ts"]  // source
// But at runtime resolved to:
"@stencil/core/compiler": "../compiler/stencil.js"   // build output
```

This is "opaque" because:
- TypeScript sees source paths
- esbuild sees build outputs
- Hard to trace which source file produces which output
- Requires `getEsbuildAliases()` to manually map them

**The Modern Approach (Vite + ESM):**

Use **source-based aliases** that work in both TypeScript and at runtime:
```typescript
// tsconfig.json AND vite.config.ts use same aliases
"@stencil/core/compiler": "src/compiler/index.ts"
```

No translation needed! TypeScript and Vite both resolve to source.

**Level 1 Strategy:**

```
Phase 1: Create Vite build configs (CURRENT)
  ├── vite.config.compiler.ts  - Build compiler package
  ├── vite.config.cli.ts       - Build CLI package (✅ CREATED)
  ├── vite.config.internal.ts  - Build runtime bundles
  ├── vite.config.mock-doc.ts  - Build mock-doc (✅ CREATED)
  └── vite.config.sys-node.ts  - Build sys-node

Phase 2: Modernize tsconfig aliases
  ├── Update paths to point to source (not build/)
  ├── Remove getEsbuildAliases() translation layer
  └── Use Vite's resolve.alias for build-time resolution

Phase 3: Pure ESM
  ├── Remove CommonJS from internal builds
  ├── Update Node.js floor to 18 LTS (ESM support)
  └── Keep CJS as output option for users (compatibility)

Phase 4: Replace scripts/build.ts
  ├── Remove esbuild orchestration
  ├── Use Vite's build API programmatically
  └── Parallel builds with Promise.all()
```

**Key Decisions:**

1. **Node.js floor: 18 LTS** (first version with stable ESM)
2. **Remove testing, dev-server, screenshot packages in v5**
   - testing → replaced by @stencil/vitest + @stencil/playwright
   - dev-server → Vite IS the dev server
   - screenshot → removed completely
3. **Each package = one Vite config** (clean separation)
4. **5 packages total:** compiler, cli, internal, mock-doc, sys-node
5. **Don't bundle TypeScript/terser/parse5** - Use as normal dependencies
   - Saves ~9MB from compiler bundle
   - Simplifies build massively
   - If TypeScript patching needed, use wrapper functions not source modification

**Next Actions:**
- [x] Create vite.config.cli.ts ✅
- [x] Create vite.config.mock-doc.ts ✅
- [x] Create vite.config.sys-node.ts ✅
- [x] Create vite.config.internal.ts ✅
- [x] Create vite.config.internal-client.ts ✅
- [x] Create vite.config.internal-app-data.ts ✅
- [x] Create vite.config.internal-app-globals.ts ✅
- [x] Create vite.config.compiler.ts ✅
- [x] Create build-vite.ts orchestrator ✅
- [x] Create vite.config.internal-hydrate.ts ✅
- [ ] Handle post-build tasks (copy .d.ts files, TypeScript lib files)
- [ ] Update tsconfig.json paths to source-based
- [ ] Test build: `tsc && tsx build-vite.ts`
- [ ] Wire Vite behind user-facing stencil.config.ts API

**Status: All configs complete! ✨**
- 9 Vite configs created:
  - 5 main: cli, mock-doc, sys-node, internal, compiler
  - 4 internal sub-bundles: client, hydrate, app-data, app-globals
- Build orchestrator ready (build-vite.ts)
- Next: Post-build tasks, then test run

**Important distinctions:**
- **Level 1** = Build Stencil itself with Vite (what we're doing now)
- **Goal 3** = Use Vite to compile user projects (later - replaces in-memory FS)

### Session 3 (Continuation - 2026-02-08)

**Level 1 - Major progress!**

✅ **Completed:**
- Created 9 Vite configuration files
- Converted all to pure ESM
- Moved CLI output to bin/ (more modern)
- **Restructured to mono-repo!** 🎉
  - Created `packages/` directory with pnpm workspaces
  - **Simplified to 3 standalone packages** (clean composability!)

**Final mono-repo structure:**
```
packages/
├── core/                @stencil/core (compiler + runtime bundles)
│   ├── vite.config.ts              (main compiler)
│   └── vite-configs/
│       ├── internal.config.ts      (type definitions)
│       ├── client.config.ts        (browser runtime)
│       ├── server.config.ts        (SSR runtime - renamed from hydrate!)
│       ├── app-data.config.ts      (build conditionals)
│       └── app-globals.config.ts   (global state)
├── cli/                 @stencil/cli
└── mock-doc/            @stencil/mock-doc
```

**Package scope:**
- `@stencil/core` - Compiler + all runtime bundles (internal/*)
- `@stencil/cli` - CLI experience (commands, scaffolding)
- `@stencil/mock-doc` - Independent DOM implementation for SSR/testing

**Why this is cleaner:**
- Each package is independently installable/usable
- `sys-node` removed (functionality absorbed into core)
- `internal-*` not separate packages - they're build artifacts OF core
- `hydrate` → `server` (clearer naming!)
- Output targets stay in core for now (can extract later when plugin API stabilizes)

🔑 **Key architectural decisions:**

1. **Don't bundle TypeScript/terser/parse5**
   - Use as normal dependencies instead of bundling source
   - Saves ~9MB from compiler bundle
   - Eliminates complex source patching process

2. **Runtime bundles live in @stencil/core**
   - `internal/*` are build artifacts, not standalone packages
   - Core package has multiple vite configs for different outputs
   - Cleaner than pretending they're independent packages

3. **In-memory FS stays for now**
   - Used for compiling USER projects (not building Stencil itself)
   - Will be replaced in Goal 3 when we wire Vite behind stencil.config.ts

4. **Packages removed in v5**
   - dev-server (Vite IS the dev server)
   - screenshot (removed completely)  
   - testing (replaced by @stencil/vitest + @stencil/playwright)
   - sys-node (absorbed into core)

5. **Pure ESM everywhere** ✅
   - Node 18+ supports ESM natively
   - All Vite configs output ESM only (no CJS)

6. **hydrate → server** (breaking change)
   - `internal/hydrate` → `internal/server`
   - Clearer: it's for SSR/hydration/prerendering (all server-side)

📋 **Status:**
- [x] Installed vite 7.3.1 as dev dependency
- [x] Installed pnpm and set up workspaces
- [x] **Main compiler builds successfully!** (1.2MB output)
  - packages/mock-doc/dist/index.js (339KB)
  - packages/core/dist/index.js (1.2MB)
- [ ] Runtime bundles (internal/*, internal/client, internal/server, etc.)
  - Blocked on circular dependency resolution (@platform/@runtime/@app-data)
  - These need different build strategy or splitting

📋 **Next steps:**
- [ ] Resolve runtime bundle circular dependencies
- [ ] Complete all package builds (cli, runtime bundles)
- [ ] Add post-build tasks (copy .d.ts, generate types)
- [ ] Update tsconfig.json paths (build/ → src/)
- [ ] Update root package.json exports for new structure

**Build structure:**
```
vite.config.cli.ts          → bin/
vite.config.mock-doc.ts     → mock-doc/
vite.config.sys-node.ts     → sys/node/
vite.config.compiler.ts     → compiler/
vite.config.internal.ts     → internal/
vite.config.internal-client.ts     → internal/client/
vite.config.internal-hydrate.ts    → internal/hydrate/
vite.config.internal-app-data.ts   → internal/app-data/
vite.config.internal-app-globals.ts → internal/app-globals/
build-vite.ts (orchestrator)
```

**All configs use pure ESM** ✅

### Session 4 (Continuation - 2026-02-08)

**Pivoting approach: Move code, eliminate aliases**

While debugging the circular dependency issue (@platform/@runtime/@app-data), we realized:
1. Building from `../../../src/` is awkward and error-prone
2. Aliases like `@platform` are **opaque** - hard to trace imports
3. A proper mono-repo should have code IN the packages, not pointing elsewhere

🔑 **New principle: Simplicity is king. No opaque magic.**

**The problem with aliases:**
```typescript
// Current - opaque
import { plt } from '@platform';  // Where does this go? Who knows!

// Better - explicit package import
import { plt } from '@stencil/core/client';  // Clear!
```

**New approach:**
1. **Move source code INTO packages** (not just build configs)
2. **Eliminate internal aliases** (`@platform`, `@runtime`, `@utils`, etc.)
3. **Use real package imports** - pnpm workspaces handles resolution
4. **TypeScript paths only mirror package exports** (for IDE support)

**Migration order:**
1. `@stencil/mock-doc` - Simplest, no internal deps
2. `@stencil/core` - The big one (compiler + runtime)
3. `@stencil/cli` - Depends on core

**Target structure:**
```
packages/
├── mock-doc/
│   ├── src/              ← MOVE src/mock-doc/* here
│   │   ├── index.ts
│   │   ├── document.ts
│   │   └── ...
│   ├── dist/             ← Build output
│   ├── package.json
│   └── vite.config.ts
├── core/
│   ├── src/
│   │   ├── compiler/     ← MOVE src/compiler/*
│   │   ├── runtime/      ← MOVE src/runtime/*
│   │   ├── client/       ← MOVE src/client/*
│   │   ├── declarations/ ← MOVE src/declarations/*
│   │   └── ...
│   ├── dist/
│   │   ├── compiler/
│   │   ├── internal/
│   │   │   ├── client/
│   │   │   ├── server/
│   │   │   ├── app-data/
│   │   │   └── app-globals/
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
└── cli/
    ├── src/              ← MOVE src/cli/*
    ├── dist/
    ├── package.json
    └── vite.config.ts
```

**Package exports (example for @stencil/core):**
```json
{
  "name": "@stencil/core",
  "exports": {
    ".": "./dist/index.js",
    "./compiler": "./dist/compiler/index.js",
    "./internal": "./dist/internal/index.js",
    "./internal/client": "./dist/internal/client/index.js",
    "./internal/server": "./dist/internal/server/index.js",
    "./internal/app-data": "./dist/internal/app-data/index.js",
    "./internal/app-globals": "./dist/internal/app-globals/index.js"
  }
}
```

**Import rewriting needed:**
| Old (alias) | New (package import) |
|-------------|---------------------|
| `@platform` | `@stencil/core/internal/client` |
| `@runtime` | Relative imports within core |
| `@app-data` | `@stencil/core/internal/app-data` |
| `@app-globals` | `@stencil/core/internal/app-globals` |
| `@utils` | Relative imports within core |
| `@stencil/core/mock-doc` | `@stencil/mock-doc` |

**Benefits:**
- No hidden mappings - imports are what they say
- IDE "Go to Definition" works naturally
- Easier onboarding for new contributors
- Clear package boundaries
- Proper mono-repo semantics

📋 **Progress:**
- [x] Move mock-doc source to packages/mock-doc/src/ ✅
- [x] Update mock-doc imports (remove any aliases) ✅
- [x] Build and test mock-doc standalone ✅
- [x] Move core source to packages/core/src/ ✅
- [x] Build and test core ✅
- [x] Move cli source to packages/cli/src/ ✅
- [x] Build and test cli ✅
- [ ] Rewrite alias imports to package imports (deferred - aliases still needed for build)
- [ ] Delete old src/ directories (or keep as reference during transition)
- [ ] Update root tsconfig.json
- [ ] Update package.json exports

### Session 5 (Continuation - 2026-02-08)

**Major milestone: All packages build with Vite!** 🎉

**Build output:**
```
mock-doc:  337.62 kB (53 modules)
core:      883.77 kB (336 modules) + runtime bundles
cli:        56.05 kB (100 modules)
Total:     4.28s
```

**Runtime bundles (packages/core/dist/internal/):**
```
index.js       97.95 kB (45 modules)  - type exports
client/        103.27 kB (54 modules) - browser runtime
server/        185.55 kB (67 modules) - SSR/hydration
app-data/      2.25 kB               - build conditionals
app-globals/   0.13 kB               - global state
```

**What we did:**

1. **Moved source into packages/** (not just configs)
   - packages/mock-doc/src/ ← src/mock-doc/
   - packages/core/src/ ← src/compiler/, runtime/, client/, declarations/, utils/, etc.
   - packages/cli/src/ ← src/cli/

2. **Fixed cross-package dependencies:**
   - mock-doc: Copied hydration constants locally (small duplication, could revisit for shared package)
   - core: Copied config-flags.ts, version.ts, sys/node/ into core (shared between CLI/compiler)
   - cli: Uses aliases to reference core's utils/declarations

3. **Aliases still needed (for now):**
   - `@platform`, `@runtime`, `@utils`, `@app-data`, `@app-globals`
   - These are used heavily in the codebase (~100+ occurrences)
   - TODO: Gradually replace with relative imports for transparency

**Key learnings:**

1. **Circular dependency pattern works** - `@platform` → `src/client` → `@runtime` resolved correctly
2. **Type exports need `export type`** - Rollup can't find interface exports otherwise
3. **SSR builds need `ssr: true`** - Otherwise Vite tries to externalize Node builtins

**Additional cleanup completed:**

4. **Renamed hydrate → server throughout:**
   - `vite.hydrate.config.ts` → `vite.server.config.ts`
   - `internal/hydrate/` → `internal/server/`
   - Updated imports from `../../hydrate/runner/` → `../../server/runner/`
   - Clearer naming: SSR/hydration/prerendering are all "server-side" operations

5. **Flattened Vite configs:**
   - Moved from `packages/core/vite-configs/*.config.ts` to `packages/core/vite.*.config.ts`
   - Each config at package root for easier discovery:
     ```
     packages/core/
     ├── vite.config.ts           (main compiler)
     ├── vite.internal.config.ts  (type exports)
     ├── vite.client.config.ts    (browser runtime)
     ├── vite.server.config.ts    (SSR runtime)
     ├── vite.app-data.config.ts
     └── vite.app-globals.config.ts
     ```

6. **Analyzed sys/node for future removal:**
   - **What it does:** Wraps Node.js APIs (fs, path, os, child_process) in a `CompilerSystem` interface
   - **Why it exists:** Originally for cross-platform support (browser, Node, Deno, Workers)
   - **v5 decision:** Keep for now (deep integration), but target removal in v5
   - **How to remove:** Replace `sys.readFile()` with `fs.promises.readFile()`, etc.
   - This is separate from in-memory-fs (see below)

7. **Clarified in-memory FS vs sys/node:**
   - **sys/node**: Node.js adapter for CompilerSystem interface → remove in v5 by using Node APIs directly
   - **in-memory-fs**: Virtual filesystem for caching during USER project compilation → replaced by Vite's transform pipeline when we wire Vite behind stencil.config.ts (Goal 3)
   - These are different concerns: sys/node wraps Node APIs, in-memory-fs is a caching layer

**Next steps:**
- [ ] Post-build tasks (copy .d.ts files)
- [ ] Set up package.json exports for each package
- [ ] Gradually replace aliases with relative imports
- [ ] Test the built packages actually work!
- [ ] Remove sys/node abstraction layer (v5 target)
- [ ] Wire Vite behind stencil.config.ts (Goal 3 - replaces in-memory-fs)

---

*Last updated: 2026-02-08*
