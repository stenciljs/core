// HTML rendered by the SSR benchmark.

const item = (i) => `
  <bench-item label="Item ${i}" detail="Detail for item ${i}" lines="${i % 3 ? 'full' : 'inset'}">
    <bench-icon slot="start" name="${i % 2 ? 'star' : 'heart'}"></bench-icon>
    <span>Body text ${i}</span>
    <bench-badge slot="end" color="${i % 2 ? 'primary' : 'success'}">${i}</bench-badge>
    <bench-button slot="end" fill="clear" size="small">Open</bench-button>
  </bench-item>`;

const doc = (body) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>SSR benchmark</title></head>
<body>
<bench-app>
  <h1 slot="header">Benchmark</h1>
  ${body}
</bench-app>
</body>
</html>`;

/** The pages `benchmark-ssr.mjs` renders. `fullDocument: false` renders a fragment. */
export const PAGES = {
  fragment: {
    fullDocument: false,
    html: `<bench-card heading="Card"><bench-button color="secondary">Go</bench-button></bench-card>`,
  },
  'list-50': {
    fullDocument: true,
    html: doc(`<bench-list>${Array.from({ length: 50 }, (_, i) => item(i)).join('')}</bench-list>`),
  },
  'kitchen-sink': {
    fullDocument: true,
    html: doc(`
      <bench-card heading="Sign in" subheading="Every form control">
        <bench-input label="Email" type="email" placeholder="you@example.com" required helper-text="We never share it"></bench-input>
        <bench-input label="Password" type="password" required></bench-input>
        <bench-toggle checked>Remember me</bench-toggle>
        <bench-toggle disabled>Disabled</bench-toggle>
        <div slot="footer">
          <bench-button color="primary">Sign in</bench-button>
          <bench-button color="secondary" fill="outline">Cancel</bench-button>
          <bench-button color="danger" fill="clear" href="/help">Help</bench-button>
        </div>
      </bench-card>
      <bench-card heading="Recent">
        <bench-list inset>${Array.from({ length: 10 }, (_, i) => item(i)).join('')}</bench-list>
      </bench-card>
      <bench-card heading="Badges">
        ${['primary', 'success', 'warning'].map((c) => `<bench-badge color="${c}">${c}</bench-badge>`).join('')}
        ${['small', 'default', 'large'].map((s) => `<bench-icon name="chevron" size="${s}"></bench-icon>`).join('')}
      </bench-card>`),
  },
};
