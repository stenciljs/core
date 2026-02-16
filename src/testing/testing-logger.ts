import type { Diagnostic, Logger, LoggerTimeSpan, LogLevel } from '@stencil/core/internal';

export class TestingLogger implements Logger {
  private isEnabled = false;

  enable() {
    this.isEnabled = true;
  }

  setLevel(_level: LogLevel) {}
  getLevel(): LogLevel {
    return 'info';
  }
  enableColors(_useColors: boolean) {}
  emoji(_: string) {
    return '';
  }
  info(...msg: any[]) {
    if (this.isEnabled) {
      console.log(...msg);
    }
  }
  warn(...msg: any[]) {
    if (this.isEnabled) {
      console.warn(...msg);
    }
  }
  error(...msg: any[]) {
    if (this.isEnabled) {
      console.error(...msg);
    }
  }
  debug(...msg: any[]) {
    if (this.isEnabled) {
      console.log(...msg);
    }
  }
  color(_msg: string, _color: 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'gray') {}
  red(msg: string) {
    return msg;
  }
  green(msg: string) {
    return msg;
  }
  yellow(msg: string) {
    return msg;
  }
  blue(msg: string) {
    return msg;
  }
  magenta(msg: string) {
    return msg;
  }
  cyan(msg: string) {
    return msg;
  }
  gray(msg: string) {
    return msg;
  }
  bold(msg: string) {
    return msg;
  }
  dim(msg: string) {
    return msg;
  }
  bgRed(msg: string) {
    return msg;
  }
  createTimeSpan(_startMsg: string, _debug = false): LoggerTimeSpan {
    return {
      duration() {
        return 0;
      },
      finish() {
        return 0;
      },
    };
  }
  printDiagnostics(_diagnostics: Diagnostic[]) {}
}
