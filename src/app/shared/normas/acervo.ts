import { Injectable, signal } from '@angular/core';
import { NORMAS_EXEMPLO } from './normas-exemplo';
import { NormaLeitura } from './norma';
import { NORMA_CNPQ } from './norma-cnpq';

@Injectable({ providedIn: 'root' })
export class Acervo {
  private readonly documentos = signal<readonly NormaLeitura[]>([NORMA_CNPQ, ...NORMAS_EXEMPLO]);
  readonly normas = this.documentos.asReadonly();
}
