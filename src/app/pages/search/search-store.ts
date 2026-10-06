import { computed, inject, Injectable, signal } from '@angular/core';
import { Acervo } from '../../shared/normas/acervo';
import { FiltroBusca, filtrosVazios, RequisicaoBusca } from './filtro-busca';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

/** Estado da funcionalidade, compartilhado entre formulário e resultados. */
@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly acervo = inject(Acervo);
  private readonly rascunho = signal<FiltroBusca>(filtrosVazios());
  private readonly aplicados = signal<FiltroBusca>(filtrosVazios());
  private readonly paginaAtual = signal(1);
  readonly filtros = this.rascunho.asReadonly();
  // A exclusão no mock pode reduzir a quantidade de páginas da consulta atual.
  readonly pagina = computed(() => Math.min(this.paginaAtual(), this.totalPaginas()));
  readonly itensPorPagina = 10;
  readonly erro = computed(() => {
    const { dataInicio, dataFim } = this.rascunho();
    return dataInicio && dataFim && dataInicio > dataFim
      ? 'A data de início deve ser anterior ou igual à data de fim.'
      : '';
  });
  readonly requisicao = computed<RequisicaoBusca>(() => ({
    ...this.aplicados(),
    pagina: this.pagina(),
    itensPorPagina: this.itensPorPagina,
    ordenarPor: 'dataPublicacao',
    direcao: 'DESC',
  }));
  private readonly encontrados = computed(() => {
    const filtros = this.aplicados();
    const termos = normalizar(filtros.termo.trim()).split(/\s+/).filter(Boolean);
    return this.acervo
      .normas()
      .filter((norma) => {
        const texto = normalizar(`${norma.epigrafe} ${norma.ementa} ${norma.texto}`);
        return (
          termos.every((termo) => texto.includes(termo)) &&
          (!filtros.categorias.length || filtros.categorias.includes(norma.categoria)) &&
          (!filtros.dataInicio ||
            (!!norma.dataPublicacao && norma.dataPublicacao >= filtros.dataInicio)) &&
          (!filtros.dataFim ||
            (!!norma.dataPublicacao && norma.dataPublicacao <= filtros.dataFim)) &&
          (filtros.incluirRevogadas || norma.situacao !== 'revogada')
        );
      })
      .sort((a, b) => (b.dataPublicacao ?? '').localeCompare(a.dataPublicacao ?? ''));
  });
  readonly total = computed(() => this.encontrados().length);
  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.itensPorPagina)),
  );
  readonly resultados = computed(() => {
    const inicio = (this.pagina() - 1) * this.itensPorPagina;
    return this.encontrados().slice(inicio, inicio + this.itensPorPagina);
  });

  atualizar(alteracoes: Partial<FiltroBusca>): void {
    this.rascunho.update((atual) => {
      const proximo = { ...atual, ...alteracoes };
      const categoriasIguais =
        atual.categorias.length === proximo.categorias.length &&
        atual.categorias.every((categoria, indice) => categoria === proximo.categorias[indice]);
      if (
        atual.termo === proximo.termo &&
        atual.dataInicio === proximo.dataInicio &&
        atual.dataFim === proximo.dataFim &&
        atual.incluirRevogadas === proximo.incluirRevogadas &&
        categoriasIguais
      )
        return atual;
      return {
        ...proximo,
        categorias: categoriasIguais ? atual.categorias : [...proximo.categorias],
      };
    });
  }

  buscar(): void {
    if (this.erro()) return;
    this.aplicados.set({ ...this.filtros(), categorias: [...this.filtros().categorias] });
    this.paginaAtual.set(1);
  }

  limpar(): void {
    this.rascunho.set(filtrosVazios());
    this.buscar();
  }

  irParaPagina(pagina: number): void {
    this.paginaAtual.set(Math.min(this.totalPaginas(), Math.max(1, Math.trunc(pagina) || 1)));
  }
}
