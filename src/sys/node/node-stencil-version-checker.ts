import { isString, noop } from '@utils';
import fs from 'graceful-fs';
import { tmpdir } from 'os';
import path from 'path';
import semverLt from 'semver/functions/lt';

import type { Logger, PackageJsonData } from '../../declarations';

const REGISTRY_URL = `https://registry.npmjs.org/@stencil/core`;
const CHECK_INTERVAL = 1000 * 60 * 60 * 24 * 7;
const CHANGELOG = `https://github.com/stenciljs/core/blob/main/CHANGELOG.md`;

export async function checkVersion(logger: Logger, currentVersion: string): Promise<() => void> {
  try {
    const latestVersion = await getLatestCompilerVersion(logger);
    if (latestVersion != null) {
      return () => {
        if (semverLt(currentVersion, latestVersion)) {
          printUpdateMessage(logger, currentVersion, latestVersion);
        } else {
          console.debug(
            `${logger.cyan('@stencil/core')} version ${logger.green(currentVersion)} is the latest version`,
          );
        }
      };
    }
  } catch (e) {
    logger.debug(`unable to load latest compiler version: ${e}`);
  }
  return noop;
}

async function getLatestCompilerVersion(logger: Logger) {
  try {
    const lastCheck = await getLastCheck();
    if (lastCheck == null) {
      // we've never check before, so probably first install, so don't bother
      // save that we did just do a check though
      setLastCheck();
      return null;
    }

    if (!requiresCheck(Date.now(), lastCheck, CHECK_INTERVAL)) {
      // within the range that we did a check recently, so don't bother
      return null;
    }

    // remember we just did a check
    const setPromise = setLastCheck();

    const body = await requestUrl(REGISTRY_URL);
    const data = JSON.parse(body) as PackageJsonData;

    await setPromise;

    return data['dist-tags'].latest;
  } catch (e) {
    // quietly catch, could have no network connection which is fine
    logger.debug(`getLatestCompilerVersion error: ${e}`);
  }

  return null;
}

async function requestUrl(url: string) {
  const https = await import('https');

  return new Promise<string>((resolve, reject) => {
    const req = https.request(url, (res) => {
      if (res.statusCode > 299) {
        reject(`url: ${url}, staus: ${res.statusCode}`);
        return;
      }

      res.once('error', reject);

      const ret: any = [];
      res.once('end', () => {
        resolve(ret.join(''));
      });

      res.on('data', (data) => {
        ret.push(data);
      });
    });
    req.once('error', reject);
    req.end();
  });
}

function requiresCheck(now: number, lastCheck: number, checkInterval: number) {
  return lastCheck + checkInterval < now;
}

function getLastCheck() {
  return new Promise<number>((resolve) => {
    fs.readFile(getLastCheckStoragePath(), 'utf8', (err, data) => {
      if (!err && isString(data)) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {}
      }
      resolve(null);
    });
  });
}

function setLastCheck() {
  return new Promise<void>((resolve) => {
    const now = JSON.stringify(Date.now());
    fs.writeFile(getLastCheckStoragePath(), now, () => {
      resolve();
    });
  });
}

function getLastCheckStoragePath() {
  return path.join(tmpdir(), 'stencil_last_version_node.json');
}

function printUpdateMessage(logger: Logger, currentVersion: string, latestVersion: string) {
  const installMessage = `npm install @stencil/core`;
  const msg = [
    `Update available: ${currentVersion} ${ARROW} ${latestVersion}`,
    `To get the latest, please run:`,
    installMessage,
    CHANGELOG,
  ];

  const lineLength = msg.reduce((longest, line) => (line.length > longest ? line.length : longest), 0);

  const o: string[] = [];

  let top = BOX_TOP_LEFT;
  while (top.length <= lineLength + PADDING * 2) {
    top += BOX_HORIZONTAL;
  }
  top += BOX_TOP_RIGHT;
  o.push(top);

  msg.forEach((m) => {
    let line = BOX_VERTICAL;
    for (let i = 0; i < PADDING; i++) {
      line += ` `;
    }
    line += m;
    while (line.length <= lineLength + PADDING * 2) {
      line += ` `;
    }
    line += BOX_VERTICAL;
    o.push(line);
  });

  let bottom = BOX_BOTTOM_LEFT;
  while (bottom.length <= lineLength + PADDING * 2) {
    bottom += BOX_HORIZONTAL;
  }
  bottom += BOX_BOTTOM_RIGHT;
  o.push(bottom);

  let output = `${INDENT}${o.join(`\n${INDENT}`)}\n`;

  output = output.replace(currentVersion, logger.red(currentVersion));
  output = output.replace(latestVersion, logger.green(latestVersion));
  output = output.replace(installMessage, logger.cyan(installMessage));
  output = output.replace(CHANGELOG, logger.dim(CHANGELOG));

  console.log(output);
}

const ARROW = `→`;
const BOX_TOP_LEFT = `╭`;
const BOX_TOP_RIGHT = `╮`;
const BOX_BOTTOM_LEFT = `╰`;
const BOX_BOTTOM_RIGHT = `╯`;
const BOX_VERTICAL = `│`;
const BOX_HORIZONTAL = `─`;
const PADDING = 2;
const INDENT = `   `;
