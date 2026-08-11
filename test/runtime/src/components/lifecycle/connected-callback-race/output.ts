export default function (msg: string, id = 'connected-callback-race-log') {
  const listEntry = document.createElement('li');
  listEntry.innerText = msg;
  document.getElementById(id)!.appendChild(listEntry);
}
