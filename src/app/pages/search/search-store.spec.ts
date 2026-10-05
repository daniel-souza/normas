import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Acervo } from '../../shared/normas/acervo';
import { NORMAS_EXEMPLO } from '../../shared/normas/normas-exemplo';
import { comoData, dataCivil } from './filtro-busca';
import { SearchStore } from './search-store';

describe('SearchStore', () => {
  let store: SearchStore;
  beforeEach(() => {
    store = TestBed.inject(SearchStore);
  });

  it('atualiza o rascunho e aplica a consulta somente ao buscar', () => {
    expect(store.total()).toBe(1);
    store.atualizar({ termo: 'inexistente' });
    expect(store.total()).toBe(1);
    store.buscar();
    expect(store.total()).toBe(0);
    store.limpar();
    expect(store.total()).toBe(1);
  });

  it('combina termo sem acentos, categoria e inclusão explícita das revogadas', () => {
    store.atualizar({ termo: 'resolucao acervo', categorias: ['Resolução Normativa'] });
    store.buscar();
    expect(store.total()).toBe(0);
    store.atualizar({ incluirRevogadas: true });
    store.buscar();
    expect(store.resultados().map((norma) => norma.id)).toEqual(['demonstracao-acervo']);
  });

  it('aplica os limites de data inclusive e bloqueia intervalos invertidos', () => {
    store.atualizar({ dataInicio: '2023-01-02', dataFim: '2023-01-02' });
    store.buscar();
    expect(store.total()).toBe(1);
    store.atualizar({ dataInicio: '2023-02-01' });
    expect(store.erro()).toBeTruthy();
    store.buscar();
    expect(store.requisicao().dataInicio).toBe('2023-01-02');
  });

  it('preserva a data civil sem deslocamento pelo fuso horário', () => {
    expect(dataCivil(new Date(2023, 0, 2, 23, 30))).toBe('2023-01-02');
    expect(dataCivil(comoData('2023-01-02'))).toBe('2023-01-02');
    expect(dataCivil(null)).toBe('');
  });
});

describe('paginação da busca', () => {
  it('limita páginas e volta à primeira ao alterar a consulta', () => {
    const normas = signal(
      Array.from({ length: 21 }, (_, i) => ({ ...NORMAS_EXEMPLO[0], id: `norma-${i}` })),
    );
    TestBed.configureTestingModule({ providers: [{ provide: Acervo, useValue: { normas } }] });
    const store = TestBed.inject(SearchStore);
    expect(store.totalPaginas()).toBe(3);
    store.irParaPagina(99);
    expect(store.pagina()).toBe(3);
    expect(store.resultados()).toHaveLength(1);
    store.buscar();
    expect(store.pagina()).toBe(1);
    expect(store.resultados()).toHaveLength(10);
  });
});
