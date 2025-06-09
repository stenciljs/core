import open from 'open';

export async function openInBrowser(opts: { url: string }) {
  await open(opts.url);
}
