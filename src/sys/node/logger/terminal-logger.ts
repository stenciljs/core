import ansiColor, { bgRed, blue, bold, cyan, dim, gray, green, magenta, red, yellow } from 'ansi-colors';

import {
  Diagnostic,
  LOG_LEVELS,
  Logger,
  LoggerLineUpdater,
  LoggerTimeSpan,
  LogLevel,
  PrintLine,
} from '../../../declarations';

/**
 * A type to capture the range of functions exported by the ansi-colors module
 * Unfortunately they don't make a type like this available directly, so we have
 * to do a little DIY.
 */
type AnsiColorVariant = keyof typeof ansiColor.styles;

/**
 * Create a logger for outputting information to a terminal environment
 * @param loggerSys an underlying logger system entity used to create the terminal logger
 * @returns the created logger
 */
export const createTerminalLogger = (loggerSys: TerminalLoggerSys): Logger => {
  // The current log level setting
  // this can be modified at runtime
  let currentLogLevel: LogLevel = 'info';
  let logFilePath: string | null = null;
  const writeLogQueue: string[] = [];

  const setLevel = (l: LogLevel) => (currentLogLevel = l);

  const getLevel = () => currentLogLevel;

  const setLogFilePath = (p: string) => (logFilePath = p);

  const info = (...msg: any[]) => {
    if (shouldLog(currentLogLevel, 'info')) {
      const lines = wordWrap(msg, loggerSys.getColumns());
      infoPrefix(lines);
      console.log(lines.join('\n'));
    }
    queueWriteLog('I', msg);
  };

  const infoPrefix = (lines: string[]) => {
    if (lines.length > 0) {
      const prefix = formatPrefixTimestamp();
      lines[0] = dim(prefix) + lines[0].slice(prefix.length);
    }
  };

  const warn = (...msg: any[]) => {
    if (shouldLog(currentLogLevel, 'warn')) {
      const lines = wordWrap(msg, loggerSys.getColumns());
      warnPrefix(lines);
      console.warn('\n' + lines.join('\n') + '\n');
    }
    queueWriteLog('W', msg);
  };

  const warnPrefix = (lines: string[]) => {
    if (lines.length) {
      const prefix = '[ WARN  ]';
      lines[0] = bold(yellow(prefix)) + lines[0].slice(prefix.length);
    }
  };

  const error = (...msg: any[]) => {
    for (let i = 0; i < msg.length; i++) {
      if (msg[i] instanceof Error) {
        const err: Error = msg[i];
        msg[i] = err.message;
        if (err.stack) {
          msg[i] += '\n' + err.stack;
        }
      }
    }

    if (shouldLog(currentLogLevel, 'error')) {
      const lines = wordWrap(msg, loggerSys.getColumns());
      errorPrefix(lines);
      console.error('\n' + lines.join('\n') + '\n');
    }
    queueWriteLog('E', msg);
  };

  const errorPrefix = (lines: string[]) => {
    if (lines.length) {
      const prefix = '[ ERROR ]';
      lines[0] = bold(red(prefix)) + lines[0].slice(prefix.length);
    }
  };

  const debug = (...msg: any[]) => {
    if (shouldLog(currentLogLevel, 'debug')) {
      formatMemoryUsage(msg);
      const lines = wordWrap(msg, loggerSys.getColumns());
      debugPrefix(lines);
      console.log(lines.join('\n'));
    }
    queueWriteLog('D', msg);
  };

  const debugPrefix = (lines: string[]) => {
    if (lines.length) {
      const prefix = formatPrefixTimestamp();
      lines[0] = cyan(prefix) + lines[0].slice(prefix.length);
    }
  };

  const timespanStart = (startMsg: string, debug: boolean, appendTo?: string[]) => {
    const msg = [`${startMsg} ${dim('...')}`];

    if (debug) {
      if (shouldLog(currentLogLevel, 'debug')) {
        formatMemoryUsage(msg);
        const lines = wordWrap(msg, loggerSys.getColumns());
        debugPrefix(lines);
        console.log(lines.join('\n'));
        queueWriteLog('D', [`${startMsg} ...`]);
      }
    } else {
      const lines = wordWrap(msg, loggerSys.getColumns());
      infoPrefix(lines);
      console.log(lines.join('\n'));
      queueWriteLog('I', [`${startMsg} ...`]);
      if (appendTo) {
        appendTo.push(`${startMsg} ...`);
      }
    }
  };

  /**
   * A little helper to (conditionally) format and add the current memory usage
   *
   * @param message an array to which the memory usage will be added
   */
  const formatMemoryUsage = (message: string[]) => {
    const mem = loggerSys.memoryUsage();
    if (mem > 0) {
      message.push(dim(` MEM: ${(mem / 1_000_000).toFixed(1)}MB`));
    }
  };

  const timespanFinish = (
    finishMsg: string,
    timeSuffix: string,
    colorName: AnsiColorVariant,
    textBold: boolean,
    newLineSuffix: boolean,
    debug: boolean,
    appendTo?: string[],
  ) => {
    let msg = finishMsg;

    if (colorName) {
      msg = ansiColor[colorName](finishMsg);
    }
    if (textBold) {
      msg = bold(msg);
    }

    msg += ' ' + dim(timeSuffix);

    if (debug) {
      if (shouldLog(currentLogLevel, 'debug')) {
        const m = [msg];
        formatMemoryUsage(m);

        const lines = wordWrap(m, loggerSys.getColumns());
        debugPrefix(lines);
        console.log(lines.join('\n'));
      }
      queueWriteLog('D', [`${finishMsg} ${timeSuffix}`]);
    } else {
      const lines = wordWrap([msg], loggerSys.getColumns());
      infoPrefix(lines);
      console.log(lines.join('\n'));
      queueWriteLog('I', [`${finishMsg} ${timeSuffix}`]);

      if (appendTo) {
        appendTo.push(`${finishMsg} ${timeSuffix}`);
      }
    }

    if (newLineSuffix) {
      console.log('');
    }
  };

  const createTimeSpan = (startMsg: string, debug = false, appendTo?: string[]) => {
    const start = Date.now();
    const duration = () => Date.now() - start;
    const timeSpan: LoggerTimeSpan = {
      duration,
      finish: (finishMsg, colorName: AnsiColorVariant, textBold, newLineSuffix) => {
        const dur = duration();
        let time: string;

        if (dur > 1000) {
          time = 'in ' + (dur / 1000).toFixed(2) + ' s';
        } else {
          const ms = parseFloat(dur.toFixed(3));
          if (ms > 0) {
            time = 'in ' + dur + ' ms';
          } else {
            time = 'in less than 1 ms';
          }
        }

        timespanFinish(finishMsg, time, colorName, !!textBold, !!newLineSuffix, debug, appendTo);

        return dur;
      },
    };
    timespanStart(startMsg, debug, appendTo);
    return timeSpan;
  };

  const queueWriteLog = (prefix: string, msg: any[]) => {
    if (logFilePath) {
      const d = new Date();
      const log =
        '' +
        ('0' + d.getHours()).slice(-2) +
        ':' +
        ('0' + d.getMinutes()).slice(-2) +
        ':' +
        ('0' + d.getSeconds()).slice(-2) +
        '.' +
        ('0' + Math.floor((d.getMilliseconds() / 1000) * 10)) +
        '  ' +
        ('000' + (loggerSys.memoryUsage() / 1000000).toFixed(1)).slice(-6) +
        'MB' +
        '  ' +
        prefix +
        '  ' +
        msg.join(', ');

      writeLogQueue.push(log);
    }
  };

  const writeLogs = (append: boolean) => {
    if (logFilePath) {
      try {
        queueWriteLog('F', ['--------------------------------------']);
        loggerSys.writeLogs(logFilePath, writeLogQueue.join('\n'), append);
      } catch (e) {}
    }

    writeLogQueue.length = 0;
  };

  /**
   * Callback to enable / disable colored output in logs
   * @param useColors the new value for the `enabled` toggle on ansi-color
   */
  const enableColors = (useColors: boolean) => {
    ansiColor.enabled = useColors;
  };

  /**
   * Print all diagnostics to the console
   * @param diagnostics the diagnostics to print
   * @param cwd the current working directory
   */
  const printDiagnostics = (diagnostics: Diagnostic[], cwd?: string): void => {
    if (!diagnostics || diagnostics.length === 0) return;

    let outputLines: string[] = [''];

    diagnostics.forEach((d) => {
      outputLines = outputLines.concat(printDiagnostic(d, cwd));
    });

    console.log(outputLines.join('\n'));
  };

  /**
   * Formats a single diagnostic to be printed
   * @param diagnostic the diagnostic to prepare for printing
   * @param cwd the current working directory
   * @returns the message from the diagnostic, formatted and split into multiple lines
   */
  const printDiagnostic = (diagnostic: Diagnostic, cwd?: string): ReadonlyArray<string> => {
    const outputLines = wordWrap([diagnostic.messageText], loggerSys.getColumns());

    let header = '';

    if (diagnostic.header && diagnostic.header !== 'Build Error') {
      header += diagnostic.header;
    }

    if (typeof diagnostic.absFilePath === 'string' && typeof diagnostic.relFilePath !== 'string') {
      if (typeof cwd !== 'string') {
        cwd = loggerSys.cwd();
      }

      diagnostic.relFilePath = loggerSys.relativePath(cwd, diagnostic.absFilePath);
      if (!diagnostic.relFilePath.includes('/')) {
        diagnostic.relFilePath = './' + diagnostic.relFilePath;
      }
    }

    let filePath = diagnostic.relFilePath;
    if (typeof filePath !== 'string') {
      filePath = diagnostic.absFilePath;
    }

    if (typeof filePath === 'string') {
      if (header.length > 0) {
        header += ': ';
      }

      header += cyan(filePath);

      if (typeof diagnostic.lineNumber === 'number' && diagnostic.lineNumber > -1) {
        header += dim(`:`);
        header += yellow(`${diagnostic.lineNumber}`);

        if (typeof diagnostic.columnNumber === 'number' && diagnostic.columnNumber > -1) {
          header += dim(`:`);
          header += yellow(`${diagnostic.columnNumber}`);
        }
      }
    }

    if (header.length > 0) {
      outputLines.unshift(INDENT + header);
    }

    outputLines.push('');
    // code associated with the error/warning
    if (diagnostic.lines && diagnostic.lines.length) {
      const lines = removeLeadingWhitespace(diagnostic.lines);

      lines.forEach((l) => {
        if (!isMeaningfulLine(l.text)) {
          // don't print lines just containing whitespace, skip those that do
          return;
        }

        let msg = ``;

        if (l.lineNumber > -1) {
          msg = `L${l.lineNumber}:  `;
        }

        while (msg.length < INDENT.length) {
          // prepend spaces to the message to make sure everything is aligned
          msg = ' ' + msg;
        }

        let text = l.text;
        if (l.errorCharStart > -1) {
          text = highlightError(text, l.errorCharStart, l.errorLength);
        }

        msg = dim(msg);

        if (diagnostic.language === 'typescript' || diagnostic.language === 'javascript') {
          msg += javaScriptSyntaxHighlight(text);
        } else if (diagnostic.language === 'scss' || diagnostic.language === 'css') {
          msg += cssSyntaxHighlight(text);
        } else {
          msg += text;
        }

        outputLines.push(msg);
      });

      outputLines.push('');
    }

    if (diagnostic.level === 'error') {
      errorPrefix(outputLines);
    } else if (diagnostic.level === 'warn') {
      warnPrefix(outputLines);
    } else if (diagnostic.level === 'debug') {
      debugPrefix(outputLines);
    } else {
      infoPrefix(outputLines);
    }

    if (diagnostic.debugText != null && currentLogLevel === 'debug') {
      outputLines.push(diagnostic.debugText);
      debugPrefix(wordWrap([diagnostic.debugText], loggerSys.getColumns()));
    }

    return outputLines;
  };

  /**
   * Highlights an error
   * @param errorLine the line containing the error
   * @param errorCharStart the character at which the error starts
   * @param errorLength the length of the error, how many characters should be highlighted
   * @returns the highlighted error
   */
  const highlightError = (errorLine: string, errorCharStart: number, errorLength: number = 0): string => {
    let rightSideChars = errorLine.length - errorCharStart + errorLength - 1;
    while (errorLine.length + INDENT.length > loggerSys.getColumns()) {
      if (errorCharStart > errorLine.length - errorCharStart + errorLength && errorCharStart > 5) {
        // larger on left side
        errorLine = errorLine.slice(1);
        errorCharStart--;
      } else if (rightSideChars > 1) {
        // larger on right side
        errorLine = errorLine.slice(0, -1);
        rightSideChars--;
      } else {
        break;
      }
    }

    const lineChars: string[] = [];
    const lineLength = Math.max(errorLine.length, errorCharStart + errorLength);
    for (let i = 0; i < lineLength; i++) {
      let chr = errorLine.charAt(i);
      if (i >= errorCharStart && i < errorCharStart + errorLength) {
        chr = bgRed(chr === '' ? ' ' : chr);
      }
      lineChars.push(chr);
    }

    return lineChars.join('');
  };

  /**
   * Highlights JavaScript/TypeScript syntax, taking in text and selectively highlighting keywords from the language
   * @param text the text to highlight
   * @returns the text with highlighted JS/TS
   */
  const javaScriptSyntaxHighlight = (text: string): string => {
    if (text.trim().startsWith('//')) {
      return dim(text);
    }

    const words = text.split(' ').map((word: string) => {
      if (JS_KEYWORDS.indexOf(word) > -1) {
        return cyan(word);
      }
      return word;
    });

    return words.join(' ');
  };

  /**
   * Highlights CSS syntax, taking in text and selectively highlighting keywords from the language
   * @param text the text to highlight
   * @returns the text with highlighted CSS
   */
  const cssSyntaxHighlight = (text: string): string => {
    let cssProp = true;
    const safeChars = 'abcdefghijklmnopqrstuvwxyz-_';
    const notProp = '.#,:}@$[]/*';

    const chars: string[] = [];

    for (let i = 0; i < text.length; i++) {
      const c = text.charAt(i);

      if (c === ';' || c === '{') {
        cssProp = true;
      } else if (notProp.indexOf(c) > -1) {
        cssProp = false;
      }
      if (cssProp && safeChars.indexOf(c.toLowerCase()) > -1) {
        chars.push(cyan(c));
        continue;
      }

      chars.push(c);
    }

    return chars.join('');
  };

  const logger: Logger = {
    createLineUpdater: loggerSys.createLineUpdater,
    createTimeSpan,
    debug,
    emoji: loggerSys.emoji,
    enableColors,
    error,
    getLevel,
    info,
    printDiagnostics,
    setLevel,
    setLogFilePath,
    warn,
    writeLogs,

    // color functions
    bgRed,
    blue,
    bold,
    cyan,
    dim,
    gray,
    green,
    magenta,
    red,
    yellow,
  };
  return logger;
};

