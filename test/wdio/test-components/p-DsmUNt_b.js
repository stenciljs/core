import { t as transformTag } from './p-DYdAJnXF.js';

function output (msg, id = 'lifecycle-loads') {
    const listEntry = document.createElement(transformTag('li'));
    listEntry.innerText = msg;
    document.getElementById(id).appendChild(listEntry);
}

export { output as o };
