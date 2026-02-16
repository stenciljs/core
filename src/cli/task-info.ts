import type { CompilerSystem, Logger } from '../declarations';
import type { CoreCompiler } from './load-compiler';

/**
 * Generate the output for Stencils 'info' task, and log that output - `npx stencil info`
 * @param coreCompiler the compiler instance to derive certain version information from
 * @param sys the compiler system instance that provides details about the system Stencil is running on
 * @param logger the logger instance to use to log information out to
 */
export const taskInfo = (coreCompiler: CoreCompiler, sys: CompilerSystem, logger: Logger): void => {
  const details = sys.details;
  const versions = coreCompiler.versions;

  console.log(``);
  console.log(`${logger.cyan('      System:')} ${sys.name} ${sys.version}`);
  if (details) {
    console.log(`${logger.cyan('    Platform:')} ${details.platform} (${details.release})`);
    console.log(
      `${logger.cyan('   CPU Model:')} ${details.cpuModel} (${sys.hardwareConcurrency} cpu${
        sys.hardwareConcurrency !== 1 ? 's' : ''
      })`,
    );
  }
  console.log(`${logger.cyan('    Compiler:')} ${sys.getCompilerExecutingPath()}`);
  console.log(`${logger.cyan('       Build:')} ${coreCompiler.buildId}`);
  console.log(`${logger.cyan('     Stencil:')} ${coreCompiler.version}${logger.emoji(' ' + coreCompiler.vermoji)}`);
  console.log(`${logger.cyan('  TypeScript:')} ${versions.typescript}`);
  console.log(`${logger.cyan('      Rollup:')} ${versions.rollup}`);
  console.log(`${logger.cyan('      Parse5:')} ${versions.parse5}`);
  console.log(`${logger.cyan('      jQuery:')} ${versions.jquery}`);
  console.log(`${logger.cyan('      Terser:')} ${versions.terser}`);
  console.log(``);
};
