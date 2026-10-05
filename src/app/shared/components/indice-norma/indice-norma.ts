import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { EntradaIndice } from '../../normas/indice-norma';

@Component({
  selector: 'app-indice-norma',
  imports: [NgTemplateOutlet],
  templateUrl: './indice-norma.html',
  styleUrl: './indice-norma.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndiceNorma {
  readonly itens = input.required<readonly EntradaIndice[]>();
  readonly prefixo = input.required<string>();
  readonly selecionar = output<string>();
  readonly recolhidos = linkedSignal<ReadonlySet<string>>(() => {
    this.itens();
    return new Set();
  });

  alternar(id: string, event: Event): void {
    const aberto = (event.target as HTMLDetailsElement).open;
    this.recolhidos.update((atual) => {
      if (atual.has(id) === !aberto) return atual;
      const proximo = new Set(atual);
      if (aberto) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  navegar(id: string, event: Event): void {
    event.preventDefault();
    this.selecionar.emit(id);
  }
}
