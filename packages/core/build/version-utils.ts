import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Build-time utilities for generating version info baked into the Stencil build.
 * Used by tsdown.config.ts to create define replacements.
 */

// Emoji pool for vermoji
const VERMOJIS = [
  '💯',
  '☀️',
  '☕️',
  '♨️',
  '✈️',
  '✨',
  '❄️',
  '❤️',
  '☎️',
  '⚡️',
  '⚽️',
  '⚾️',
  '⛄️',
  '⛑',
  '⛰',
  '⛱',
  '⛲️',
  '⛳️',
  '⛴',
  '⛵️',
  '⛷',
  '⛸',
  '⛹',
  '⛺️',
  '⭐️',
  '🌀',
  '🌁',
  '🌃',
  '🌄',
  '🌅',
  '🌇',
  '🌈',
  '🌍',
  '🌎',
  '🌏',
  '🌐',
  '🌙',
  '🌜',
  '🌝',
  '🌞',
  '🌟',
  '🌪',
  '🌭',
  '🌮',
  '🌯',
  '🌱',
  '🌲',
  '🌳',
  '🌴',
  '🌵',
  '🌶',
  '🌷',
  '🌸',
  '🌹',
  '🌺',
  '🌻',
  '🌼',
  '🍀',
  '🍁',
  '🍅',
  '🍇',
  '🍈',
  '🍉',
  '🍊',
  '🍋',
  '🍌',
  '🍍',
  '🍎',
  '🍏',
  '🍐',
  '🍒',
  '🍓',
  '🍔',
  '🍕',
  '🍖',
  '🍗',
  '🍜',
  '🍝',
  '🍞',
  '🍟',
  '🍡',
  '🍣',
  '🍤',
  '🍦',
  '🍧',
  '🍨',
  '🍩',
  '🍪',
  '🍫',
  '🍬',
  '🍭',
  '🍮',
  '🍯',
  '🍰',
  '🍲',
  '🍵',
  '🍷',
  '🍸',
  '🍹',
  '🍺',
  '🍻',
  '🥃',
  '🍾',
  '🍿',
  '🎀',
  '🎁',
  '🎂',
  '🎆',
  '🎇',
  '🎈',
  '🎉',
  '🎊',
  '🎖',
  '🎙',
  '🎠',
  '🎡',
  '🎢',
  '🎤',
  '🎨',
  '🎩',
  '🎪',
  '🎬',
  '🎭',
  '🎯',
  '🎰',
  '🎱',
  '🎲',
  '🎳',
  '🎷',
  '🎸',
  '🎹',
  '🎺',
  '🎻',
  '🎾',
  '🎿',
  '🏀',
  '🏁',
  '🏂',
  '🏃',
  '🏄',
  '🏅',
  '🏆',
  '🏇',
  '🏈',
  '🏉',
  '🏊',
  '🏋',
  '🏌',
  '🏍',
  '🏎',
  '🏏',
  '🏐',
  '🏑',
  '🏒',
  '🏓',
  '🏔',
  '🏕',
  '🏖',
  '🏙',
  '🏜',
  '🏝',
  '🏰',
  '🏵',
  '🏸',
  '🏹',
  '🐁',
  '🐂',
  '🐄',
  '🐅',
  '🐆',
  '🐇',
  '🐈',
  '🐉',
  '🐊',
  '🐋',
  '🐌',
  '🐍',
  '🐎',
  '🐏',
  '🐐',
  '🐒',
  '🐓',
  '🐔',
  '🐕',
  '🐖',
  '🐗',
  '🐘',
  '🐙',
  '🐚',
  '🐛',
  '🐝',
  '🐞',
  '🐟',
  '🐠',
  '🐡',
  '🐣',
  '🐤',
  '🐥',
  '🐦',
  '🐧',
  '🐨',
  '🐩',
  '🐫',
  '🐬',
  '🐭',
  '🐮',
  '🐯',
  '🐰',
  '🐱',
  '🐳',
  '🐴',
  '🐵',
  '🐶',
  '🐷',
  '🐸',
  '🐹',
  '🐺',
  '🐻',
  '🐼',
  '🐽',
  '🐿',
  '👑',
  '👒',
  '👻',
  '👽',
  '👾',
  '💍',
  '💙',
  '💚',
  '💛',
  '💡',
  '💥',
  '💪',
  '💫',
  '💾',
  '💿',
  '📌',
  '📍',
  '📟',
  '🛰',
  '📢',
  '📣',
  '📬',
  '📷',
  '📺',
  '📻',
  '🔈',
  '🔋',
  '🔔',
  '🔥',
  '🔬',
  '🔭',
  '🔮',
  '🕊',
  '🕹',
  '🖍',
  '🗻',
  '😀',
  '😃',
  '😄',
  '😈',
  '😊',
  '😋',
  '😎',
  '😛',
  '😜',
  '😸',
  '🤓',
  '🤖',
  '🚀',
  '🚁',
  '🚂',
  '🚃',
  '🚅',
  '🚋',
  '🚌',
  '🚍',
  '🚎',
  '🚐',
  '🚑',
  '🚒',
  '🚓',
  '🚔',
  '🚕',
  '🚖',
  '🚗',
  '🚘',
  '🚙',
  '🚚',
  '🚛',
  '🚜',
  '🚞',
  '🚟',
  '🚠',
  '🚡',
  '🚢',
  '🚣',
  '🚤',
  '🚦',
  '🚨',
  '🚩',
  '🛠',
  '🛥',
  '🛩',
  '🛳',
  '🤘',
  '🦀',
  '🦁',
  '🦂',
  '🦃',
  '🦄',
  '🧀',
];

