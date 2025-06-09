import { buildError, isBoolean, isNumber, isOutputTargetWww, isString, join, normalizePath } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../declarations';

export const validateDevServer = (config: d.ValidatedConfig, diagnostics: d.Diagnostic[]): d.DevServerConfig => {
  if ((config.devServer === null || (config.devServer as any)) === false) {
    return {};
  }

  const { flags } = config;
  const devServer = { ...config.devServer };

  if (flags.address && isString(flags.address)) {
    devServer.address = flags.address;
  } else if (!isString(devServer.address)) {
    devServer.address = '0.0.0.0';
  }

  // default to http for local dev
  let addressProtocol: 'http' | 'https' = 'http';
  if (devServer.address.toLowerCase().startsWith('http://')) {
    devServer.address = devServer.address.substring(7);
    addressProtocol = 'http';
  } else if (devServer.address.toLowerCase().startsWith('https://')) {
    devServer.address = devServer.address.substring(8);
    addressProtocol = 'https';
  }

  devServer.address = devServer.address.split('/')[0];

  // Validate "ping" route option
  if (devServer.pingRoute !== null) {
    let pingRoute = isString(devServer.pingRoute) ? devServer.pingRoute : '/ping';
    if (!pingRoute.startsWith('/')) {
      pingRoute = `/${pingRoute}`;
    }

    devServer.pingRoute = pingRoute;
  }

  // split on `:` to get the domain and the (possibly present) port
  // separately. we've already sliced off the protocol (if present) above
  // so we can safely split on `:` here.
  const addressSplit = devServer.address.split(':');

  const isLocalhost = addressSplit[0] === 'localhost' || !isNaN(addressSplit[0].split('.')[0] as any);

  // if localhost we use 3333 as a default port
  let addressPort: number | undefined = isLocalhost ? 3333 : undefined;

  if (addressSplit.length > 1) {
    if (!isNaN(addressSplit[1] as any)) {
      devServer.address = addressSplit[0];
      addressPort = parseInt(addressSplit[1], 10);
    }
  }

  if (isNumber(flags.port)) {
    devServer.port = flags.port;
  } else if (devServer.port !== null && !isNumber(devServer.port)) {
    if (isNumber(addressPort)) {
      devServer.port = addressPort;
    }
  }

  if (devServer.reloadStrategy === undefined) {
    devServer.reloadStrategy = 'hmr';
  } else if (
    devServer.reloadStrategy !== 'hmr' &&
    devServer.reloadStrategy !== 'pageReload' &&
    devServer.reloadStrategy !== null
  ) {
    const err = buildError(diagnostics);
    err.messageText = `Invalid devServer reloadStrategy "${devServer.reloadStrategy}". Valid configs include "hmr", "pageReload" and null.`;
  }

  if (!isBoolean(devServer.gzip)) {
    devServer.gzip = true;
  }

  if (!isBoolean(devServer.openBrowser)) {
    devServer.openBrowser = true;
  }

  if (!isBoolean(devServer.websocket)) {
    devServer.websocket = true;
  }

  if (flags.ssr) {
    devServer.ssr = true;
  } else {
    devServer.ssr = !!devServer.ssr;
  }

  if (devServer.ssr) {
    const wwwOutput = (config.outputTargets ?? []).find(isOutputTargetWww);
    devServer.prerenderConfig = wwwOutput?.prerenderConfig;
  }

  if (isString(config.srcIndexHtml)) {
    devServer.srcIndexHtml = normalizePath(config.srcIndexHtml);
  }

  if (devServer.protocol !== 'http' && devServer.protocol !== 'https') {
    devServer.protocol = devServer.https ? 'https' : addressProtocol ? addressProtocol : 'http';
  }

  if (devServer.historyApiFallback !== null) {
    if (Array.isArray(devServer.historyApiFallback) || typeof devServer.historyApiFallback !== 'object') {
      devServer.historyApiFallback = {};
    }

    if (!isString(devServer.historyApiFallback.index)) {
      devServer.historyApiFallback.index = 'index.html';
    }

    if (!isBoolean(devServer.historyApiFallback.disableDotRule)) {
      devServer.historyApiFallback.disableDotRule = false;
    }
  }

  if (flags.open === false) {
    devServer.openBrowser = false;
  } else if (flags.prerender && !config.watch) {
    devServer.openBrowser = false;
  }

  let serveDir: string;
  let basePath: string;
  const wwwOutputTarget = (config.outputTargets ?? []).find(isOutputTargetWww);

  if (wwwOutputTarget) {
    const baseUrl = new URL(wwwOutputTarget.baseUrl ?? '', 'http://config.stenciljs.com');
    basePath = baseUrl.pathname;
    serveDir = wwwOutputTarget.appDir ?? '';
  } else {
    basePath = '';
    serveDir = config.rootDir ?? '';
  }

  if (!isString(basePath) || basePath.trim() === '') {
    basePath = `/`;
  }

  basePath = normalizePath(basePath);

  if (!basePath.startsWith('/')) {
    basePath = '/' + basePath;
  }

  if (!basePath.endsWith('/')) {
    basePath += '/';
  }

  if (!isBoolean(devServer.logRequests)) {
    devServer.logRequests = config.logLevel === 'debug';
  }

  if (!isString(devServer.root)) {
    devServer.root = serveDir;
  }

  if (!isString(devServer.basePath)) {
    devServer.basePath = basePath;
  }

  if (isString((devServer as any).baseUrl)) {
    const err = buildError(diagnostics);
    err.messageText = `devServer config "baseUrl" has been renamed to "basePath", and should not include a domain or protocol.`;
  }

  if (!isAbsolute(devServer.root)) {
    devServer.root = join(config.rootDir as string, devServer.root);
  }
  devServer.root = normalizePath(devServer.root);

  if (devServer.excludeHmr) {
    if (!Array.isArray(devServer.excludeHmr)) {
      const err = buildError(diagnostics);
      err.messageText = `dev server excludeHmr must be an array of glob strings`;
    }
  } else {
    devServer.excludeHmr = [];
  }

  if (!config.devMode || config.buildEs5) {
    devServer.experimentalDevModules = false;
  } else {
    devServer.experimentalDevModules = !!devServer.experimentalDevModules;
  }

  return devServer;
};
