import { BlocoNormativo, TipoBloco } from './bloco-normativo';
import { ConteudoNorma, NormaEstruturada } from './conteudo-norma';
import { NormaLeitura } from './norma';

const DISPOSITIVOS = new Set(['artigo', 'paragrafo', 'inciso', 'alinea', 'item']);

export function textoConteudo(conteudo: readonly ConteudoNorma[]): string {
  return conteudo
    .map((no) => {
      if (no.tipo === 'texto') return no.trechos.map((trecho) => trecho.texto).join('');
      if (no.tipo === 'tabela') {
        return no.linhas
          .map((linha) => linha.celulas.map((celula) => textoConteudo(celula.conteudo)).join('\t'))
          .join('\n');
      }
      return [no.rotulo, no.titulo, textoConteudo(no.conteudo)].filter(Boolean).join('\n');
    })
    .join('\n');
}

/** Mantém os IDs, a ordem, os trechos e a estrutura de tabelas do documento. */
export function blocosDoConteudo(
  conteudo: readonly ConteudoNorma[],
  paiId?: string,
  profundidade = 0,
): BlocoNormativo[] {
  return conteudo.flatMap((no) => {
    const base = { id: no.id, linha: 0, profundidade, paiId };
    if (no.tipo === 'texto') {
      const texto = no.trechos.map((trecho) => trecho.texto).join('');
      return [
        {
          ...base,
          tipo: 'texto',
          rotulo: '',
          texto,
          original: texto,
          trechos: no.trechos,
          apresentacao: no.apresentacao,
        },
      ];
    }
    if (no.tipo === 'tabela') {
      return [
        {
          ...base,
          tipo: 'tabela',
          rotulo: '',
          texto: '',
          original: textoConteudo([no]),
          tabela: {
            numeroColunas: no.numeroColunas,
            apresentacao: no.apresentacao,
            linhas: no.linhas.map((linha) => ({
              id: linha.id,
              celulas: linha.celulas.map((celula) => ({
                id: celula.id,
                tipo: celula.tipo,
                colspan: celula.colspan,
                rowspan: celula.rowspan,
                apresentacao: celula.apresentacao,
                blocos: blocosDoConteudo(celula.conteudo, no.id),
              })),
            })),
          },
        },
      ];
    }
    const dispositivo = DISPOSITIVOS.has(no.categoria);
    const primeiroTexto =
      dispositivo && no.conteudo[0]?.tipo === 'texto' ? no.conteudo[0] : undefined;
    const texto = primeiroTexto?.trechos.map((trecho) => trecho.texto).join('') ?? '';
    const tipo: TipoBloco = dispositivo
      ? (no.categoria as TipoBloco)
      : no.categoria === 'assinatura'
        ? 'assinatura'
        : 'agrupamento';
    const bloco: BlocoNormativo = {
      ...base,
      tipo,
      categoria: no.categoria,
      rotulo: no.rotulo ?? '',
      titulo: no.titulo,
      texto: dispositivo ? texto : (no.rotulo ?? ''),
      original: [no.rotulo, texto].filter(Boolean).join(' '),
      trechos: primeiroTexto?.trechos,
      profundidade: no.categoria === 'artigo' || !dispositivo ? 0 : profundidade,
    };
    const filhos = primeiroTexto ? no.conteudo.slice(1) : no.conteudo;
    const blocosFilhos = blocosDoConteudo(filhos, no.id, dispositivo ? bloco.profundidade + 1 : 0);
    return [
      bloco,
      ...blocosFilhos.map((filho) =>
        no.categoria === 'assinatura' && filho.tipo === 'texto'
          ? { ...filho, tipo: 'assinatura' as const }
          : filho,
      ),
    ];
  });
}

export function adaptarNorma(documento: NormaEstruturada): NormaLeitura {
  const texto = textoConteudo(documento.conteudo);
  return {
    id: documento.id,
    categoria: documento.identificacao.especie,
    epigrafe: documento.identificacao.epigrafe,
    ementa: documento.identificacao.ementa,
    preambulo: '',
    dataAto: documento.identificacao.dataAto,
    dataPublicacao: documento.publicacoes[0]?.data ?? null,
    situacao: documento.situacao,
    texto,
    assinaturas: [],
    demonstracao: false,
    fontes: documento.fontes,
    publicacoes: documento.publicacoes,
    extracao: documento.extracao,
    leitura: { original: texto, blocos: blocosDoConteudo(documento.conteudo), avisos: [] },
  };
}
