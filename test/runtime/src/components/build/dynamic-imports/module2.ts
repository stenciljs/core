let state = 0;

export function hello() {
  return _word();
}

export function world() {
  return `world`;
}

function _word() {
  state++;
  return 'hello' + state;
}
