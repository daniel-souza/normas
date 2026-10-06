import { computed, Injectable, signal } from '@angular/core';
import { NORMAS_EXEMPLO } from './normas-exemplo';
import { NormaLeitura } from './norma';
import { DOCUMENTO_CNPQ, NORMA_CNPQ } from './norma-cnpq';
import { NormaEstruturada } from './conteudo-norma';
import { adaptarNorma } from './adaptar-norma';
import { validarNorma } from './validar-norma';

export interface RegistroAcervo {
  readonly norma: NormaLeitura;
  readonly estruturada?: NormaEstruturada;
}

@Injectable({ providedIn: 'root' })
export class Acervo {
  private readonly documentos = signal<readonly RegistroAcervo[]>([
    { norma: NORMA_CNPQ, estruturada: DOCUMENTO_CNPQ },
    ...NORMAS_EXEMPLO.map((norma) => ({ norma })),
  ]);
  readonly normas = computed(() => this.documentos().map((registro) => registro.norma));

  /** Rascunhos isolados: cancelar a edição não modifica o acervo. */
  obter(id: string): RegistroAcervo | undefined {
    const registro = this.documentos().find((item) => item.norma.id === id);
    return registro ? structuredClone(registro) : undefined;
  }

  salvarMock(registro: RegistroAcervo, idExistente?: string): void {
    const copia = structuredClone(registro);
    const norma = copia.estruturada ? adaptarNorma(validarNorma(copia.estruturada)) : copia.norma;
    if (norma.id !== copia.norma.id || (idExistente && norma.id !== idExistente))
      throw new Error('O identificador da norma deve ser preservado.');
    const existe = this.documentos().some((item) => item.norma.id === norma.id);
    if (idExistente ? !existe : existe)
      throw new Error(idExistente ? 'Norma não encontrada.' : 'Identificador já cadastrado.');
    const salvo = { ...copia, norma: { ...norma, alteracaoMock: true } };
    this.documentos.update((itens) =>
      idExistente
        ? itens.map((item) => (item.norma.id === idExistente ? salvo : item))
        : [...itens, salvo],
    );
  }

  excluirMock(id: string): void {
    this.documentos.update((itens) => itens.filter((item) => item.norma.id !== id));
  }
}
