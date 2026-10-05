import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  BrCheckbox,
  BrDatetimePicker,
  BrInput,
  BrSelect,
  BrSelectOption,
} from '@govbr-ds/webcomponents-angular/standalone';
import { CATEGORIAS, comoData, dataCivil } from '../filtro-busca';
import { SearchStore } from '../search-store';

@Component({
  selector: 'app-search-filters',
  imports: [BrCheckbox, BrDatetimePicker, BrInput, BrSelect, BrSelectOption],
  templateUrl: './search-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFilters {
  readonly store = inject(SearchStore);
  readonly categorias = CATEGORIAS;
  readonly versaoFormulario = signal(0);
  private readonly injector = inject(Injector);
  private readonly botaoLimpar = viewChild<ElementRef<HTMLButtonElement>>('botaoLimpar');
  readonly dataInicio = computed(() => comoData(this.store.filtros().dataInicio), {
    equal: (a, b) => a?.getTime() === b?.getTime(),
  });
  readonly dataFim = computed(() => comoData(this.store.filtros().dataFim), {
    equal: (a, b) => a?.getTime() === b?.getTime(),
  });

  selecionarCategorias(event: Event): void {
    const valor = (event.target as HTMLElement & { value?: string | string[] }).value;
    const valores = Array.isArray(valor) ? valor : valor ? [valor] : [];
    this.store.atualizar({
      categorias: CATEGORIAS.filter((item) => valores.includes(item.value)).map(
        (item) => item.value,
      ),
    });
  }

  atualizarTermo(event: Event): void {
    if (event instanceof CustomEvent && typeof event.detail === 'string') {
      this.store.atualizar({ termo: event.detail });
    }
  }

  incluirRevogadas(event: Event): void {
    if (event instanceof CustomEvent && typeof event.detail === 'boolean') {
      this.store.atualizar({ incluirRevogadas: event.detail });
    }
  }

  selecionarData(campo: 'dataInicio' | 'dataFim', event: Event): void {
    if (event instanceof CustomEvent && (event.detail === null || event.detail instanceof Date)) {
      this.store.atualizar({ [campo]: dataCivil(event.detail) });
    }
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.store.buscar();
  }

  limpar(event: Event): void {
    event.preventDefault();
    this.store.limpar();
    // GOV.BR 2.2.0: value=null e clear() deixam texto residual no calendário.
    // Recriar os controles pelo Angular mantém o estado visual sincronizado,
    // sem tocar no Shadow DOM ou alterar o pacote oficial.
    this.versaoFormulario.update((versao) => versao + 1);
    afterNextRender(() => this.botaoLimpar()?.nativeElement.focus(), { injector: this.injector });
  }
}
