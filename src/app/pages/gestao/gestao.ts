import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Acervo } from '../../shared/normas/acervo';
import { NormaLeitura, SITUACOES_NORMA } from '../../shared/normas/norma';

@Component({
  selector: 'app-gestao',
  imports: [RouterLink],
  templateUrl: './gestao.html',
  styleUrl: './gestao.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gestao {
  readonly acervo = inject(Acervo);
  readonly situacoes = SITUACOES_NORMA;
  readonly pendente = signal<NormaLeitura | null>(null);
  readonly mensagem = signal('');

  excluir(): void {
    const norma = this.pendente();
    if (!norma) return;
    this.acervo.excluirMock(norma.id);
    this.pendente.set(null);
    this.mensagem.set(`${norma.epigrafe}: excluída nesta sessão.`);
  }
}
