export const createAndAppendElement = (text: string) => {
  const p = document.createElement('p');
  p.textContent = text;

  document.body.appendChild(p);
};