export interface TerminalLoggerSys {
  emoji: (msg: string) => string;
  cwd: () => string;
  getColumns: () => number;
  memoryUsage: () => number;
  relativePath: (from: string, to: string) => string;
  writeLogs: (logFilePath: string, log: string, append: boolean) => void;
  createLineUpdater: () => Promise<LoggerLineUpdater>;
}

/**
 * Helper function to determine, based on the current log level setting, whether
 * a message at a given log level should be logged or not.
 *
 * @param currentSetting the current log level setting
 * @param messageLevel the log level to check
 * @returns whether we should log or not!
 */
export const shouldLog = (currentSetting: LogLevel, messageLevel: LogLevel): boolean =>
  LOG_LEVELS.indexOf(messageLevel) >= LOG_LEVELS.indexOf(currentSetting);

/**
 * Format a simple timestamp string for log prefixes
 *
 * @returns a formatted timestamp
 */
const formatPrefixTimestamp = (): string => {
  const currentTime = new Date();
  const minutes = clampTwoDigits(currentTime.getMinutes());
  const seconds = clampTwoDigits(currentTime.getSeconds());
  const milliseconds = Math.floor((currentTime.getMilliseconds() / 1000) * 10);

  return `[${minutes}:${seconds}.${milliseconds}]`;
};

