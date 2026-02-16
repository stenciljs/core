import type * as d from '../../declarations';
import { catchError } from '../message-utils';

describe('message-utils', () => {
  describe('catchError()', () => {
    describe('called with no error, no message', () => {
      it('returns a template diagnostic', () => {
        const diagnostic = catchError([], null);

        expect(diagnostic).toEqual<d.Diagnostic>({
          level: 'error',
          type: 'build',
          header: 'Build Error',
          messageText: 'build error',
          relFilePath: undefined,
          absFilePath: undefined,
          lines: [],
        });
      });

      it('pushes a template diagnostic onto a collection of diagnostics', () => {
        const diagnostics: d.Diagnostic[] = [];

        const diagnostic = catchError(diagnostics, null);

        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0]).toBe(diagnostic);
      });
    });

    describe('called with an Error', () => {
      describe('with a valid stacktrace', () => {
        const stackTrace = 'test stack';
        let err: Error;

        beforeEach(() => {
          err = new Error();
          err.stack = stackTrace;
        });

        it('returns a diagnostic', () => {
          const diagnostic = catchError([], err);

          expect(diagnostic).toEqual<d.Diagnostic>({
            level: 'error',
            type: 'build',
            header: 'Build Error',
            messageText: stackTrace,
            relFilePath: undefined,
            absFilePath: undefined,
            lines: [],
          });
        });

        it('pushes a template diagnostic onto a collection of diagnostics', () => {
          const diagnostics: d.Diagnostic[] = [];

          const diagnostic = catchError(diagnostics, err);

          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0]).toBe(diagnostic);
        });

        describe('"task canceled"', () => {
          const taskCanceledMessage = 'task canceled';

          beforeEach(() => {
            err.stack = taskCanceledMessage;
          });

          it('returns a diagnostic', () => {
            const diagnostic = catchError([], err);

            expect(diagnostic).toEqual<d.Diagnostic>({
              level: 'error',
              type: 'build',
              header: 'Build Error',
              messageText: taskCanceledMessage,
              relFilePath: undefined,
              absFilePath: undefined,
              lines: [],
            });
          });

          it("doesn't push a template diagnostic", () => {
            const diagnostics: d.Diagnostic[] = [];

            catchError(diagnostics, err);

            expect(diagnostics).toHaveLength(0);
          });
        });
      });

      describe('with a valid message', () => {
        const message = 'test message';
        let err: Error;

        beforeEach(() => {
          err = new Error();
          err.stack = undefined;
          err.message = message;
        });

        it('returns a diagnostic', () => {
          const diagnostic = catchError([], err);

          expect(diagnostic).toEqual<d.Diagnostic>({
            level: 'error',
            type: 'build',
            header: 'Build Error',
            messageText: message,
            relFilePath: undefined,
            absFilePath: undefined,
            lines: [],
          });
        });

        it('pushes a template diagnostic onto a collection of diagnostics', () => {
          const diagnostics: d.Diagnostic[] = [];

          const diagnostic = catchError(diagnostics, err);

          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0]).toBe(diagnostic);
        });

        it('prints "UNKNOWN ERROR" for an empty message', () => {
          err.message = '';
          const diagnostic = catchError([], err);

          expect(diagnostic).toEqual<d.Diagnostic>({
            level: 'error',
            type: 'build',
            header: 'Build Error',
            messageText: 'UNKNOWN ERROR',
            relFilePath: undefined,
            absFilePath: undefined,
            lines: [],
          });
        });

        describe('"task canceled"', () => {
          const taskCanceledMessage = 'task canceled';

          beforeEach(() => {
            err.message = taskCanceledMessage;
          });

          it('returns a diagnostic', () => {
            const diagnostic = catchError([], err);

            expect(diagnostic).toEqual<d.Diagnostic>({
              level: 'error',
              type: 'build',
              header: 'Build Error',
              messageText: taskCanceledMessage,
              relFilePath: undefined,
              absFilePath: undefined,
              lines: [],
            });
          });

          it("doesn't push a template diagnostic", () => {
            const diagnostics: d.Diagnostic[] = [];

            catchError(diagnostics, err);

            expect(diagnostics).toHaveLength(0);
          });
        });
      });

      describe('with an invalid message', () => {
        let err: Error;

        beforeEach(() => {
          err = new Error();
          // this test explicitly checks for a bad value for the `message` property, hence the type assertion
          err.message = undefined as unknown as string;
          err.stack = undefined;
        });

        it('returns a diagnostic', () => {
          const diagnostic = catchError([], err);

          expect(diagnostic).toEqual<d.Diagnostic>({
            level: 'error',
            type: 'build',
            header: 'Build Error',
            messageText: 'Error',
            relFilePath: undefined,
            absFilePath: undefined,
            lines: [],
          });
        });

        it('pushes a template diagnostic onto a collection of diagnostics', () => {
          const diagnostics: d.Diagnostic[] = [];

          const diagnostic = catchError(diagnostics, err);

          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0]).toBe(diagnostic);
        });
      });
    });

    describe('called with a message, but no error', () => {
      const message = 'this is a test message';

      it('returns a diagnostic with the message', () => {
        const diagnostic = catchError([], null, message);

        expect(diagnostic).toEqual<d.Diagnostic>({
          level: 'error',
          type: 'build',
          header: 'Build Error',
          messageText: message,
          relFilePath: undefined,
          absFilePath: undefined,
          lines: [],
        });
      });

      it('pushes the diagnostic onto a collection of diagnostics', () => {
        const diagnostics: d.Diagnostic[] = [];

        const diagnostic = catchError(diagnostics, null, message);

        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0]).toBe(diagnostic);
      });

      it('prints "UNKNOWN ERROR" when the message text is empty', () => {
        const diagnostic = catchError([], null, '');

        expect(diagnostic).toEqual<d.Diagnostic>({
          level: 'error',
          type: 'build',
          header: 'Build Error',
          messageText: 'UNKNOWN ERROR',
          relFilePath: undefined,
          absFilePath: undefined,
          lines: [],
        });
      });

      describe('"task canceled"', () => {
        const taskCanceledMessage = 'task canceled';

        it('returns a diagnostic', () => {
          const diagnostic = catchError([], null, taskCanceledMessage);

          expect(diagnostic).toEqual<d.Diagnostic>({
            level: 'error',
            type: 'build',
            header: 'Build Error',
            messageText: taskCanceledMessage,
            relFilePath: undefined,
            absFilePath: undefined,
            lines: [],
          });
        });

        it("doesn't push a template diagnostic", () => {
          const diagnostics: d.Diagnostic[] = [];

          catchError([], null, taskCanceledMessage);

          expect(diagnostics).toHaveLength(0);
        });
      });
    });
  });
});
