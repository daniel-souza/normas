import { describe, expect, it } from 'vitest';
import { normalizarColagem } from './colar-editor';

describe('colagem no editor', () => {
  it('preserva marcadores explícitos de listas e sua sequência', () => {
    const html = normalizarColagem(
      '<ol type="I" start="2"><li><p>Regra</p></li><li value="5">Outra regra</li></ol><ol type="a"><li>Detalhe</li></ol>',
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect([...doc.querySelectorAll('p')].map((p) => p.textContent)).toEqual([
      'II - Regra',
      'V - Outra regra',
      'a) Detalhe',
    ]);
  });
  it('remove conteúdo executável e classificações externas sem destruir tabelas ou marcas', () => {
    const html = normalizarColagem(
      '<p onclick="alert(1)" data-norma-tipo="artigo"><b>Regra</b><a href="javascript:alert(1)">link</a></p><script>alert(1)</script><table><tr><td colspan="2" rowspan="3">Dados</td></tr></table>',
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('script, [onclick], [data-norma-tipo], a[href]')).toBeNull();
    expect(doc.querySelector('b')?.textContent).toBe('Regra');
    expect(doc.querySelector('td')?.getAttribute('rowspan')).toBe('3');
    expect(doc.querySelector('td')?.getAttribute('colspan')).toBe('2');
  });
});
