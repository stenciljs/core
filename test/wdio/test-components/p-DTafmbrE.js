import './p-DYdAJnXF.js';

let state$1 = 0;
function hello() {
    return _word();
}
function world() {
    return `world`;
}
function _word() {
    state$1++;
    return 'hello' + state$1;
}

let state = 0;
async function getResult() {
    const concat = (await import('./p-DuVqKg5L.js')).concat;
    state++;
    return concat(hello(), world()) + state;
}

export { getResult };
