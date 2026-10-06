import { describe, expect, it } from 'vitest';
import { documentoDeTexto, interpretarDocumentoEditor } from './documento-editor';
import type { JSONContent } from '@tiptap/core';

describe('documento contínuo', () => {
  it('quebra visual dentro do artigo preserva o reconhecimento e todo o conteúdo', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'artigo' },
          content: [
            { type: 'text', text: 'Art. 1º Primeira linha.' },
            { type: 'hardBreak' },
            { type: 'text', text: 'Continuação na mesma unidade.' },
          ],
        },
      ],
    };
    const bloco = interpretarDocumentoEditor(doc).leitura.blocos[0];
    expect(bloco.tipo).toBe('artigo');
    expect(bloco.rotulo).toBe('Art. 1º');
    expect(bloco.trechos?.map((t) => t.texto).join('')).toBe(
      'Primeira linha.\nContinuação na mesma unidade.',
    );
  });
  it('reconhece hierarquia e mantém IDs ao inserir um parágrafo antes', () => {
    const doc = documentoDeTexto(
      'CAPÍTULO I\nDisposições\nArt. 1º Regra.\n§ 1º Detalhe.\nI - condição;\na) exemplo;\n1. item.',
    );
    const blocos = interpretarDocumentoEditor(doc).leitura.blocos;
    expect(blocos.map((b) => b.tipo)).toEqual([
      'agrupamento',
      'titulo',
      'artigo',
      'paragrafo',
      'inciso',
      'alinea',
      'item',
    ]);
    for (let i = 3; i < blocos.length; i++) expect(blocos[i].paiId).toBe(blocos[i - 1].id);
    expect(blocos[2].paiId).toBe(blocos[0].id);
    const antes = documentoDeTexto('Abertura.').content!;
    const depois = interpretarDocumentoEditor({ ...doc, content: [...antes, ...doc.content!] })
      .leitura.blocos;
    expect(depois.slice(1).map((b) => b.id)).toEqual(blocos.map((b) => b.id));
  });

  it('a escolha manual prevalece sobre marcadores e agrupa vários parágrafos', () => {
    const doc = documentoDeTexto(
      'Art. 1º Texto que faz parte da abertura.\nComplemento.\nArt. 2º Regra.',
    );
    doc.content!.slice(0, 2).forEach((no) => {
      no.attrs = { ...no.attrs, normaTipo: 'preambulo', normaGrupo: 'abertura' };
    });
    const analise = interpretarDocumentoEditor(doc);
    expect(analise.leitura.blocos.map((b) => b.tipo)).toEqual(['preambulo', 'texto', 'artigo']);
    expect(analise.elementos[1].unidadeId).toBe(analise.elementos[0].id);
    expect(analise.leitura.blocos[1].paiId).toBe(analise.leitura.blocos[0].id);
    expect(analise.leitura.blocos[0].original).toContain('Art. 1º');
  });

  it('mantém artigos e preâmbulos vazios no rascunho sem fabricar texto na leitura', () => {
    const doc = documentoDeTexto('\n');
    doc.content![0].attrs!['normaTipo'] = 'preambulo';
    doc.content![1].attrs!['normaTipo'] = 'artigo';
    const original = JSON.stringify(doc);
    const analise = interpretarDocumentoEditor(doc);
    expect(analise.leitura.blocos).toEqual([]);
    expect(analise.elementos.map((e) => [e.tipo, e.vazio])).toEqual([
      ['preambulo', true],
      ['artigo', true],
    ]);
    expect(JSON.stringify(doc)).toBe(original);
  });

  it('continuação mantém o vínculo e o texto livre manual abre sua própria unidade', () => {
    const doc = documentoDeTexto('Art. 1º Regra.\nComplemento.\nArt. 99º Literal.');
    doc.content![2].attrs!['normaTipo'] = 'texto';
    const analise = interpretarDocumentoEditor(doc);
    expect(analise.leitura.blocos[1].paiId).toBe(analise.leitura.blocos[0].id);
    expect(analise.leitura.blocos[2].tipo).toBe('texto');
    expect(analise.leitura.blocos[2].rotulo).toBe('');
    expect(analise.elementos[2].origem).toBe('manual');
  });

  it('preserva negrito e links quando retira o rótulo do artigo', () => {
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'artigo' },
          content: [
            { type: 'text', text: 'Art. 1º ' },
            {
              type: 'text',
              text: 'Regra',
              marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.org' } }],
            },
          ],
        },
      ],
    };
    const bloco = interpretarDocumentoEditor(doc).leitura.blocos[0];
    expect(bloco.rotulo).toBe('Art. 1º');
    expect(bloco.trechos).toEqual([
      { texto: 'Regra', marcas: ['negrito'], href: 'https://example.org' },
    ]);
  });

  it('preserva a geometria de tabelas e não interpreta marcadores nas células', () => {
    const celula = (text: string, attrs = {}) => ({
      type: 'tableCell',
      attrs,
      content: documentoDeTexto(text).content,
    });
    const doc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'table',
          attrs: { id: 'tabela' },
          content: [
            {
              type: 'tableRow',
              content: [
                celula('Art. 1º É um exemplo.', { rowspan: 2 }),
                celula('Cabeçalho', { colspan: 2 }),
              ],
            },
            { type: 'tableRow', content: [celula('A'), celula('B')] },
          ],
        },
      ],
    };
    const tabela = interpretarDocumentoEditor(doc).leitura.blocos[0].tabela!;
    expect(tabela.numeroColunas).toBe(3);
    expect(tabela.linhas[0].celulas[0].rowspan).toBe(2);
    expect(tabela.linhas[0].celulas[1].colspan).toBe(2);
    expect(tabela.linhas[0].celulas[0].blocos[0].tipo).toBe('texto');
  });

  it('citações e anexos conservam texto sem criar artigos automaticamente', () => {
    const doc = documentoDeTexto('“Art. 1º Exemplo citado.”\nANEXO I\nArt. 2º Modelo anexado.');
    expect(interpretarDocumentoEditor(doc).leitura.blocos.map((b) => b.tipo)).toEqual([
      'texto',
      'agrupamento',
      'texto',
    ]);
  });
});
