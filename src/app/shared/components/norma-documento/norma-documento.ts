import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { interpretarNorma } from '../../normas/parser-norma';
import { LeituraNormativa } from '../../normas/bloco-normativo';
import { criarIndice } from '../../normas/indice-norma';
import { IndiceNorma } from '../indice-norma/indice-norma';
import { ConteudoNorma } from '../conteudo-norma/conteudo-norma';

@Component({
  selector: 'app-norma-documento',
  imports: [IndiceNorma, ConteudoNorma],
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
  readonly estrutura = input<LeituraNormativa>();
  readonly leitura = computed(() => this.estrutura() ?? interpretarNorma(this.texto()));
  readonly indice = computed(() => criarIndice(this.leitura().blocos));

  irPara(id: string): void {
    const destino = document.getElementById(`${this.prefixo()}-${id}`);
    destino?.focus({ preventScroll: true });
    destino?.scrollIntoView({ block: 'start' });
  }
}
