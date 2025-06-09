import { Diagnostic } from '../../declarations';

export const logBuild = (msg: string) => log(BLUE, 'Build', msg);

export const logReload = (msg: string) => logWarn('Reload', msg);

export const logWarn = (prefix: string, msg: string) => log(YELLOW, prefix, msg);

export const logDisabled = (prefix: string, msg: string) => log(GRAY, prefix, msg);

export const logDiagnostic = (diag: Diagnostic) => {
  const diagnostic: Diagnostic = diag;
  let color = RED;
  let prefix = 'Error';

  if (diagnostic.level === 'warn') {
    color = YELLOW;
    prefix = 'Warning';
  }

  if (diagnostic.header) {
    prefix = diagnostic.header;
  }

  let msg = ``;

  if (diagnostic.relFilePath) {
    msg += diagnostic.relFilePath;

    if (typeof diagnostic.lineNumber === 'number' && diagnostic.lineNumber > 0) {
      msg += ', line ' + diagnostic.lineNumber;

      if (typeof diagnostic.columnNumber === 'number' && diagnostic.columnNumber > 0) {
        msg += ', column ' + diagnostic.columnNumber;
      }
    }
    msg += `\n`;
  }

  msg += diagnostic.messageText;

  log(color, prefix, msg);
};

const log = (color: string, prefix: string, msg: string) => {
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.indexOf('Trident') > -1) {
    console.log(prefix, msg);
  } else {
    console.log.apply(console, [
      '%c' + prefix,
      `background: ${color}; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;`,
      msg,
    ]);
  }
};

const YELLOW = `#f39c12`;
const RED = `#c0392b`;
const BLUE = `#3498db`;
const GRAY = `#717171`;
