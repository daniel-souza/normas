import { interpretarNorma } from './parser-norma';

describe('interpretarNorma', () => {
  it('relaciona dispositivos ao superior correto e reinicia o contexto a cada artigo', () => {
    const { blocos } = interpretarNorma(`Art. 1º Caput.
I - inciso do caput;
a) alínea;
1. item.
§ 1º Parágrafo.
I - inciso do parágrafo.
Art. 2º Outro artigo.
Parágrafo único. Texto.`);
    expect(blocos.map((bloco) => bloco.tipo)).toEqual([
      'artigo',
      'inciso',
      'alinea',
      'item',
      'paragrafo',
      'inciso',
      'artigo',
      'paragrafo',
    ]);
    expect(blocos[1].paiId).toBe(blocos[0].id);
    expect(blocos[2].paiId).toBe(blocos[1].id);
    expect(blocos[3].paiId).toBe(blocos[2].id);
    expect(blocos[5].paiId).toBe(blocos[4].id);
    expect(blocos[7].paiId).toBe(blocos[6].id);
  });

  it('preserva texto original, numeração acrescida, ordinais e pontuação', () => {
    const original =
      '  Art. 9º Texto.\r\n\r\nArt. 10-A. Texto alterado.\r\n§ 10. Texto.\r\nII – conteúdo;';
    const leitura = interpretarNorma(original);
    expect(leitura.original).toBe(original);
    expect(leitura.blocos[0].original).toBe('  Art. 9º Texto.');
    expect(leitura.blocos.map((bloco) => bloco.rotulo)).toEqual([
      'Art. 9º',
      'Art. 10-A.',
      '§ 10.',
      'II –',
    ]);
  });

  it('mantém dispositivos órfãos como texto e avisa sobre a ambiguidade', () => {
    const leitura = interpretarNorma('a) Sem inciso.\n1. Sem alínea.\n§ 1º Sem artigo.');
    expect(leitura.blocos.every((bloco) => bloco.tipo === 'texto')).toBe(true);
    expect(leitura.avisos).toHaveLength(4);
    expect(leitura.blocos[0].original).toBe('a) Sem inciso.');
  });

  it('reconhece agrupamentos e conserva títulos', () => {
    const leitura = interpretarNorma('CAPÍTULO I\nDISPOSIÇÕES GERAIS\nArt. 1º Texto.');
    expect(leitura.blocos.map((bloco) => bloco.tipo)).toEqual(['agrupamento', 'titulo', 'artigo']);
  });

  it('não incorpora artigos de citações ou anexos ao índice principal', () => {
    const leitura = interpretarNorma(
      'Art. 1º Altera a seguinte redação:\n“Art. 7º Redação citada.\n§ 1º Texto citado.”\nArt. 2º Vigência.\nANEXO I\nArt. 1º Conteúdo do anexo.',
    );
    expect(
      leitura.blocos.filter((bloco) => bloco.tipo === 'artigo').map((bloco) => bloco.rotulo),
    ).toEqual(['Art. 1º', 'Art. 2º']);
    expect(leitura.avisos).toHaveLength(2);
  });

  it('não descarta texto livre, notas, links ou HTML recebido como texto', () => {
    const leitura = interpretarNorma(
      'Art. 1º Texto.\n(Vide outra norma.)\n<script>alert(1)</script>\nhttps://example.org',
    );
    expect(leitura.blocos).toHaveLength(4);
    expect(leitura.blocos[2].original).toBe('<script>alert(1)</script>');
  });

  it('aceita texto vazio sem inventar dispositivos', () => {
    expect(interpretarNorma('')).toEqual({ original: '', blocos: [], avisos: [] });
  });
});
