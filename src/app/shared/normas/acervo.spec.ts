import { TestBed } from '@angular/core/testing';
import { Acervo } from './acervo';
import { adaptarNorma, blocosDoConteudo } from './adaptar-norma';
import { DOCUMENTO_CNPQ } from './norma-cnpq';
import { criarIndice } from './indice-norma';
import { SearchStore } from '../../pages/search/search-store';

describe('gestão em memória', () => {
  it('isola rascunhos e preserva metadados, IDs e tabelas na edição estruturada', () => {
    const acervo = TestBed.inject(Acervo);
    const rascunho = acervo.obter(DOCUMENTO_CNPQ.id)!;
    const copia = {
      ...rascunho.estruturada!,
      identificacao: { ...rascunho.estruturada!.identificacao, ementa: 'Ementa alterada no mock' },
    };
    expect(acervo.normas()[0].ementa).toBe(DOCUMENTO_CNPQ.identificacao.ementa);
    acervo.salvarMock({ norma: adaptarNorma(copia), estruturada: copia }, copia.id);
    const salvo = acervo.obter(copia.id)!;
    expect(salvo.estruturada!.conteudo).toEqual(DOCUMENTO_CNPQ.conteudo);
    expect(salvo.estruturada!.extracao).toEqual(DOCUMENTO_CNPQ.extracao);
    expect(salvo.norma.identificacao?.processo).toBe(DOCUMENTO_CNPQ.identificacao.processo);
    expect(salvo.norma.ementa).toBe('Ementa alterada no mock');
    expect(salvo.norma.alteracaoMock).toBe(true);
    expect(salvo.norma.leitura!.blocos.filter((b) => b.tipo === 'tabela')).toHaveLength(2);
  });

  it('reflete inclusão e exclusão na consulta e recusa IDs duplicados ou alterados', () => {
    const acervo = TestBed.inject(Acervo);
    const busca = TestBed.inject(SearchStore);
    const documento = {
      ...DOCUMENTO_CNPQ,
      id: 'nova-norma-mock',
      identificacao: { ...DOCUMENTO_CNPQ.identificacao, ementa: 'Termoexclusivomock' },
    };
    const registro = { norma: adaptarNorma(documento), estruturada: documento };
    acervo.salvarMock(registro);
    busca.atualizar({ termo: 'Termoexclusivomock' });
    busca.buscar();
    expect(busca.total()).toBe(1);
    expect(() => acervo.salvarMock(registro)).toThrow('Identificador já cadastrado');
    expect(() => acervo.salvarMock(registro, DOCUMENTO_CNPQ.id)).toThrow('identificador');
    acervo.excluirMock(documento.id);
    expect(busca.total()).toBe(0);
    expect(acervo.obter(documento.id)).toBeUndefined();
  });

  it('mantém artigo raiz do JSON fora do capítulo anterior no índice', () => {
    const blocos = blocosDoConteudo([
      {
        id: 'capitulo',
        tipo: 'parte',
        categoria: 'capitulo',
        rotulo: 'CAPÍTULO I',
        conteudo: [
          {
            id: 'artigo-interno',
            tipo: 'parte',
            categoria: 'artigo',
            rotulo: 'Art. 1º',
            conteudo: [],
          },
        ],
      },
      { id: 'artigo-raiz', tipo: 'parte', categoria: 'artigo', rotulo: 'Art. 2º', conteudo: [] },
    ]);
    const indice = criarIndice(blocos);
    expect(indice.map((item) => item.id)).toEqual(['capitulo', 'artigo-raiz']);
    expect(indice[0].filhos.map((item) => item.id)).toEqual(['artigo-interno']);
  });
});
