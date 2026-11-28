/**
 * Dev server utilities and constants.
 * Consolidated from dev-server-constants.ts and dev-server-utils.ts
 */

import type { DevResponseHeaders, HttpRequest, DevServerConfig } from './types';
import type { OutgoingHttpHeaders } from 'node:http';

// =============================================================================
// Constants
// =============================================================================

export const DEV_SERVER_URL = '/~dev-server';
const DEV_MODULE_URL = '/~dev-module';
export const DEV_SERVER_INIT_URL = `${DEV_SERVER_URL}-init`;
const OPEN_IN_EDITOR_URL = `${DEV_SERVER_URL}-open-in-editor`;

// Dev server version - will be injected at build time
export const VERSION = '5.0.0';

// =============================================================================
// Response Headers
// =============================================================================

const DEFAULT_HEADERS: DevResponseHeaders = {
  'cache-control': 'no-cache, no-store, must-revalidate, max-age=0',
  expires: '0',
  date: 'Wed, 1 Jan 2000 00:00:00 GMT',
  server: `Stencil Dev Server ${VERSION}`,
  'access-control-allow-origin': '*',
  'access-control-expose-headers': '*',
};

/**
 * Build response headers with optional HTTP caching.
 *
 * @param headers - custom headers to merge with defaults
 * @param httpCache - whether to enable HTTP caching
 * @returns the combined response headers
 */
export function responseHeaders(
  headers: DevResponseHeaders,
  httpCache = false,
): OutgoingHttpHeaders {
  const result: OutgoingHttpHeaders = { ...DEFAULT_HEADERS, ...headers };
  if (httpCache) {
    result['cache-control'] = 'max-age=3600';
    delete result['date'];
    delete result['expires'];
  }
  return result;
}

// =============================================================================
// URL Utilities
// =============================================================================

/**
 * Build a browser URL from components.
 *
 * @param protocol - the URL protocol (http or https)
 * @param address - the server address
 * @param port - the server port
 * @param basePath - the base path
 * @param pathname - the URL pathname
 * @returns the complete browser URL
 */
export function getBrowserUrl(
  protocol: string,
  address: string,
  port: number,
  basePath: string,
  pathname: string,
): string {
  address = address === '0.0.0.0' ? 'localhost' : address;
  const portSuffix = !port || port === 80 || port === 443 ? '' : ':' + port;

  let path = basePath;
  if (pathname.startsWith('/')) {
    pathname = pathname.substring(1);
  }
  path += pathname;

  protocol = protocol.replace(/:/g, '');

  return `${protocol}://${address}${portSuffix}${path}`;
}

/**
 * Get the URL for the dev server client script.
 *
 * @param devServerConfig - the dev server configuration
 * @param host - optional host override
 * @param protocol - optional protocol override
 * @returns the dev server client URL
 */
export function getDevServerClientUrl(
  devServerConfig: DevServerConfig,
  host: string | undefined,
  protocol: string | undefined,
): string {
  let address = devServerConfig.address!;
  let port: number | null = devServerConfig.port!;

  if (host) {
    address = host;
    port = null;
  }

  return getBrowserUrl(
    protocol ?? devServerConfig.protocol!,
    address,
    port!,
    devServerConfig.basePath!,
    DEV_SERVER_URL,
  );
}

// =============================================================================
// Content Type Detection
// =============================================================================

// Simple content type database - common web file extensions
const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  pdf: 'application/pdf',
  zip: 'application/zip',
  wasm: 'application/wasm',
  map: 'application/json',
  txt: 'text/plain',
  md: 'text/markdown',
  ts: 'text/typescript',
  tsx: 'text/typescript-jsx',
};

/**
 * Get the content type for a file based on its extension.
 *
 * @param filePath - the file path to check
 * @returns the MIME content type
 */
export function getContentType(filePath: string): string {
  const last = filePath.replace(/^.*[/\\]/, '').toLowerCase();
  const ext = last.replace(/^.*\./, '').toLowerCase();

  const hasPath = last.length < filePath.length;
  const hasDot = ext.length < last.length - 1;

  return ((hasDot || !hasPath) && CONTENT_TYPES[ext]) || 'application/octet-stream';
}

// =============================================================================
// File Type Checks
// =============================================================================

/**
 * Check if a file is an HTML file.
 *
 * @param filePath - the file path to check
 * @returns true if the file is HTML
 */
