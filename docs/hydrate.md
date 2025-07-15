# Hydrate Architecture

The Hydrate module enables server-side rendering (SSR) and static site generation (SSG) for Stencil components. It provides a Node.js environment for rendering components to HTML strings with hydration markers.

**Location:** [`src/hydrate/`](../src/hydrate/)

## Architecture Overview

```mermaid
graph TD
    subgraph "Build Time"
        Compiler[Compiler] --> HydrateApp[Hydrate App Bundle]
        Components[Components] --> HydrateApp
    end
    
    subgraph "Runtime"
        Node[Node.js Environment] --> Hydrate[Hydrate Runner]
        Hydrate --> MockDoc[Mock Document]
        Hydrate --> Components2[Component Instances]
        Components2 --> HTML[HTML Output]
    end
    
    subgraph "Client"
        HTML --> Browser[Browser]
        Browser --> Rehydrate[Client Hydration]
        Rehydrate --> Interactive[Interactive Components]
    end
```

## User-Facing API

### Generating the Hydrate App

Users configure the hydrate output target in their `stencil.config.ts`:

```typescript
export const config: Config = {
  outputTargets: [
    {
      type: 'dist-hydrate-script',
      dir: './hydrate',
    },
  ],
};
```

This generates a hydrate module that can be imported in Node.js:

```typescript
import { 
  hydrateDocument, 
  renderToString, 
  streamToString,
  createWindowFromHtml 
} from 'yourpackage/hydrate';
```

### Core User APIs

#### hydrateDocument
Takes a DOM document and returns hydrated HTML:

```typescript
import { hydrateDocument, createWindowFromHtml } from 'yourpackage/hydrate';

export async function hydrateComponents(template: string) {
  const win = createWindowFromHtml(template, Math.random().toString())
  
  const results = await hydrateDocument(win.document, {
    url: 'https://example.com',
    userAgent: 'Node.js',
    cookie: 'session=abc123',
    direction: 'ltr',
    language: 'en',
  });
  
  return results.html;
}
```

#### renderToString
Takes an HTML string and returns hydrated HTML:

```typescript
const results = await renderToString(
  `<my-component name="Test"></my-component>`,
  {
    fullDocument: false,
    prettyHtml: true,
    serializeShadowRoot: 'declarative-shadow-dom',
  }
);

console.log(results.html);
```

#### streamToString
Returns a readable stream for progressive rendering:

```typescript
const stream = streamToString(htmlString, {
  serializeShadowRoot: 'scoped',
  beforeHydrate: (doc) => {
    // Modify document before hydration
  }
});

// Use with Node.js response
stream.pipe(response);
```

### SSR Approaches

Stencil provides two strategies for SSR integration:

#### 1. Compiler Approach (Build-Time)
Used with `@stencil/ssr` package for Vite/Webpack:

```typescript
// vite.config.ts
import { stencilSSR } from '@stencil/ssr';

export default defineConfig({
  plugins: [
    stencilSSR({
      module: import('component-library-react'),
      from: 'component-library-react', 
      hydrateModule: import('component-library/hydrate'),
      serializeShadowRoot: {
        'scoped': ['my-button'],
        default: 'declarative-shadow-dom',
      },
    }),
  ],
});
```

#### 2. Runtime Approach (Next.js Server Components)
Generates separate client and server components:

```typescript
// stencil.config.ts
reactOutputTarget({
  outDir: '../component-library-react/src',
  hydrateModule: 'component-library/hydrate',
  clientModule: 'component-library-react',
});
```

Usage in Next.js:
```typescript
// Import server-optimized component
import { MyComponent } from 'component-library-react/next';

export default function Page() {
  return <MyComponent prop={dynamicValue()} />;
}
```

## Hydrate App Generation

### Build Process

**Location:** [`src/compiler/output-targets/dist-hydrate-script/`](../src/compiler/output-targets/dist-hydrate-script/)

The compiler generates a special hydrate app:

```typescript
// During build
const generateHydrateApp = async (
  config: Config,
  compilerCtx: CompilerCtx,
  buildCtx: BuildCtx
) => {
  const hydrateAppDirPath = path.join(config.packageDir, 'hydrate');
  
  // Bundle all components for Node.js
  const rollupConfig = {
    input: '@hydrate-entry',
    output: {
      format: 'commonjs',
      file: path.join(hydrateAppDirPath, 'index.js')
    },
    plugins: [
      hydratePlatformPlugin(),
      nodeResolve({ preferBuiltins: true }),
      commonjs()
    ]
  };
  
  const bundle = await rollup(rollupConfig);
  await bundle.write(rollupConfig.output);
};
```