/**
 * Format a number as a string and clamp it to exactly
 * two digits, e.g.
 *
 * ```ts
 * clampTwoDigits(3) // '03'
 * clampTwoDigits(14) // '14'
 * clampTwoDigits(104) // '04'
 * ```
 *
 * @param n the number to clamp
 * @returns a formatted string
 */
const clampTwoDigits = (n: number): string => ('0' + n.toString()).slice(-2);

/**
 * Helper function for word wrapping
 * @param msg the message to wrap
 * @param columns the maximum number of columns to occupy per line
 * @returns the wrapped message
 */
export const wordWrap = (msg: any[], columns: number): string[] => {
  const lines: string[] = [];
  const words: any[] = [];

  msg.forEach((m) => {
    if (m === null) {
      words.push('null');
    } else if (typeof m === 'undefined') {
      words.push('undefined');
    } else if (typeof m === 'string') {
      m.replace(/\s/gm, ' ')
        .split(' ')
        .forEach((strWord) => {
          if (strWord.trim().length) {
            words.push(strWord.trim());
          }
        });
    } else if (typeof m === 'number' || typeof m === 'boolean' || typeof m === 'function') {
      words.push(m.toString());
    } else if (Array.isArray(m)) {
      words.push(() => {
        return m.toString();
      });
    } else if (Object(m) === m) {
      words.push(() => {
        return m.toString();
      });
    } else {
      words.push(m.toString());
    }
  });

  let line = INDENT;
  words.forEach((word) => {
    if (lines.length > 25) {
      return;
    }

    if (typeof word === 'function') {
      if (line.trim().length) {
        lines.push(line);
      }
      lines.push(word());
      line = INDENT;
    } else if (INDENT.length + word.length > columns - 1) {
      // word is too long to play nice, just give it its own line
      if (line.trim().length) {
        lines.push(line);
      }
      lines.push(INDENT + word);
      line = INDENT;
    } else if (word.length + line.length > columns - 1) {
      // this word would make the line too long
      // print the line now, then start a new one
      lines.push(line);
      line = INDENT + word + ' ';
    } else {
      line += word + ' ';
    }
  });

  if (line.trim().length) {
    lines.push(line);
  }

  return lines.map((line) => {
    return (line as any).trimRight();
  });
};

