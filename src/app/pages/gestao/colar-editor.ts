/** Normaliza a colagem HTML antes de o schema do editor selecionar os recursos suportados. */
export function normalizarColagem(html: string): string {
  const documento = new DOMParser().parseFromString(html, 'text/html');
  documento
    .querySelectorAll(
      'script, style, iframe, object, embed, svg, math, img, input, button, meta, link',
    )
    .forEach((no) => no.remove());
  for (const elemento of documento.body.querySelectorAll('*')) {
    for (const atributo of Array.from(elemento.attributes)) {
      if (
        !['style', 'href', 'colspan', 'rowspan', 'start', 'type', 'value', 'align'].includes(
          atributo.name,
        )
      ) {
        elemento.removeAttribute(atributo.name);
      }
    }
    const href = elemento.getAttribute('href');
    if (href) {
      try {
        const url = new URL(href);
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol) || url.username || url.password)
          elemento.removeAttribute('href');
      } catch {
        elemento.removeAttribute('href');
      }
    }
  }
  // Listas HTML fornecem seu marcador; nunca deduzimos uma numeração ausente só pelo recuo.
  for (const lista of Array.from(documento.querySelectorAll('ol, ul')).reverse()) {
    let numero = Number(lista.getAttribute('start')) || 1;
    const estilo = lista.getAttribute('type') ?? (lista as HTMLElement).style.listStyleType;
    const fragmento = documento.createDocumentFragment();
    for (const item of Array.from(lista.children)) {
      if (item.tagName !== 'LI') continue;
      numero = Number(item.getAttribute('value')) || numero;
      let marcador = `${numero}.`;
      if (lista.tagName === 'UL') marcador = '•';
      else if (['I', 'upper-roman'].includes(estilo)) marcador = `${romano(numero)} -`;
      else if (['i', 'lower-roman'].includes(estilo)) marcador = `${romano(numero).toLowerCase()}.`;
      else if (['a', 'lower-alpha', 'lower-latin'].includes(estilo))
        marcador = `${alfabetico(numero)})`;
      else if (['A', 'upper-alpha', 'upper-latin'].includes(estilo))
        marcador = `${alfabetico(numero).toUpperCase()}.`;
      const primeiro = item.firstElementChild;
      if (primeiro?.tagName === 'P') {
        primeiro.prepend(documento.createTextNode(`${marcador} `));
        fragmento.append(...Array.from(item.childNodes));
      } else {
        const paragrafo = documento.createElement('p');
        paragrafo.append(documento.createTextNode(`${marcador} `), ...Array.from(item.childNodes));
        fragmento.append(paragrafo);
      }
      numero++;
    }
    lista.replaceWith(fragmento);
  }
  return documento.body.innerHTML;
}
function alfabetico(numero: number): string {
  let resultado = '';
  for (let n = Math.max(1, Math.min(10000, numero)); n > 0; n = Math.floor((n - 1) / 26)) {
    resultado = String.fromCharCode(97 + ((n - 1) % 26)) + resultado;
  }
  return resultado;
}
function romano(numero: number): string {
  if (numero < 1 || numero > 3999) return String(numero);
  let resultado = '';
  for (const [valor, letra] of [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ] as const) {
    while (numero >= valor) {
      resultado += letra;
      numero -= valor;
    }
  }
  return resultado;
}
