import type { JSONContent } from '@tiptap/core';
import { BlocoNormativo, LeituraNormativa, TipoBloco } from './bloco-normativo';
import { CategoriaParte, TrechoNorma } from './conteudo-norma';
import { PADROES } from './parser-norma';

export const TIPOS_EDITOR = [
  ['texto', 'Texto livre'],
  ['preambulo', 'Preâmbulo'],
  ['parte', 'Parte'],
  ['livro', 'Livro'],
  ['titulo', 'Título'],
  ['capitulo', 'Capítulo'],
  ['secao', 'Seção'],
  ['subsecao', 'Subseção'],
  ['artigo', 'Artigo'],
  ['paragrafo', 'Parágrafo'],
  ['inciso', 'Inciso'],
  ['alinea', 'Alínea'],
  ['item', 'Item'],
  ['assinatura', 'Assinatura'],
  ['anexo', 'Anexo'],
] as const;
export type TipoEditor = (typeof TIPOS_EDITOR)[number][0] | 'continuacao';
export interface ElementoEditor {
  id: string;
  tipo: string;
  nome: string;
  origem: 'manual' | 'automatico';
  unidadeId: string;
  vazio: boolean;
}
export interface AnaliseEditor {
  leitura: LeituraNormativa;
  elementos: ElementoEditor[];
}
const NIVEIS: Record<string, number> = {
  parte: 0,
  livro: 1,
  titulo: 2,
  capitulo: 3,
  secao: 4,
  subsecao: 5,
  anexo: 0,
};
const nomes = Object.fromEntries(TIPOS_EDITOR);
export const nomeTipo = (tipo: string): string => nomes[tipo] ?? 'Texto livre';
export const idEditor = (): string => `ed-${crypto.randomUUID()}`;

export function documentoDeTexto(texto: string): JSONContent {
  return {
    type: 'doc',
    content: texto.split(/\r\n|\n|\r/).map((linha) => ({
      type: 'paragraph',
      attrs: { id: idEditor() },
      ...(linha ? { content: [{ type: 'text', text: linha }] } : {}),
    })),
  };
}

export function textoDoEditor(no: JSONContent): string {
  if (no.type === 'text') return no.text ?? '';
  if (no.type === 'hardBreak') return '\n';
  const separador = ['paragraph', 'heading'].includes(no.type ?? '')
    ? ''
    : no.type === 'tableRow'
      ? '\t'
      : '\n';
  return (no.content ?? []).map(textoDoEditor).join(separador);
}

function trechosDoEditor(no: JSONContent): TrechoNorma[] {
  if (no.type === 'hardBreak') return [{ texto: '\n' }];
  if (no.type !== 'text') return (no.content ?? []).flatMap(trechosDoEditor);
  const mapa = {
    bold: 'negrito',
    italic: 'italico',
    underline: 'sublinhado',
    strike: 'tachado',
  } as const;
  const marcas = (no.marks ?? []).flatMap((marca) => {
    const valor = mapa[marca.type as keyof typeof mapa];
    return valor ? [valor] : [];
  });
  return [
    {
      texto: no.text ?? '',
      marcas,
      href: no.marks?.find((m) => m.type === 'link')?.attrs?.['href'],
    },
  ];
}

/** Retira somente o prefixo reconhecido, sem perder as marcas do restante. */
function semPrefixo(trechos: TrechoNorma[], tamanho: number): TrechoNorma[] {
  return trechos.flatMap((trecho) => {
    const corte = Math.min(tamanho, trecho.texto.length);
    tamanho -= corte;
    return corte === trecho.texto.length ? [] : [{ ...trecho, texto: trecho.texto.slice(corte) }];
  });
}

