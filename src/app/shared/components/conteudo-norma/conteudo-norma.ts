import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BlocoNormativo } from '../../normas/bloco-normativo';
import { TrechosNorma } from '../trechos-norma/trechos-norma';

@Component({
  selector: 'app-conteudo-norma',
  imports: [NgTemplateOutlet, TrechosNorma],
  templateUrl: './conteudo-norma.html',
  styleUrl: './conteudo-norma.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConteudoNorma {
  readonly blocos = input.required<readonly BlocoNormativo[]>();
  readonly prefixo = input.required<string>();
}
