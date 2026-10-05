import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { interpretarNorma } from '../../normas/parser-norma';

@Component({
  selector: 'app-norma-documento',
  templateUrl: './norma-documento.html',
  styleUrl: './norma-documento.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NormaDocumento {
  readonly texto = input.required<string>();
  readonly epigrafe = input('');
  readonly ementa = input('');
  readonly preambulo = input('');
  readonly assinaturas = input<readonly string[]>([]);
  readonly prefixo = input('norma');
  readonly leitura = computed(() => interpretarNorma(this.texto()));
  readonly artigos = computed(() =>
    this.leitura().blocos.filter((bloco) => bloco.tipo === 'artigo'),
  );

  irPara(id: string, event: Event): void {
    event.preventDefault();
    const destino = document.getElementById(`${this.prefixo()}-${id}`);
    destino?.focus({ preventScroll: true });
    destino?.scrollIntoView({ block: 'start' });
  }
}
