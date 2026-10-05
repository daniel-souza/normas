import { criarIndice, LIMITE_PREVIA_ARTIGO, resumirArtigo } from './indice-norma';
import { interpretarNorma } from './parser-norma';
import { NORMA_CNPQ } from './norma-cnpq';

describe('índice de normas', () => {
  it('preserva capítulos com rótulo repetido e distribui os artigos pelas seções do JSON', () => {
    const indice = criarIndice(NORMA_CNPQ.leitura!.blocos);
    expect(indice.map((item) => item.id)).toEqual([
      'capitulo-1',
      'capitulo-2',
      'capitulo-3',
      'anexo-i',
    ]);
    expect(indice[0].rotulo).toBe('CAPÍTULO I');
    expect(indice[1].rotulo).toBe('CAPÍTULO I');
    expect(indice[0].filhos.map((item) => item.id)).toEqual(['art-1', 'art-2']);
    expect(indice[1].filhos.map((item) => item.rotulo)).toEqual([
      'Seção I',
      'Seção II',
      'Seção III',
      'Seção IV',
    ]);
    expect(indice[1].filhos[2].filhos.map((item) => item.id)).toEqual(['art-5', 'art-6']);
    expect(indice[1].filhos[3].filhos.map((item) => item.id)).toEqual(
      Array.from({ length: 9 }, (_, i) => `art-${i + 7}`),
    );
    expect(indice[2].filhos.map((item) => item.id)).toEqual([
      'art-16',
      'art-17',
      'art-18',
      'art-19',
      'art-20',
    ]);
  });

  it('reconhece subseções em texto simples e reinicia a hierarquia a cada capítulo', () => {
    const leitura = interpretarNorma(`Art. 1º Artigo sem capítulo.
CAPÍTULO I
Disposições gerais
Seção I
Do acesso
Subseção I
Da habilitação
Art. 2º Artigo da subseção.
Seção II
Das condições
Art. 3º Artigo da seção.
CAPÍTULO II
Disposições finais
Art. 4º Artigo do capítulo.`);
    const indice = criarIndice(leitura.blocos);
    expect(indice[0].rotulo).toBe('Art. 1º');
    expect(indice[1].titulo).toBe('Disposições gerais');
    expect(indice[1].filhos[0].filhos[0].rotulo).toBe('Subseção I');
    expect(indice[1].filhos[0].filhos[0].filhos[0].rotulo).toBe('Art. 2º');
    expect(indice[1].filhos[1].filhos[0].rotulo).toBe('Art. 3º');
    expect(indice[2].filhos[0].rotulo).toBe('Art. 4º');
  });

  it('limita a prévia a 90 caracteres, incluindo os três pontos, sem cortar caracteres Unicode', () => {
    expect(resumirArtigo('Texto curto.')).toBe('Texto curto.');
    expect(resumirArtigo('a'.repeat(90))).toHaveLength(90);
    expect(resumirArtigo('a'.repeat(91))).toBe('a'.repeat(87) + '...');
    expect(Array.from(resumirArtigo('🌱'.repeat(100)))).toHaveLength(LIMITE_PREVIA_ARTIGO);
    expect(resumirArtigo('Primeira\n   linha.')).toBe('Primeira linha.');
    const artigo = criarIndice(NORMA_CNPQ.leitura!.blocos)[0].filhos[0];
    expect(artigo.previa.endsWith('...')).toBe(true);
    expect(artigo.textoCompleto).toContain('para fins não comerciais.');
  });
});
