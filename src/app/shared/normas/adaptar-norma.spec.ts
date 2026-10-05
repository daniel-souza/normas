import { TestBed } from '@angular/core/testing';
import documento from './dados/norma-cnpq-1-2023.json';
import { Acervo } from './acervo';
import { NORMA_CNPQ } from './norma-cnpq';
import { NORMAS_EXEMPLO } from './normas-exemplo';
import { validarNorma } from './validar-norma';

describe('norma CNPq importada', () => {
  it('adiciona um ID próprio sem substituir ou renomear os exemplos anteriores', () => {
    const normas = TestBed.inject(Acervo).normas();
    expect(normas).toHaveLength(3);
    expect(new Set(normas.map((norma) => norma.id)).size).toBe(3);
    for (const exemplo of NORMAS_EXEMPLO)
      expect(normas.find((n) => n.id === exemplo.id)).toBe(exemplo);
  });

  it('não transforma data do ato em publicação nem situação não verificada em vigente', () => {
    expect(NORMA_CNPQ.dataAto).toBe('2023-10-04');
    expect(NORMA_CNPQ.dataPublicacao).toBeNull();
    expect(NORMA_CNPQ.situacao).toBe('nao_verificada');
    expect(NORMA_CNPQ.demonstracao).toBe(false);
    expect(NORMA_CNPQ.fontes).toEqual(documento.fontes);
    expect(NORMA_CNPQ.extracao).toEqual(documento.extracao);
  });

  it('mantém os vinte artigos, as duas tabelas, células vazias e células mescladas', () => {
    const blocos = NORMA_CNPQ.leitura!.blocos;
    expect(blocos.filter((b) => b.tipo === 'artigo').map((b) => b.id)).toEqual(
      Array.from({ length: 20 }, (_, i) => `art-${i + 1}`),
    );
    const tabelas = blocos.filter((b) => b.tipo === 'tabela');
    expect(tabelas.map((b) => b.id)).toEqual(['instrucoes-habilitacao', 'formulario-habilitacao']);
    expect(tabelas.map((b) => b.tabela!.linhas.length)).toEqual([8, 35]);
    const celulas = tabelas[1].tabela!.linhas.flatMap((linha) => linha.celulas);
    expect(celulas).toHaveLength(57);
    expect(celulas.filter((c) => c.rowspan === 2)).toHaveLength(4);
    expect(celulas[0].colspan).toBe(4);
    expect(celulas.some((c) => c.blocos.length === 0)).toBe(true);
  });

  it('rejeita IDs duplicados e tipos não suportados, sem descartar conteúdo silenciosamente', () => {
    const duplicada = structuredClone(documento);
    duplicada.conteudo.push(duplicada.conteudo[0]);
    expect(() => validarNorma(duplicada)).toThrow('ID duplicado');
    const desconhecida = { ...documento, conteudo: [{ id: 'imagem-1', tipo: 'imagem' }] };
    expect(() => validarNorma(desconhecida)).toThrow('Conteúdo não suportado');
  });
});