/**
 * Generate a build identifier (epoch time in seconds)
 * @returns the build identifier string
 */
export function getBuildId(): string {
  return Date.now().toString(10).slice(0, -3);
}

/**
 * Get first 7 characters of current git SHA
 * @returns the shortened git SHA
 */
export function getGitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 7);
  } catch {
    return 'unknown';
  }
}

/**
 * Generate a dev version string: [BASE_VERSION]-dev.[BUILD_ID].[GIT_SHA]
 * @param baseVersion - the base version to use
 * @param buildId - the build identifier
 * @returns the dev version string
 */
export function getDevVersion(baseVersion: string, buildId: string): string {
  return `${baseVersion}-dev.${buildId}.${getGitSha()}`;
}

/**
 * Get a deterministic vermoji based on a hash string (e.g., buildId).
 * Each unique buildId produces a consistent emoji.
 * @param hash - the hash string to use for selecting the vermoji
 * @returns the selected vermoji emoji
 */
export function getVermojiFromHash(hash: string): string {
  let hashCode = 0;
  for (let i = 0; i < hash.length; i++) {
    const char = hash.charCodeAt(i);
    hashCode = (hashCode << 5) - hashCode + char;
    hashCode = hashCode & hashCode; // Convert to 32-bit integer
  }
  const index = Math.abs(hashCode) % VERMOJIS.length;
  return VERMOJIS[index];
}

/**
 * Get a random vermoji that hasn't been used in the changelog (for prod releases)
 * @param changelogPath - path to the changelog file
 * @returns the selected vermoji emoji
 */
export function getVermojiForRelease(changelogPath: string): string {
  try {
    const changelog = readFileSync(changelogPath, 'utf8');
    const available = VERMOJIS.filter((emoji) => !changelog.includes(emoji));
    if (available.length === 0) {
      console.warn("We're out of Vermoji! Time to add more!");
      return '❓';
    }
    return available[Math.floor(Math.random() * available.length)];
  } catch {
    return '❓';
  }
}

export interface BuildVersionInfo {
  version: string;
  buildId: string;
  vermoji: string;
}

/**
 * Get all build-time version info for tsdown define replacements
 * @param packageJsonPath - path to the package.json file
 * @param isProd - whether this is a production build
 * @returns the build version info object
 */
export function getBuildVersionInfo(packageJsonPath: string, isProd = false): BuildVersionInfo {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const buildId = getBuildId();
  const baseVersion = pkg.version ?? '0.0.0';

  const version = isProd ? baseVersion : getDevVersion(baseVersion, buildId);

  const vermoji = isProd
    ? getVermojiForRelease(join(dirname(packageJsonPath), '../../CHANGELOG.md'))
    : getVermojiFromHash(buildId);

  return { version, buildId, vermoji };
}

/**
 * Create the define object for tsdown string replacements
 * @param info - the build version info
 * @returns a record of define replacements
 */
export function createDefines(info: BuildVersionInfo): Record<string, string> {
  return {
    __STENCIL_VERSION__: JSON.stringify(info.version),
    __STENCIL_BUILD_ID__: JSON.stringify(info.buildId),
    __STENCIL_VERMOJI__: JSON.stringify(info.vermoji),
  };
}
