import documento from './dados/norma-cnpq-1-2023.json';
import { adaptarNorma } from './adaptar-norma';
import { validarNorma } from './validar-norma';

export const NORMA_CNPQ = adaptarNorma(validarNorma(documento));
