import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CategoriaParte,
  ConteudoNorma,
  TabelaNorma,
  TextoNorma,
} from '../../shared/normas/conteudo-norma';

const CATEGORIAS: readonly CategoriaParte[] = [
  'parte',
  'livro',
  'titulo',
  'capitulo',
  'secao',
  'subsecao',
  'artigo',
  'paragrafo',
  'inciso',
  'alinea',
  'item',
  'assinatura',
  'anexo',
  'grupo',
];
export function novoId(prefixo: string): string {
  return `${prefixo}-${crypto.randomUUID()}`;
}
function novoTexto(): TextoNorma {
  return { id: novoId('texto'), tipo: 'texto', trechos: [{ texto: '' }] };
}

@Component({
  selector: 'app-editor-conteudo',
  imports: [FormsModule],
  templateUrl: './editor-conteudo.html',
  styleUrl: './editor-conteudo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorConteudo {
  readonly conteudo = input.required<readonly ConteudoNorma[]>();
  readonly contexto = input('Conteúdo da norma');
  readonly alterar = output<readonly ConteudoNorma[]>();
  readonly categorias = CATEGORIAS;
  readonly controleId = novoId('adicionar');
  escolha: CategoriaParte | 'texto' | 'tabela' = 'artigo';
  removerPendente: string | null = null;

  atualizar(indice: number, no: ConteudoNorma): void {
    this.alterar.emit(this.conteudo().map((atual, i) => (i === indice ? no : atual)));
  }
  campo(indice: number, no: ConteudoNorma, chave: string, valor: string): void {
    this.atualizar(indice, { ...no, [chave]: valor });
  }
  filhos(indice: number, no: ConteudoNorma, conteudo: readonly ConteudoNorma[]): void {
    if (no.tipo === 'parte') this.atualizar(indice, { ...no, conteudo });
  }
  trecho(indice: number, no: TextoNorma, posicao: number, texto: string): void {
    this.atualizar(indice, {
      ...no,
      trechos: no.trechos.map((trecho, i) => (i === posicao ? { ...trecho, texto } : trecho)),
    });
  }
  adicionarTrecho(indice: number, no: TextoNorma): void {
    this.atualizar(indice, { ...no, trechos: [...no.trechos, { texto: '' }] });
  }
  celula(
    indice: number,
    no: TabelaNorma,
    linha: number,
    celula: number,
    conteudo: readonly ConteudoNorma[],
  ): void {
    this.atualizar(indice, {
      ...no,
      linhas: no.linhas.map((atual, l) =>
        l !== linha
          ? atual
          : {
              ...atual,
              celulas: atual.celulas.map((atual, c) =>
                c === celula ? { ...atual, conteudo } : atual,
              ),
            },
      ),
    });
  }
  mover(indice: number, deslocamento: number): void {
    const proximo = [...this.conteudo()];
    const destino = indice + deslocamento;
    if (destino < 0 || destino >= proximo.length) return;
    [proximo[indice], proximo[destino]] = [proximo[destino], proximo[indice]];
    this.alterar.emit(proximo);
  }
  remover(id: string): void {
    this.alterar.emit(this.conteudo().filter((no) => no.id !== id));
    this.removerPendente = null;
  }
  adicionar(): void {
    let no: ConteudoNorma;
    if (this.escolha === 'texto') no = novoTexto();
    else if (this.escolha === 'tabela')
      no = {
        id: novoId('tabela'),
        tipo: 'tabela',
        numeroColunas: 2,
        layout: 'normalizado',
        linhas: Array.from({ length: 2 }, () => ({
          id: novoId('linha'),
          celulas: Array.from({ length: 2 }, () => ({
            id: novoId('celula'),
            tipo: 'td',
            colspan: 1,
            rowspan: 1,
            conteudo: [novoTexto()],
          })),
        })),
      };
    else
      no = {
        id: novoId(this.escolha),
        tipo: 'parte',
        categoria: this.escolha,
        rotulo: '',
        titulo: '',
        conteudo: ['artigo', 'paragrafo', 'inciso', 'alinea', 'item', 'assinatura'].includes(
          this.escolha,
        )
          ? [novoTexto()]
          : [],
      };
    this.alterar.emit([...this.conteudo(), no]);
  }
}
