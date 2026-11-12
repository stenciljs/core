import { hello, world } from './module2.js';

let state = 0;

export async function getResult(): Promise<string> {
  const concat = (await import('./module3.js')).concat;
  state++;
  return concat(hello(), world()) + state;
}