### Entry Point

Generated hydrate app exports:

```typescript
// hydrate/index.js
module.exports = {
  hydrateDocument,
  renderToString,
  createWindowFromHtml,
  serializeNodeToHtml
};
```

## Core APIs

### hydrateDocument

**Location:** [`src/hydrate/runner/hydrate-document.ts`](../src/hydrate/runner/hydrate-document.ts)

Hydrates an entire document:

```typescript
export const hydrateDocument = async (
  doc: Document,
  options: HydrateDocumentOptions = {}
): Promise<HydrateResults> => {
  const results: HydrateResults = {
    diagnostics: [],
    url: options.url || doc.location.href,
    title: doc.title,
    components: [],
    anchors: [],
    styles: [],
    scripts: [],
    imgs: []
  };
  
  try {
    // Set up hydration context
    const hydrateContext = createHydrateContext(doc, options);
    
    // Find and hydrate all components
    await hydrateComponents(doc.documentElement, hydrateContext);
    
    // Wait for all async operations
    await waitForComponents(hydrateContext);
    
    // Serialize back to HTML
    results.html = serializeDocumentToString(doc, options);
    
  } catch (e) {
    results.diagnostics.push({
      level: 'error',
      type: 'hydrate',
      header: 'Hydrate Error',
      messageText: e.message
    });
  }
  
  return results;
};
```

### renderToString

**Location:** [`src/hydrate/runner/render-to-string.ts`](../src/hydrate/runner/render-to-string.ts)

Renders a component to HTML string:

```typescript
export const renderToString = async (
  html: string,
  options: RenderToStringOptions = {}
): Promise<RenderToStringResults> => {
  // Create document from HTML
  const doc = createDocument(html);
  
  // Hydrate the document
  const hydrateResults = await hydrateDocument(doc, options);
  
  return {
    html: hydrateResults.html,
    diagnostics: hydrateResults.diagnostics
  };
};
```

## Hydration Process

### Component Discovery

**Location:** [`src/hydrate/runner/hydrate-component.ts`](../src/hydrate/runner/hydrate-component.ts)

Finding components to hydrate:

```typescript
const hydrateComponents = async (
  node: Node,
  context: HydrateContext
) => {
  if (node.nodeType === NODE_TYPE.ElementNode) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    
    if (context.registeredComponents.has(tagName)) {
      // Hydrate this component
      await hydrateComponent(element, context);
    }
    
    // Recursively hydrate children
    for (const child of Array.from(element.childNodes)) {
      await hydrateComponents(child, context);
    }
  }
};
```

### Component Hydration

Server-side component rendering:

```typescript
const hydrateComponent = async (
  element: Element,
  context: HydrateContext
) => {
  const tagName = element.tagName.toLowerCase();
  const Cstr = context.components[tagName];
  
  // Create host reference
  const hostRef = createHostRef(element);
  
  // Add hydration id
  const hydrationId = context.nextHydrationId++;
  element.setAttribute('s-id', hydrationId);
  
  // Create component instance
  const instance = new Cstr();
  hostRef.$lazyInstance$ = instance;
  
  // Run lifecycle
  await initializeComponent(element, hostRef);
  
  // Add to hydration registry
  context.hydratedComponents.set(hydrationId, {
    element,
    instance,
    hostRef
  });
};
```

## Hydration Markers

### Comment Nodes

Markers for client hydration:

```typescript
const addHydrationMarkers = (
  element: Element,
  hydrationId: string
) => {
  // Start marker
  const startComment = element.ownerDocument.createComment(`s:${hydrationId}`);
  element.parentNode.insertBefore(startComment, element);
  
  // End marker
  const endComment = element.ownerDocument.createComment(`e:${hydrationId}`);
  element.parentNode.insertBefore(endComment, element.nextSibling);
  
  // Child markers for slots
  element.childNodes.forEach((child, index) => {
    if (child.nodeType === NODE_TYPE.ElementNode) {
      child.setAttribute('c-id', `${hydrationId}.${index}`);
    }
  });
};
```

