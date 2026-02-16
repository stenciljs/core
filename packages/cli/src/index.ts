export { BOOLEAN_CLI_FLAGS, createConfigFlags } from './config-flags';
export type { ConfigFlags } from './config-flags';
export { parseFlags } from './parse-flags';
export { run, runTask } from './run';
export type TaskCommand =
  | 'build'
  | 'docs'
  | 'generate'
  | 'g'
  | 'help'
  | 'info'
  | 'prerender'
  | 'serve'
  | 'telemetry'
  | 'test'
  | 'version';