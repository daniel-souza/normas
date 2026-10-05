import { BlocoNormativo, LeituraNormativa, TipoBloco } from './bloco-normativo';

const PADROES: readonly [TipoBloco, RegExp][] = [
  ['artigo', /^(Art\.\s*\d+(?:[º°o])?(?:-[A-Z]+)?\.?)(?:\s+|$)(.*)$/i],
  ['paragrafo', /^(Parágrafo único\.?|§\s*\d+(?:[º°o])?(?:-[A-Z]+)?\.?)(?:\s+|$)(.*)$/i],
  ['inciso', /^([IVXLCDM]+\s*[-–—])\s*(.*)$/],
  ['alinea', /^([a-z]\))\s*(.*)$/],
  ['item', /^(\d+\.)\s+(.*)$/],
];

/**
 * Leitura conservadora de texto simples: não corrige nem renumera dispositivos.
 * HTML/PDF, tabelas e redações de alteração exigem adaptadores próprios.
 */
export function interpretarNorma(original: string): LeituraNormativa {
  const blocos: BlocoNormativo[] = [];
  const avisos: string[] = [];
  let artigo: BlocoNormativo | undefined;
  let paragrafo: BlocoNormativo | undefined;
  let inciso: BlocoNormativo | undefined;
  let alinea: BlocoNormativo | undefined;
  let esperaTitulo = false;
  let emAnexo = false;
  let aspasAbertas: string | undefined;

  for (const [indice, linhaOriginal] of original.split(/\r\n|\n|\r/).entries()) {
    const linha = linhaOriginal.trim();
    if (!linha) continue;
    const id = `linha-${indice + 1}`;
    let tipo: TipoBloco = 'texto';
    let rotulo = '';
    let texto = linhaOriginal;
    let pai: BlocoNormativo | undefined;
    let profundidade = 0;
    const abreCitacao = /^[“"]/.test(linha);
    const citacao = !!aspasAbertas || abreCitacao;
    if (abreCitacao && !aspasAbertas) {
      aspasAbertas = linha.startsWith('“') ? '”' : '"';
      avisos.push(
        `Linha ${indice + 1}: citação preservada como texto; a estrutura interna exige revisão.`,
      );
      if (linha.slice(1).includes(aspasAbertas)) aspasAbertas = undefined;
    } else if (aspasAbertas && linha.includes(aspasAbertas)) {
      aspasAbertas = undefined;
    }

    if (/^ANEXO(?:\s|$)/i.test(linha) && !citacao) {
      emAnexo = true;
      artigo = paragrafo = inciso = alinea = undefined;
      avisos.push(
        `Linha ${indice + 1}: anexo preservado como texto; tabelas e estrutura própria exigem revisão.`,
      );
    }

    if (!citacao && !emAnexo) {
      if (/^(?:PARTE|LIVRO|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\s+\S+/i.test(linha)) {
        tipo = 'agrupamento';
        esperaTitulo = true;
        artigo = paragrafo = inciso = alinea = undefined;
      } else {
        for (const [candidato, padrao] of PADROES) {
          const correspondencia = linha.match(padrao);
          if (!correspondencia) continue;
          tipo = candidato;
          rotulo = correspondencia[1];
          texto = correspondencia[2];
          break;
        }
        if (tipo === 'texto' && esperaTitulo && linha === linha.toLocaleUpperCase('pt-BR'))
          tipo = 'titulo';
        esperaTitulo = false;

        if (tipo === 'paragrafo') pai = artigo;
        if (tipo === 'inciso') pai = paragrafo ?? artigo;
        if (tipo === 'alinea') pai = inciso;
        if (tipo === 'item') pai = alinea;
        if (['paragrafo', 'inciso', 'alinea', 'item'].includes(tipo) && !pai) {
          avisos.push(
            `Linha ${indice + 1}: ${tipo} sem dispositivo superior reconhecido; texto preservado.`,
          );
          tipo = 'texto';
          rotulo = '';
          texto = linhaOriginal;
        }
        if (pai) profundidade = pai.profundidade + 1;
      }
    }

    const bloco: BlocoNormativo = {
      id,
      tipo,
      rotulo,
      texto,
      original: linhaOriginal,
      linha: indice + 1,
      profundidade,
      ...(pai ? { paiId: pai.id } : {}),
    };
    blocos.push(bloco);
    if (tipo === 'artigo') {
      artigo = bloco;
      paragrafo = inciso = alinea = undefined;
    } else if (tipo === 'paragrafo') {
      paragrafo = bloco;
      inciso = alinea = undefined;
    } else if (tipo === 'inciso') {
      inciso = bloco;
      alinea = undefined;
    } else if (tipo === 'alinea') alinea = bloco;
  }

  if (original.trim() && !blocos.some((bloco) => bloco.tipo === 'artigo')) {
    avisos.push(
      'Nenhum artigo reconhecido. O conteúdo permanece disponível como texto para revisão.',
    );
  }
  return { original, blocos, avisos };
}