### Slot Content

Preserving slotted content:

```typescript
const serializeSlotContent = (
  slot: HTMLSlotElement,
  hydrationId: string
) => {
  const assignedNodes = slot.assignedNodes();
  
  assignedNodes.forEach((node, index) => {
    // Mark original position
    const marker = document.createComment(`t:${hydrationId}.${index}`);
    node.parentNode.insertBefore(marker, node);
  });
};
```

## Async Rendering

### Waiting for Components

Handling async operations:

```typescript
const waitForComponents = async (context: HydrateContext) => {
  const promises: Promise<any>[] = [];
  
  // Collect all pending operations
  context.hydratedComponents.forEach(({ instance }) => {
    if (instance.componentWillLoad) {
      promises.push(instance.componentWillLoad());
    }
  });
  
  // Wait with timeout
  if (promises.length > 0) {
    await Promise.race([
      Promise.all(promises),
      timeout(context.options.timeout || 15000)
    ]);
  }
};
```

### Streaming Support

Progressive hydration:

```typescript
export const renderToStream = (
  html: string,
  options: RenderToStreamOptions
): ReadableStream => {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      const doc = createDocument(html);
      const context = createHydrateContext(doc, options);
      
      // Stream initial HTML
      controller.enqueue(encoder.encode('<!DOCTYPE html>\n'));
      
      // Hydrate and stream components
      await streamComponents(doc.documentElement, context, controller);
      
      controller.close();
    }
  });
};
```

## Prerendering

### Static Site Generation

Generating static pages:

```typescript
export const prerenderPages = async (
  config: PrerenderConfig
): Promise<PrerenderResults> => {
  const results: PrerenderResults = {
    diagnostics: [],
    urls: []
  };
  
  // Start dev server
  const devServer = await startDevServer(config);
  
  // Crawl and render pages
  const crawler = createCrawler(config);
  const urlsToRender = await crawler.discoverUrls(config.entryUrls);
  
  for (const url of urlsToRender) {
    const page = await renderPage(devServer, url, config);
    
    // Write to disk
    await writePage(page, config);
    
    results.urls.push({
      url: page.url,
      filePath: page.filePath
    });
  }
  
  await devServer.close();
  return results;
};
```

### URL Discovery

Finding pages to prerender:

```typescript
const discoverUrls = async (
  entryUrls: string[],
  config: PrerenderConfig
): Promise<Set<string>> => {
  const discovered = new Set<string>(entryUrls);
  const toVisit = [...entryUrls];
  
  while (toVisit.length > 0) {
    const url = toVisit.shift();
    const page = await fetchPage(url);
    
    // Extract links
    const links = extractLinks(page.html);
    
    for (const link of links) {
      if (shouldPrerender(link, config) && !discovered.has(link)) {
        discovered.add(link);
        toVisit.push(link);
      }
    }
  }
  
  return discovered;
};
```

## Performance Optimization

### Component Caching

Reusing component instances:

```typescript
class ComponentCache {
  private cache = new Map<string, ComponentConstructor>();
  
  get(tagName: string): ComponentConstructor {
    if (!this.cache.has(tagName)) {
      const Cstr = loadComponent(tagName);
      this.cache.set(tagName, Cstr);
    }
    return this.cache.get(tagName);
  }
  
  clear() {
    this.cache.clear();
  }
}
```

### Parallel Rendering

Concurrent component hydration:

```typescript
const hydrateComponentsParallel = async (
  elements: Element[],
  context: HydrateContext
) => {
  const chunks = chunkArray(elements, 10);
  
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(element => hydrateComponent(element, context))
    );
  }
};
```

## Client Hydration

### Hydration on Client

Reconnecting server-rendered components:

```typescript
const clientHydrate = (
  elm: HTMLElement,
  cmpMeta: ComponentRuntimeMeta
) => {
  const hydrationId = elm.getAttribute('s-id');
  
  if (hydrationId) {
    // Find server-rendered vdom
    const serverVNode = parseServerVNode(elm, hydrationId);
    
    // Create host ref with existing vdom
    const hostRef = getHostRef(elm);
    hostRef.$vnode$ = serverVNode;
    
    // Mark as hydrated
    hostRef.$flags$ |= HOST_FLAGS.hasHydrated;
  }
};
```

## Configuration

### Hydrate Options