/** Projeção determinística. Nunca altera o documento nem as escolhas manuais. */
export function interpretarDocumentoEditor(
  documento: JSONContent,
  dentroDeTabela = false,
): AnaliseEditor {
  const blocos: BlocoNormativo[] = [];
  const elementos: ElementoEditor[] = [];
  const avisos: string[] = [];
  const grupos: { id: string; nivel: number }[] = [];
  let artigo: BlocoNormativo | undefined;
  let paragrafo: BlocoNormativo | undefined;
  let inciso: BlocoNormativo | undefined;
  let alinea: BlocoNormativo | undefined;
  let ultimo: BlocoNormativo | undefined;
  let ultimoElemento: ElementoEditor | undefined;
  let grupoManual: string | null = null;
  let esperaTitulo = false;
  let emAnexo = false;
  let aspas: string | undefined;

  for (const [indice, no] of (documento.content ?? []).entries()) {
    const id = no.attrs?.['id'] ?? `bloco-${indice}`;
    if (no.type === 'table') {
      const linhas = (no.content ?? []).map((linha, l) => ({
        id: linha.attrs?.['id'] ?? `${id}-linha-${l}`,
        celulas: (linha.content ?? []).map((celula, c) => {
          const analise = interpretarDocumentoEditor(
            { type: 'doc', content: celula.content },
            true,
          );
          return {
            id: celula.attrs?.['id'] ?? `${id}-celula-${l}-${c}`,
            tipo: (celula.type === 'tableHeader' ? 'th' : 'td') as 'th' | 'td',
            colspan: celula.attrs?.['colspan'] ?? 1,
            rowspan: celula.attrs?.['rowspan'] ?? 1,
            blocos: analise.leitura.blocos,
          };
        }),
      }));
      // Ocupação considera mesclas verticais ao calcular a largura da grade.
      const ocupadas: number[] = [];
      let numeroColunas = 0;
      for (const [r, linha] of linhas.entries()) {
        let coluna = 0;
        for (const celula of linha.celulas) {
          while ((ocupadas[coluna] ?? 0) > r) coluna++;
          for (let c = 0; c < celula.colspan; c++) ocupadas[coluna + c] = r + celula.rowspan;
          coluna += celula.colspan;
          numeroColunas = Math.max(numeroColunas, coluna);
        }
      }
      blocos.push({
        id,
        tipo: 'tabela',
        linha: indice + 1,
        rotulo: '',
        texto: '',
        original: textoDoEditor(no),
        profundidade: ultimo?.profundidade ?? 0,
        paiId: ultimo?.id ?? grupos.at(-1)?.id ?? null,
        tabela: { numeroColunas, linhas },
      });
      elementos.push({
        id,
        tipo: 'tabela',
        nome: 'Tabela',
        origem: 'automatico',
        unidadeId: ultimo?.id ?? id,
        vazio: false,
      });
      continue;
    }
    const original = textoDoEditor(no);
    const texto = original.trim();
    const primeiraLinha = texto.split('\n', 1)[0];
    const manual = no.attrs?.['normaTipo'] as TipoEditor | null;
    const grupo = no.attrs?.['normaGrupo'] as string | null;
    let tipo: string = manual ?? 'texto';
    let rotulo = '';
    let corte = 0;
    let categoria: CategoriaParte | undefined;
    let pai: BlocoNormativo | undefined;
    let paiId: string | null = null;
    let profundidade = 0;
    const mesmaUnidade = !!manual && !!grupo && grupo === grupoManual;
    const abreCitacao = /^[“"]/.test(texto);
    const citacao = !!aspas || abreCitacao;
    if (abreCitacao && !aspas) {
      aspas = texto.startsWith('“') ? '”' : '"';
      if (texto.slice(1).includes(aspas)) aspas = undefined;
    } else if (aspas && texto.includes(aspas)) aspas = undefined;

    if (!manual && !dentroDeTabela && !citacao) {
      const agrupamento = texto.match(
        /^(PARTE|LIVRO|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO|ANEXO)(?:\s|$)/i,
      );
      if (agrupamento && (!emAnexo || agrupamento[1].toUpperCase() === 'ANEXO')) {
        tipo = agrupamento[1]
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
      } else if (!emAnexo) {
        for (const [candidato, padrao] of PADROES) {
          if (padrao.test(primeiraLinha)) {
            tipo = candidato;
            break;
          }
        }
        if (tipo === 'texto' && texto && esperaTitulo) tipo = 'titulo-agrupamento';
      }
    }
    if (!manual && citacao && texto)
      avisos.push(`Trecho ${indice + 1}: citação preservada como texto livre.`);
    const continua =
      mesmaUnidade ||
      tipo === 'continuacao' ||
      (!manual && tipo === 'texto' && !!ultimo && !citacao && !emAnexo && !esperaTitulo && !!texto);

    if (continua && ultimo) {
      tipo = 'texto';
      paiId = ultimo.id;
      profundidade = ultimo.profundidade;
    } else if (tipo in NIVEIS) {
      categoria = tipo as CategoriaParte;
      const nivel = NIVEIS[tipo];
      while (grupos.length && grupos.at(-1)!.nivel >= nivel) grupos.pop();
      paiId = grupos.at(-1)?.id ?? null;
      grupos.push({ id, nivel });
      artigo = paragrafo = inciso = alinea = ultimo = undefined;
      esperaTitulo = true;
      emAnexo = tipo === 'anexo';
      tipo = 'agrupamento';
    } else if (tipo === 'titulo-agrupamento') {
      tipo = 'titulo';
      paiId = grupos.at(-1)?.id ?? null;
      esperaTitulo = false;
    } else {
      if (texto || manual) esperaTitulo = false;
      if (tipo === 'continuacao') {
        tipo = 'texto';
        avisos.push(`Trecho ${indice + 1}: não há elemento anterior para continuar.`);
      }
      if (tipo === 'paragrafo') pai = artigo;
      if (tipo === 'inciso') pai = paragrafo ?? artigo;
      if (tipo === 'alinea') pai = inciso;
      if (tipo === 'item') pai = alinea;
      if (['paragrafo', 'inciso', 'alinea', 'item'].includes(tipo) && !pai) {
        avisos.push(
          `Trecho ${indice + 1}: ${nomeTipo(tipo)} sem elemento superior; confira o vínculo.`,
        );
        if (!manual) tipo = 'texto';
      }
      paiId =
        pai?.id ??
        (['preambulo', 'assinatura'].includes(tipo) ? null : (grupos.at(-1)?.id ?? null));
      profundidade = pai ? pai.profundidade + 1 : 0;
      if (tipo === 'preambulo' || tipo === 'assinatura') {
        artigo = paragrafo = inciso = alinea = undefined;
      }
    }
    const padrao = PADROES.find(([candidato]) => candidato === tipo)?.[1];
    const marcador = padrao ? primeiraLinha.match(padrao) : null;
    if (marcador) {
      rotulo = marcador[1];
      corte = original.indexOf(texto) + primeiraLinha.length - marcador[2].length;
    }
    const bloco: BlocoNormativo = {
      id,
      tipo: tipo as TipoBloco,
      categoria,
      rotulo,
      original,
      texto: corte ? original.slice(corte) : original,
      trechos: semPrefixo(trechosDoEditor(no), corte),
      linha: indice + 1,
      profundidade,
      paiId,
      apresentacao: { alinhamento: no.attrs?.['textAlign'] ?? undefined },
    };
    const elemento: ElementoEditor = {
      id,
      tipo: continua && ultimoElemento ? ultimoElemento.tipo : (categoria ?? tipo),
      nome:
        continua && ultimoElemento
          ? `${ultimoElemento.nome.replace(' · continuação', '')} · continuação`
          : tipo === 'titulo' && !categoria
            ? 'Título do agrupamento'
            : nomeTipo(categoria ?? tipo),
      origem: manual ? 'manual' : 'automatico',
      unidadeId: continua && ultimo ? ultimo.id : id,
      vazio: !texto,
    };
    elementos.push(elemento);
    // Vazios permanecem no rascunho; a leitura não fabrica dispositivos sem texto.
    if (texto) blocos.push(bloco);
    if (tipo === 'artigo') {
      artigo = bloco;
      paragrafo = inciso = alinea = undefined;
    }
    if (tipo === 'paragrafo') {
      paragrafo = bloco;
      inciso = alinea = undefined;
    }
    if (tipo === 'inciso') {
      inciso = bloco;
      alinea = undefined;
    }
    if (tipo === 'alinea') alinea = bloco;
    if (!continua && (texto || manual) && tipo !== 'agrupamento' && tipo !== 'titulo') {
      ultimo = bloco;
      ultimoElemento = elemento;
    }
    if (manual || texto) grupoManual = grupo;
  }
  return { leitura: { original: textoDoEditor(documento), blocos, avisos }, elementos };
}
