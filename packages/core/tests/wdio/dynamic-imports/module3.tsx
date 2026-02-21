let state = 0;

export function concat(a: string, b: string) {
  state++;
  return `${state} ${a} ${b}`;
}