**Location:** [`src/declarations/stencil-public-runtime.ts`](../src/declarations/stencil-public-runtime.ts)

```typescript
interface HydrateDocumentOptions {
  url?: string;
  userAgent?: string;
  cookie?: string;
  referrer?: string;
  direction?: string;
  language?: string;
  buildId?: string;
  clientHydrateAnnotations?: boolean;
  constrainTimeouts?: boolean;
  timeout?: number;
  staticComponents?: string[];
  maxHydrateCount?: number;
  hydrateComponents?: string[];
  excludeComponents?: string[];
}
```

### Prerender Config

**Location:** [`src/declarations/stencil-public-compiler.ts`](../src/declarations/stencil-public-compiler.ts)

```typescript
interface PrerenderConfig {
  entryUrls: string[];
  hydrateOptions?: HydrateDocumentOptions;
  robotsTxt?: (opts: RobotsTxtOpts) => string;
  sitemapXml?: (opts: SitemapXmpOpts) => string;
  baseUrl?: string;
  canonicalUrl?: (url: URL) => string | null;
  crawlUrls?: boolean;
  trailingSlash?: boolean;
  normalizeUrl?: boolean;
  filter?: (url: URL) => boolean;
}
```

## Testing

### Hydrate Testing

```typescript
describe('hydrate', () => {
  it('should render component', async () => {
    const { html } = await renderToString(
      '<my-component name="Test"></my-component>'
    );
    
    expect(html).toContain('s-id="');
    expect(html).toContain('Hello, Test');
  });
  
  it('should handle async components', async () => {
    const { html } = await renderToString(
      '<async-component></async-component>',
      { timeout: 5000 }
    );
    
    expect(html).toContain('Loaded data');
  });
});
```

## Common Issues

### Memory Leaks

**Location:** [`src/hydrate/runner/window-finalize.ts`](../src/hydrate/runner/window-finalize.ts)

Proper cleanup:

```typescript
const cleanup = (context: HydrateContext) => {
  // Clear component instances
  context.hydratedComponents.forEach(({ instance }) => {
    if (instance.disconnectedCallback) {
      instance.disconnectedCallback();
    }
  });
  
  // Clear caches
  context.componentCache.clear();
  context.hydratedComponents.clear();
  
  // Remove global references
  delete global.document;
  delete global.window;
};
```

### Infinite Loops

Preventing render loops:

```typescript
const MAX_HYDRATE_DEPTH = 300;

const hydrateWithDepthCheck = async (
  element: Element,
  context: HydrateContext,
  depth = 0
) => {
  if (depth > MAX_HYDRATE_DEPTH) {
    throw new Error('Maximum hydration depth exceeded');
  }
  
  await hydrateComponent(element, context);
};
```

## User Limitations and Best Practices

### Performance Considerations

When using SSR with Shadow DOM, styles are duplicated for each component instance:

```typescript
// Avoid rendering many instances of components with large styles
// Instead, use scoped mode for frequently used components:
export default stencilSSR({
  serializeShadowRoot: {
    scoped: ['my-button', 'my-icon'], // Render as scoped
    default: 'declarative-shadow-dom'
  },
});
```

### Non-Primitive Parameters

Avoid complex objects in SSR unless using runtime approach:

```typescript
// ❌ Won't work with compiler-based SSR
const menu = generateMenuData();
<MyComponent data={menu} />

// ✅ Use static data or runtime SSR
const menu = { items: ['Home', 'About'] };
<MyComponent data={menu} />
```

### Cross-Component State

Components rendered in SSR shouldn't depend on parent state:

```typescript
// ❌ Child won't have access to parent context in SSR
<ParentComponent>
  <ChildComponent />
</ParentComponent>

// ✅ Pass data explicitly
<ParentComponent>
  <ChildComponent data={parentData} />
</ParentComponent>
```

### Slot Limitations

Slots can be problematic with certain SSR approaches:
- Compiler-based SSR may have issues with complex slot content
- Runtime SSR handles slots better but with performance cost
- Consider using props instead of slots for SSR-heavy components

## Future Improvements

1. **Streaming SSR**: True streaming with Suspense
2. **Partial Hydration**: Hydrate only interactive components  
3. **Edge SSR**: Deploy to edge workers
4. **Component Islands**: Better hydration boundaries
5. **Build-time SSG**: Faster static generation 