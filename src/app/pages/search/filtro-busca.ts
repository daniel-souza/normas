import { CategoriaNorma } from '../../shared/normas/norma';

export const CATEGORIAS: readonly { label: string; value: CategoriaNorma }[] = [
  { label: 'Portarias', value: 'Portaria' },
  { label: 'Portarias Conjuntas', value: 'Portaria Conjunta' },
  { label: 'Resoluções Normativas', value: 'Resolução Normativa' },
  { label: 'Resoluções Executivas', value: 'Resolução Executiva' },
  { label: 'Instruções de Serviço', value: 'Instrução de Serviço' },
  { label: 'Instruções Normativas', value: 'Instrução Normativa' },
];

export interface FiltroBusca {
  readonly termo: string;
  readonly categorias: readonly CategoriaNorma[];
  readonly dataInicio: string;
  readonly dataFim: string;
  readonly incluirRevogadas: boolean;
}

export interface RequisicaoBusca extends FiltroBusca {
  readonly pagina: number;
  readonly itensPorPagina: number;
  readonly ordenarPor: 'dataPublicacao';
  readonly direcao: 'DESC';
}

export function filtrosVazios(): FiltroBusca {
  return { termo: '', categorias: [], dataInicio: '', dataFim: '', incluirRevogadas: false };
}

export function dataCivil(data: Date | null): string {
  if (!data || Number.isNaN(data.getTime())) return '';
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export function comoData(valor: string): Date | null {
  if (!valor) return null;
  const [ano, mes, dia] = valor.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}