/**
 * Prepare the code associated with the error/warning to be logged by stripping variable length, leading whitespace
 * @param orgLines the lines of code to log
 * @returns the code, with leading whitespace stripped
 */
const removeLeadingWhitespace = (orgLines: PrintLine[]): ReadonlyArray<PrintLine> => {
  // The number of times an attempt to strip leading whitespace should occur
  const numberOfTries = 100;
  const lines: PrintLine[] = JSON.parse(JSON.stringify(orgLines));

  for (let i = 0; i < numberOfTries; i++) {
    if (!eachLineHasLeadingWhitespace(lines)) {
      return lines;
    }
    // each line has at least one line of whitespace. remove the leading character from each
    for (let i = 0; i < lines.length; i++) {
      lines[i].text = lines[i].text.slice(1);
      lines[i].errorCharStart--;
      if (!lines[i].text.length) {
        return lines;
      }
    }
  }

  return lines;
};

/**
 * Determine if any of the provided lines begin with whitespace or not
 * @param lines the lines to check for whitespace
 * @returns true if each of the provided `lines` has some leading whitespace, false otherwise
 */
const eachLineHasLeadingWhitespace = (lines: PrintLine[]): boolean => {
  if (!lines.length) {
    return false;
  }

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].text || lines[i].text.length < 1) {
      return false;
    }
    const firstChar = lines[i].text.charAt(0);
    if (firstChar !== ' ' && firstChar !== '\t') {
      return false;
    }
  }

  return true;
};

/**
 * Verify that a given line has more than just whitespace
 * @param line the line to check
 * @returns true if a line has characters other than whitespace in it, false otherwise
 */
const isMeaningfulLine = (line: string): boolean => {
  if (line) {
    line = line.trim();
    return line.length > 0;
  }
  return false;
};

const JS_KEYWORDS = [
  'abstract',
  'any',
  'as',
  'break',
  'boolean',
  'case',
  'catch',
  'class',
  'console',
  'const',
  'continue',
  'debugger',
  'declare',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'get',
  'if',
  'import',
  'in',
  'implements',
  'Infinity',
  'instanceof',
  'let',
  'module',
  'namespace',
  'NaN',
  'new',
  'number',
  'null',
  'public',
  'private',
  'protected',
  'require',
  'return',
  'static',
  'set',
  'string',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'true',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
  'with',
  'while',
  'yield',
];

/**
 * This is used to prefix lines with whitespace which is then
 * replaced by various prefixes like [ WARN ] and so on
 */
const INDENT = '           ';