export function isHtmlFile(filePath: string): boolean {
  const lower = filePath.toLowerCase().trim();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

/**
 * Check if a file is a CSS file.
 *
 * @param filePath - the file path to check
 * @returns true if the file is CSS
 */
export function isCssFile(filePath: string): boolean {
  return filePath.toLowerCase().trim().endsWith('.css');
}

const TXT_EXT = ['css', 'html', 'htm', 'js', 'json', 'svg', 'xml', 'mjs', 'ts', 'tsx', 'md', 'txt'];

/**
 * Check if a file is simple text (CSS, HTML, JS, JSON, etc.).
 *
 * @param filePath - the file path to check
 * @returns true if the file is a simple text format
 */
export function isSimpleText(filePath: string): boolean {
  const ext = filePath.toLowerCase().trim().split('.').pop();
  return ext ? TXT_EXT.includes(ext) : false;
}

/**
 * Check if a pathname has no file extension.
 *
 * @param pathname - the URL pathname to check
 * @returns true if the path has no extension
 */
export function isExtensionLessPath(pathname: string): boolean {
  const parts = pathname.split('/');
  const lastPart = parts[parts.length - 1];
  return !lastPart.includes('.');
}

/**
 * Check if a pathname is for SSR static data (page.state.json).
 *
 * @param pathname - the URL pathname to check
 * @returns true if the path is for SSR static data
 */
export function isSsrStaticDataPath(pathname: string): boolean {
  const parts = pathname.split('/');
  const fileName = parts[parts.length - 1].split('?')[0];
  return fileName === 'page.state.json';
}

/**
 * Extract SSR static data path information from an HTTP request.
 *
 * @param req - the HTTP request object
 * @returns an object containing ssrPath, fileName, and hasQueryString
 */
export function getSsrStaticDataPath(req: HttpRequest): {
  ssrPath: string;
  fileName: string;
  hasQueryString: boolean;
} {
  const parts = req.url!.href.split('/');
  const fileName = parts[parts.length - 1];
  const fileNameParts = fileName.split('?');

  parts.pop();

  let ssrPath = new URL(parts.join('/')).href;
  if (!ssrPath.endsWith('/') && req.headers) {
    const h = new Headers(req.headers as HeadersInit);
    if (h.get('referer')?.endsWith('/')) {
      ssrPath += '/';
    }
  }

  return {
    ssrPath,
    fileName: fileNameParts[0],
    hasQueryString: typeof fileNameParts[1] === 'string' && fileNameParts[1].length > 0,
  };
}

// =============================================================================
// Path Type Checks
// =============================================================================

/**
 * Check if a pathname is for the dev client.
 *
 * @param pathname - the URL pathname to check
 * @returns true if the path is for the dev client
 */
export function isDevClient(pathname: string): boolean {
  return pathname.startsWith(DEV_SERVER_URL);
}

/**
 * Check if a pathname is for a dev module.
 *
 * @param pathname - the URL pathname to check
 * @returns true if the path is for a dev module
 */
export function isDevModule(pathname: string): boolean {
  return pathname.includes(DEV_MODULE_URL);
}

/**
 * Check if a pathname is for the open-in-editor endpoint.
 *
 * @param pathname - the URL pathname to check
 * @returns true if the path is for opening in editor
 */
export function isOpenInEditor(pathname: string): boolean {
  return pathname === OPEN_IN_EDITOR_URL;
}

/**
 * Check if a pathname is for the initial dev server load.
 *
 * @param pathname - the URL pathname to check
 * @returns true if the path is for initial dev server load
 */
export function isInitialDevServerLoad(pathname: string): boolean {
  return pathname === DEV_SERVER_INIT_URL;
}

/**
 * Check if a pathname is for the dev server client script.
 *
 * @param pathname - the URL pathname to check
 * @returns true if the path is for the dev server client
 */
export function isDevServerClient(pathname: string): boolean {
  return pathname === DEV_SERVER_URL;
}

// =============================================================================
// Compression
// =============================================================================

/**
 * Check if a response should be gzip compressed.
 *
 * @param devServerConfig - the dev server configuration
 * @param req - the HTTP request object
 * @returns true if the response should be compressed
 */
export function shouldCompress(devServerConfig: DevServerConfig, req: HttpRequest): boolean {
  if (!devServerConfig.gzip) {
    return false;
  }

  if (req.method !== 'GET') {
    return false;
  }

  const acceptEncoding = req.headers?.['accept-encoding'];
  if (typeof acceptEncoding !== 'string') {
    return false;
  }

  return acceptEncoding.includes('gzip');
}

// =============================================================================
// Path Normalization
// =============================================================================

/**
 * Normalize a file path to use forward slashes and remove redundant slashes.
 *
 * @param path - the file path to normalize
 * @returns the normalized path
 */
export function normalizePath(path: string): string {
  // Convert backslashes to forward slashes
  let normalized = path.replace(/\\/g, '/');

  // Remove redundant slashes (but keep leading double slash for UNC paths)
  normalized = normalized.replace(/\/+/g, '/');

  // Handle Windows UNC paths
  if (path.startsWith('\\\\')) {
    normalized = '/' + normalized;
  }

  return normalized;
}
