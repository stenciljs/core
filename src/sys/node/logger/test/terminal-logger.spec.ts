import { bgRed, blue, bold, cyan, dim, gray, green, magenta, red, yellow } from 'ansi-colors';

import { LOG_LEVELS, LogLevel } from '../../../../declarations';
import { setupConsoleMocker } from '../../../../testing/testing-utils';
import { createNodeLoggerSys } from '../index';
import { createTerminalLogger, shouldLog } from '../terminal-logger';

describe('terminal-logger', () => {
  describe('shouldLog helper', () => {
    it.each(LOG_LEVELS)("should log errors at level '%s'", (currentLevel: LogLevel) => {
      expect(shouldLog(currentLevel, 'error')).toBe(true);
    });

    it.each<[LogLevel, boolean]>([
      ['debug', true],
      ['info', true],
      ['warn', true],
      ['error', false],
    ])("shouldLog for warnings at level '%s' should be '%p'", (currentLevel, expected) => {
      expect(shouldLog(currentLevel, 'warn')).toBe(expected);
    });

    it.each<[LogLevel, boolean]>([
      ['debug', true],
      ['info', true],
      ['warn', false],
      ['error', false],
    ])("shouldLog for info at level '%s' should be '%p'", (currentLevel, expected) => {
      expect(shouldLog(currentLevel, 'info')).toBe(expected);
    });

    it.each<[LogLevel, boolean]>([
      ['debug', true],
      ['info', false],
      ['warn', false],
      ['error', false],
    ])("shouldLog for debug messages at level '%s' should be '%p'", (currentLevel, expected) => {
      expect(shouldLog(currentLevel, 'debug')).toBe(expected);
    });
  });

  describe('basic logging functionality', () => {
    const { setupConsoleMocks } = setupConsoleMocker();

    function setup() {
      const { logMock, warnMock, errorMock } = setupConsoleMocks();

      const loggerSys = createNodeLoggerSys();

      loggerSys.memoryUsage = jest.fn().mockReturnValue(10_000_000);

      const writeLogsMock = jest.fn();
      loggerSys.writeLogs = writeLogsMock;

      const logger = createTerminalLogger(loggerSys);

      jest.useFakeTimers().setSystemTime(new Date(2022, 6, 3, 9, 32, 32, 32));

      return { logger, logMock, warnMock, errorMock, writeLogsMock };
    }

    it("supports 'debug' level", () => {
      const { logger, logMock } = setup();
      logger.setLevel('debug');
      logger.debug('my debug message');
      expect(logMock).toHaveBeenCalledWith(`${cyan('[32:32.0]')}  my debug message ${dim(' MEM: 10.0MB')}`);
    });

    it("supports 'info' level", () => {
      const { logger, logMock } = setup();
      logger.info('my info message');
      expect(logMock).toHaveBeenCalledWith(`${dim('[32:32.0]')}  my info message`);
    });

    it("supports 'warn' level", () => {
      const { logger, warnMock } = setup();
      logger.warn('my warn message');
      expect(warnMock).toHaveBeenCalledWith(`\n${bold(yellow('[ WARN  ]'))}  my warn message\n`);
    });

    it("supports 'error' level", () => {
      const { logger, errorMock } = setup();
      logger.error('my error message');
      expect(errorMock).toHaveBeenCalledWith(`\n${bold(red('[ ERROR ]'))}  my error message\n`);
    });

    describe('color support', () => {
      it('re-packages some ansi-colors functions', () => {
        const { logger } = setup();
        expect(logger.bgRed('test message')).toBe(bgRed('test message'));
        expect(logger.blue('test message')).toBe(blue('test message'));
        expect(logger.bold('test message')).toBe(bold('test message'));
        expect(logger.cyan('test message')).toBe(cyan('test message'));
        expect(logger.dim('test message')).toBe(dim('test message'));
        expect(logger.gray('test message')).toBe(gray('test message'));
        expect(logger.green('test message')).toBe(green('test message'));
        expect(logger.magenta('test message')).toBe(magenta('test message'));
        expect(logger.red('test message')).toBe(red('test message'));
        expect(logger.yellow('test message')).toBe(yellow('test message'));
      });

      it('has a built-in disable which turns off colors', () => {
        const { logger } = setup();
        logger.enableColors(false);
        expect(logger.bgRed('test message')).toBe('test message');
        expect(logger.blue('test message')).toBe('test message');
        expect(logger.bold('test message')).toBe('test message');
        expect(logger.cyan('test message')).toBe('test message');
        expect(logger.dim('test message')).toBe('test message');
        expect(logger.gray('test message')).toBe('test message');
        expect(logger.green('test message')).toBe('test message');
        expect(logger.magenta('test message')).toBe('test message');
        expect(logger.red('test message')).toBe('test message');
        expect(logger.yellow('test message')).toBe('test message');
        // This has to be re-enabled because this actually toggles
        // a boolean declared inside of the ansi-colors module
        logger.enableColors(true);
      });
    });

    describe('logfile support', () => {
      it('supports shipping logs to a file', () => {
        const { logger, writeLogsMock } = setup();
        logger.setLogFilePath!('testfile.txt');
        logger.info('test message');
        logger.writeLogs!(false);
        const expectedLogfile = [
          '09:32:32.00  0010.0MB  I  test message',
          '09:32:32.00  0010.0MB  F  --------------------------------------',
        ].join('\n');
        expect(writeLogsMock).toHaveBeenCalledWith('testfile.txt', expectedLogfile, false);
      });

      it('should not write logs to file if filepath not set', function () {
        const { logger, writeLogsMock } = setup();
        logger.info('test message');
        logger.writeLogs!(false);
        expect(writeLogsMock).not.toHaveBeenCalled();
      });
    });

    describe('timespans', () => {
      it('has basic support for timespans', function () {
        const { logger, logMock } = setup();
        const timespan = logger.createTimeSpan('start the timespan');
        jest.advanceTimersByTime(10_000);
        timespan.finish('finish the timespan');

        expect(logMock).toHaveBeenNthCalledWith(1, `${dim('[32:32.0]')}  start the timespan ${dim('...')}`);
        expect(logMock).toHaveBeenNthCalledWith(2, `${dim('[32:42.0]')}  finish the timespan ${dim('in 10.00 s')}`);
      });

      describe('debug timespan', function () {
        it('supports passing a debug flag', function () {
          const { logger, logMock } = setup();
          logger.setLevel('debug');
          const timespan = logger.createTimeSpan('start the timespan', true);
          jest.advanceTimersByTime(10_000);
          timespan.finish('finish the timespan');

          expect(logMock).toHaveBeenNthCalledWith(
            1,
            `${cyan('[32:32.0]')}  start the timespan ${dim('...')} ${dim(' MEM: 10.0MB')}`,
          );
          expect(logMock).toHaveBeenNthCalledWith(
            2,
            `${cyan('[32:42.0]')}  finish the timespan ${dim('in 10.00 s')} ${dim(' MEM: 10.0MB')}`,
          );
        });

        it('supports writing debug messages to the logfile', () => {
          const { logger, writeLogsMock } = setup();
          logger.setLogFilePath!('testfile.txt');
          logger.setLevel('debug');
          const timespan = logger.createTimeSpan('start the timespan', true);
          jest.advanceTimersByTime(10_000);
          timespan.finish('finish the timespan');
          logger.writeLogs!(false);

          const expectedLogfile = [
            '09:32:32.00  0010.0MB  D  start the timespan ...',
            '09:32:42.00  0010.0MB  D  finish the timespan in 10.00 s',
            '09:32:42.00  0010.0MB  F  --------------------------------------',
          ].join('\n');
          expect(writeLogsMock).toHaveBeenCalledWith('testfile.txt', expectedLogfile, false);
        });

        it.each<LogLevel>(['info', 'error', 'warn'])(
          "shouldn't write to the console when logLevel is '%s' (less verbose than 'debug')",
          (level) => {
            const { logger, logMock } = setup();
            logger.setLevel(level);
            const timespan = logger.createTimeSpan('start the timespan', true);
            jest.advanceTimersByTime(10_000);
            timespan.finish('finish the timespan');
            expect(logMock).not.toHaveBeenCalled();
          },
        );
      });

      it('reports the number of milliseconds if timespan takes under a second', () => {
        const { logger, logMock } = setup();
        const timespan = logger.createTimeSpan('start the timespan');
        jest.advanceTimersByTime(10);
        timespan.finish('finish the timespan');

        expect(logMock).toHaveBeenNthCalledWith(1, `${dim('[32:32.0]')}  start the timespan ${dim('...')}`);
        expect(logMock).toHaveBeenNthCalledWith(2, `${dim('[32:32.0]')}  finish the timespan ${dim('in 10 ms')}`);
      });

      it("doesn't report an exact time if it's less than 1ms", function () {
        const { logger, logMock } = setup();
        const timespan = logger.createTimeSpan('start the timespan');
        timespan.finish('finish the timespan');

        expect(logMock).toHaveBeenNthCalledWith(1, `${dim('[32:32.0]')}  start the timespan ${dim('...')}`);
        expect(logMock).toHaveBeenNthCalledWith(
          2,
          `${dim('[32:32.0]')}  finish the timespan ${dim('in less than 1 ms')}`,
        );
      });

      it('writes timespans to the log file, if configured', () => {
        const { logger, writeLogsMock } = setup();
        logger.setLogFilePath!('testfile.txt');
        const timespan = logger.createTimeSpan('start the timespan');
        jest.advanceTimersByTime(10_000);
        timespan.finish('finish the timespan');
        logger.writeLogs!(false);

        const expectedLogfile = [
          '09:32:32.00  0010.0MB  I  start the timespan ...',
          '09:32:42.00  0010.0MB  I  finish the timespan in 10.00 s',
          '09:32:42.00  0010.0MB  F  --------------------------------------',
        ].join('\n');
        expect(writeLogsMock).toHaveBeenCalledWith('testfile.txt', expectedLogfile, false);
      });
    });
  });
});
