import { Injectable, signal } from '@angular/core';
import { NORMAS_EXEMPLO } from './normas-exemplo';
import { NormaLeitura } from './norma';

@Injectable({ providedIn: 'root' })
export class Acervo {
  private readonly documentos = signal<readonly NormaLeitura[]>(NORMAS_EXEMPLO);
  readonly normas = this.documentos.asReadonly();
}
