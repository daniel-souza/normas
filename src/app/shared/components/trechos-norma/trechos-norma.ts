import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TrechoNorma } from '../../normas/conteudo-norma';

@Component({
  selector: 'app-trechos-norma',
  imports: [NgTemplateOutlet],
  template: `
    @for (trecho of trechos(); track $index) {
      @if (hrefSeguro(trecho.href); as href) {
        <a [href]="href" rel="noopener noreferrer"
          ><ng-container *ngTemplateOutlet="texto; context: { $implicit: trecho }"
        /></a>
      } @else {
        <ng-container *ngTemplateOutlet="texto; context: { $implicit: trecho }" />
      }
    }
    <ng-template #texto let-trecho>
      <span
        [class.sublinhado]="trecho.marcas?.includes('sublinhado')"
        [class.tachado]="trecho.marcas?.includes('tachado')"
      >
        @if (trecho.marcas?.includes('negrito')) {
          <strong
            [class.italico]="trecho.marcas?.includes('italico')"
            [textContent]="trecho.texto"
          ></strong>
        } @else if (trecho.marcas?.includes('italico')) {
          <em [textContent]="trecho.texto"></em>
        } @else {
          <span [textContent]="trecho.texto"></span>
        }
      </span>
    </ng-template>
  `,
  styles: `
    :host {
      white-space: pre-wrap;
    }
    .italico {
      font-style: italic;
    }
    .sublinhado {
      text-decoration: underline;
    }
    .tachado {
      text-decoration: line-through;
    }
    .sublinhado.tachado {
      text-decoration: underline line-through;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrechosNorma {
  readonly trechos = input.required<readonly TrechoNorma[]>();

  hrefSeguro(href?: string): string | null {
    if (!href) return null;
    try {
      const url = new URL(href);
      return ['https:', 'http:', 'mailto:'].includes(url.protocol) && !url.username && !url.password
        ? href
        : null;
    } catch {
      return null;
    }
  }
}
