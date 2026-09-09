import type * as d from '@stencil/core/compiler';

import { ConfigFlags } from './config-flags';
import { taskTelemetry } from './task-telemetry';

/**
 * Entrypoint for the Help task, providing Stencil usage context to the user
 * @param flags configuration flags provided to Stencil when a task was call (either this task or a task that invokes
 * telemetry)
 * @param logger a logging implementation to log the results out to the user
 * @param sys the abstraction for interfacing with the operating system
 */
export const taskHelp = async (
  flags: ConfigFlags,
  logger: d.Logger,
  sys: d.CompilerSystem,
): Promise<void> => {
  const prompt = logger.dim(sys.details?.platform === 'windows' ? '>' : '$');

  console.log(`
  ${logger.bold('Init:')} ${logger.dim('Scaffold a new project, or add capabilities to an existing one.')}

    ${prompt} ${logger.green('stencil init')}


  ${logger.bold('Add:')} ${logger.dim('Install and configure an integration (framework wrapper, output target, etc).')}

    ${prompt} ${logger.green('stencil add [package]')}


  ${logger.bold('Generate:')} ${logger.dim('Bootstrap a new component.')}

    ${prompt} ${logger.green('stencil generate [name]')} or ${logger.green('stencil g [name]')}


  ${logger.bold('Build:')} ${logger.dim('Build components for development or production.')}

    ${prompt} ${logger.green('stencil build [--dev] [--watch] [--serve] [--prerender] [--debug]')}

      ${logger.cyan('--dev')} ${logger.dim('.............')} Development build
      ${logger.cyan('--watch')} ${logger.dim('...........')} Rebuild when files update
      ${logger.cyan('--serve')} ${logger.dim('...........')} Start the dev-server (requires --watch)
      ${logger.cyan('--prerender')} ${logger.dim('.......')} Prerender the application
      ${logger.cyan('--docs')} ${logger.dim('............')} Generate component readme.md docs
      ${logger.cyan('--ssr')} ${logger.dim('.............')} Build a server-side-rendering bundle
      ${logger.cyan('--config')} ${logger.dim('..........')} Set stencil config file
      ${logger.cyan('--maxWorkers')} ${logger.dim('......')} Max number of workers, e.g. --maxWorkers 4 or --maxWorkers 50%
      ${logger.cyan('--no-cache')} ${logger.dim('........')} Disable the build cache
      ${logger.cyan('--stats')} ${logger.dim('...........')} Write stats, optional file path (default: stencil-stats.json)
      ${logger.cyan('--log')} ${logger.dim('.............')} Write stencil-build.log file
      ${logger.cyan('--ci')} ${logger.dim('..............')} Run in CI mode (disables colors, version checks)
      ${logger.cyan('--debug')} ${logger.dim('...........')} Set the log level to debug


  ${logger.bold('Serve:')} ${logger.dim('Start the dev-server without building or watching.')}

    ${prompt} ${logger.green('stencil serve [--root] [--no-open]')}

      ${logger.cyan('--root')} ${logger.dim('............')} Directory to serve (default: current directory)
      ${logger.cyan('--no-open')} ${logger.dim('.........')} Don't open the browser automatically


  ${logger.bold('Docs:')} ${logger.dim('Generate configured docs output targets.')}

    ${prompt} ${logger.green('stencil docs [--docsJson]')}

      ${logger.cyan('--docsJson')} ${logger.dim('........')} Write a docs.json file to the given path


  ${logger.bold('Prerender:')} ${logger.dim('Prerender a hydrate app script against the source index.html.')}

    ${prompt} ${logger.green('stencil prerender <hydrate-app-path>')}


  ${logger.bold('Migrate:')} ${logger.dim('Codemod a project for the latest major version breaking changes.')}

    ${prompt} ${logger.green('stencil migrate [--dry-run]')}

      ${logger.cyan('--dry-run')} ${logger.dim('.........')} Preview changes without modifying files


  ${logger.bold('Info:')} ${logger.dim('Print details about the current environment.')}

    ${prompt} ${logger.green('stencil info')}


  ${logger.bold('Version:')} ${logger.dim('Print the installed Stencil compiler version.')}

    ${prompt} ${logger.green('stencil version')} or ${logger.green('stencil --version')}

`);

  await taskTelemetry(flags, sys, logger);

  console.log(`
  ${logger.bold('Examples:')}

  ${prompt} ${logger.green('stencil init')}
  ${prompt} ${logger.green('stencil g my-component')}
  ${prompt} ${logger.green('stencil build --dev --watch --serve')}
  ${prompt} ${logger.green('stencil build --prerender')}
  ${prompt} ${logger.green('stencil serve --root www')}
  ${prompt} ${logger.green('stencil migrate --dry-run')}
  ${prompt} ${logger.green('stencil telemetry on')}
`);
};
