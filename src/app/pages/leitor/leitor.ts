import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NormaDocumento } from '../../shared/components/norma-documento/norma-documento';
import { NORMAS_EXEMPLO } from '../../shared/normas/normas-exemplo';

@Component({
  selector: 'app-leitor',
  imports: [RouterLink, NormaDocumento],
  templateUrl: './leitor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Leitor {
  readonly texto = signal(NORMAS_EXEMPLO[0].texto);
  readonly limite = 200_000;
  readonly erro = signal('');

  atualizar(event: Event): void {
    const texto = (event.target as HTMLTextAreaElement).value;
    if (texto.length > this.limite) {
      this.erro.set(
        'O leitor aceita até 200.000 caracteres por vez. A última leitura foi mantida.',
      );
      return;
    }
    this.erro.set('');
    this.texto.set(texto);
  }
}
