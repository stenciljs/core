import { printSplash } from './wizard/splash.js';

export async function taskInit(): Promise<void> {
  printSplash();
  // TODO: full wizard (template selection, deps, config generation)
}
