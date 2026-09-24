export default function (msg: string, id = 'lifecycle-loads') {
  const listEntry = document.createElement('li');
  listEntry.innerText = msg;
  document.getElementById(id)!.appendChild(listEntry);
}
