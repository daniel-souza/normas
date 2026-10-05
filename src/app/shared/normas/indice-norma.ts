import { BlocoNormativo } from './bloco-normativo';

export interface EntradaIndice {
  readonly id: string;
  readonly tipo: 'grupo' | 'artigo';
  readonly rotulo: string;
  readonly titulo: string;
  readonly previa: string;
  readonly textoCompleto: string;
  readonly filhos: EntradaIndice[];
}

export const LIMITE_PREVIA_ARTIGO = 90;

/** O limite inclui os três pontos e conta caracteres Unicode, não unidades UTF-16. */
export function resumirArtigo(texto: string, limite = LIMITE_PREVIA_ARTIGO): string {
  const normalizado = texto.replace(/\s+/g, ' ').trim();
  const caracteres = Array.from(normalizado);
  if (caracteres.length <= limite) return normalizado;
  return (
    caracteres
      .slice(0, Math.max(0, limite - 3))
      .join('')
      .trimEnd() + '...'
  );
}

const NIVEIS: Record<string, number> = {
  parte: 0,
  livro: 1,
  titulo: 2,
  capitulo: 3,
  secao: 4,
  subsecao: 5,
  anexo: 0,
  grupo: 1,
};

function nivel(bloco: BlocoNormativo): number {
  const categoria =
    bloco.categoria ??
    bloco.texto
      .split(/\s+/)[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return NIVEIS[categoria] ?? 0;
}

/** Usa os pais do JSON quando presentes e a ordem dos agrupamentos no texto simples. */
export function criarIndice(blocos: readonly BlocoNormativo[]): EntradaIndice[] {
  const raiz: EntradaIndice[] = [];
  const grupos = new Map<string, EntradaIndice>();
  const pilha: { nivel: number; entrada: EntradaIndice }[] = [];
  for (const [indice, bloco] of blocos.entries()) {
    if (bloco.tipo !== 'agrupamento' && bloco.tipo !== 'artigo') continue;
    const artigo = bloco.tipo === 'artigo';
    const entrada: EntradaIndice = {
      id: bloco.id,
      tipo: artigo ? 'artigo' : 'grupo',
      rotulo: artigo ? bloco.rotulo : bloco.rotulo || bloco.texto,
      titulo: artigo
        ? ''
        : (bloco.titulo ?? (blocos[indice + 1]?.tipo === 'titulo' ? blocos[indice + 1].texto : '')),
      previa: artigo ? resumirArtigo(bloco.texto) : '',
      textoCompleto: artigo ? bloco.texto : '',
      filhos: [],
    };
    const nivelAtual = nivel(bloco);
    if (!artigo) while (pilha.length && pilha[pilha.length - 1].nivel >= nivelAtual) pilha.pop();
    const pai = bloco.paiId ? grupos.get(bloco.paiId) : pilha[pilha.length - 1]?.entrada;
    (pai?.filhos ?? raiz).push(entrada);
    if (!artigo) {
      grupos.set(bloco.id, entrada);
      pilha.push({ nivel: nivelAtual, entrada });
    }
  }
  return raiz;
}
