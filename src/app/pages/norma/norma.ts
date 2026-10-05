import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Acervo } from '../../shared/normas/acervo';
import { NormaDocumento } from '../../shared/components/norma-documento/norma-documento';
import { SITUACOES_NORMA } from '../../shared/normas/norma';

@Component({
  selector: 'app-norma',
  imports: [DatePipe, RouterLink, NormaDocumento],
  templateUrl: './norma.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Norma {
  readonly id = input.required<string>();
  readonly situacoes = SITUACOES_NORMA;
  private readonly acervo = inject(Acervo);
  readonly norma = computed(() => this.acervo.normas().find((norma) => norma.id === this.id()));

  fonteSegura(url: string): string | null {
    try {
      const parsed = new URL(url);
      return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password
        ? parsed.href
        : null;
    } catch {
      return null;
    }
  }
}
