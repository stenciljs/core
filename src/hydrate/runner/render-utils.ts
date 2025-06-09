import type * as d from '../../declarations';

export function normalizeHydrateOptions(inputOpts?: d.HydrateDocumentOptions) {
  const outputOpts: d.HydrateFactoryOptions = Object.assign(
    {
      serializeToHtml: false,
      destroyWindow: false,
      destroyDocument: false,
    },
    inputOpts || {},
  );

  if (typeof outputOpts.clientHydrateAnnotations !== 'boolean') {
    outputOpts.clientHydrateAnnotations = true;
  }

  if (typeof outputOpts.constrainTimeouts !== 'boolean') {
    outputOpts.constrainTimeouts = true;
  }

  if (typeof outputOpts.maxHydrateCount !== 'number') {
    outputOpts.maxHydrateCount = 300;
  }

  if (typeof outputOpts.runtimeLogging !== 'boolean') {
    outputOpts.runtimeLogging = false;
  }

  if (typeof outputOpts.timeout !== 'number') {
    outputOpts.timeout = 15000;
  }

  if (Array.isArray(outputOpts.excludeComponents)) {
    outputOpts.excludeComponents = outputOpts.excludeComponents.filter(filterValidTags).map(mapValidTags);
  } else {
    outputOpts.excludeComponents = [];
  }

  if (Array.isArray(outputOpts.staticComponents)) {
    outputOpts.staticComponents = outputOpts.staticComponents.filter(filterValidTags).map(mapValidTags);
  } else {
    outputOpts.staticComponents = [];
  }

  return outputOpts;
}

function filterValidTags(tag: string) {
  return typeof tag === 'string' && tag.includes('-');
}

function mapValidTags(tag: string) {
  return tag.trim().toLowerCase();
}

export function generateHydrateResults(opts: d.HydrateDocumentOptions) {
  if (typeof opts.url !== 'string') {
    opts.url = `https://hydrate.stenciljs.com/`;
  }

  if (typeof opts.buildId !== 'string') {
    opts.buildId = createHydrateBuildId();
  }
  const results: d.HydrateResults = {
    buildId: opts.buildId,
    diagnostics: [],
    url: opts.url,
    host: null,
    hostname: null,
    href: null,
    pathname: null,
    port: null,
    search: null,
    hash: null,
    html: null,
    httpStatus: null,
    hydratedCount: 0,
    anchors: [],
    components: [],
    imgs: [],
    scripts: [],
    staticData: [],
    styles: [],
    title: null,
  };

  try {
    const url = new URL(opts.url, `https://hydrate.stenciljs.com/`);
    results.url = url.href;
    results.host = url.host;
    results.hostname = url.hostname;
    results.href = url.href;
    results.port = url.port;
    results.pathname = url.pathname;
    results.search = url.search;
    results.hash = url.hash;
  } catch (e) {
    renderCatchError(results, e);
  }

  return results;
}

export const createHydrateBuildId = () => {
  // should be case insensitive because it could be in a URL
  // and shouldn't start with a number cuz we might use it as a js prop
  let chars = 'abcdefghijklmnopqrstuvwxyz';
  let buildId = '';
  while (buildId.length < 8) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    buildId += char;
    if (buildId.length === 1) {
      chars += '0123456789';
    }
  }
  return buildId;
};

export function renderBuildDiagnostic(
  results: d.HydrateResults,
  level: 'error' | 'warn' | 'info' | 'log' | 'debug',
  header: string,
  msg: string,
) {
  const diagnostic: d.Diagnostic = {
    level: level,
    type: 'build',
    header: header,
    messageText: msg,
    relFilePath: undefined,
    absFilePath: undefined,
    lines: [],
  };

  if (results.pathname) {
    if (results.pathname !== '/') {
      diagnostic.header += ': ' + results.pathname;
    }
  } else if (results.url) {
    diagnostic.header += ': ' + results.url;
  }

  results.diagnostics.push(diagnostic);
  return diagnostic;
}

export function renderBuildError(results: d.HydrateResults, msg?: string) {
  return renderBuildDiagnostic(results, 'error', 'Hydrate Error', msg || '');
}

export function renderCatchError(results: d.HydrateResults, err: any) {
  const diagnostic = renderBuildError(results);

  if (err != null) {
    if (err.stack != null) {
      diagnostic.messageText = err.stack.toString();
    } else {
      if (err.message != null) {
        diagnostic.messageText = err.message.toString();
      } else {
        diagnostic.messageText = err.toString();
      }
    }
  }

  return diagnostic;
}
