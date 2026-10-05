import { NormaEstruturada } from './conteudo-norma';

type Objeto = Record<string, unknown>;
function exigir(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Norma estruturada inválida: ${mensagem}`);
}
function objeto(valor: unknown): Objeto {
  exigir(valor && typeof valor === 'object' && !Array.isArray(valor), 'objeto esperado');
  return valor as Objeto;
}
function texto(valor: unknown): asserts valor is string {
  exigir(typeof valor === 'string', 'texto esperado');
}
function lista(valor: unknown): asserts valor is unknown[] {
  exigir(Array.isArray(valor), 'lista esperada');
}
function opcao(valor: unknown, opcoes: readonly string[]): void {
  exigir(
    typeof valor === 'string' && opcoes.includes(valor),
    `valor não suportado: ${String(valor)}`,
  );
}
function apresentacao(valor: unknown): void {
  if (valor === undefined) return;
  const dados = objeto(valor);
  for (const [chave, item] of Object.entries(dados)) {
    if (chave === 'alinhamento') opcao(item, ['left', 'center', 'right', 'justify']);
    else
      exigir(typeof item === 'number' && Number.isFinite(item) && item >= 0, 'dimensão inválida');
  }
}

/** Verifica a estrutura que este adaptador suporta; não substitui o JSON Schema completo. */
export function validarNorma(entrada: unknown): NormaEstruturada {
  const norma = objeto(entrada);
  exigir(
    norma['tipo'] === 'norma' && norma['versaoSchema'] === '1.0.0',
    'tipo ou versão não suportados',
  );
  const ids = new Set<string>();
  function identificar(no: Objeto): void {
    const id = no['id'];
    exigir(typeof id === 'string' && /^[A-Za-z][A-Za-z0-9_-]*$/.test(id), 'ID inválido');
    exigir(!ids.has(id), `ID duplicado: ${id}`);
    ids.add(id);
  }
  identificar(norma);
  const identificacao = objeto(norma['identificacao']);
  for (const chave of ['orgao', 'numero', 'dataAto', 'epigrafe', 'titulo', 'ementa'])
    texto(identificacao[chave]);
  exigir(Number.isInteger(identificacao['ano']), 'ano inválido');
  opcao(identificacao['especie'], [
    'Portaria',
    'Portaria Conjunta',
    'Resolução Normativa',
    'Resolução Executiva',
    'Instrução de Serviço',
    'Instrução Normativa',
  ]);
  opcao(norma['situacao'], ['vigente', 'revogada', 'nao_verificada']);
  const fontes = norma['fontes'];
  lista(fontes);
  const fontesIds = new Set<string>();
  for (const item of fontes) {
    const fonte = objeto(item);
    texto(fonte['id']);
    texto(fonte['url']);
    texto(fonte['descricao']);
    exigir(/^https?:\/\//.test(fonte['url']), 'protocolo da fonte não suportado');
    exigir(!fontesIds.has(fonte['id']), 'fonte duplicada');
    fontesIds.add(fonte['id']);
  }
  const publicacoes = norma['publicacoes'];
  lista(publicacoes);
  for (const item of publicacoes) {
    const publicacao = objeto(item);
    texto(publicacao['veiculo']);
    texto(publicacao['data']);
    texto(publicacao['fonteId']);
    exigir(fontesIds.has(publicacao['fonteId']), 'fonte da publicação não encontrada');
  }
  const extracao = objeto(norma['extracao']);
  texto(extracao['data']);
  opcao(extracao['metodo'], ['html', 'pdf', 'manual', 'reconstrucao_texto_indexado']);
  opcao(extracao['layoutTabelas'], ['original', 'normalizado', 'misto', 'nao_se_aplica']);
  exigir(typeof extracao['htmlOriginalObtido'] === 'boolean', 'indicador de HTML inválido');
  const observacoes = extracao['observacoes'];
  lista(observacoes);
  observacoes.forEach(texto);
  if (extracao['sha256Html'] !== undefined)
    exigir(
      typeof extracao['sha256Html'] === 'string' && /^[0-9a-f]{64}$/.test(extracao['sha256Html']),
      'hash inválido',
    );

  function conteudo(valor: unknown): void {
    lista(valor);
    for (const item of valor) {
      const no = objeto(item);
      identificar(no);
      apresentacao(no['apresentacao']);
      switch (no['tipo']) {
        case 'texto': {
          const trechos = no['trechos'];
          lista(trechos);
          for (const item of trechos) {
            const trecho = objeto(item);
            texto(trecho['texto']);
            if (trecho['href'] !== undefined) texto(trecho['href']);
            const marcas = trecho['marcas'];
            if (marcas !== undefined) {
              lista(marcas);
              marcas.forEach((marca) =>
                opcao(marca, ['negrito', 'italico', 'sublinhado', 'tachado']),
              );
            }
          }
          break;
        }
        case 'parte':
          opcao(no['categoria'], [
            'parte',
            'livro',
            'titulo',
            'capitulo',
            'secao',
            'subsecao',
            'artigo',
            'paragrafo',
            'inciso',
            'alinea',
            'item',
            'assinatura',
            'anexo',
            'grupo',
          ]);
          for (const campo of ['rotulo', 'numero', 'titulo'])
            if (no[campo] !== undefined) texto(no[campo]);
          conteudo(no['conteudo']);
          break;
        case 'tabela': {
          exigir(
            Number.isInteger(no['numeroColunas']) && Number(no['numeroColunas']) > 0,
            'número de colunas inválido',
          );
          opcao(no['layout'], ['original', 'normalizado', 'misto']);
          const linhas = no['linhas'];
          lista(linhas);
          for (const item of linhas) {
            const linha = objeto(item);
            identificar(linha);
            const celulas = linha['celulas'];
            lista(celulas);
            for (const item of celulas) {
              const celula = objeto(item);
              identificar(celula);
              opcao(celula['tipo'], ['td', 'th']);
              for (const campo of ['rowspan', 'colspan'])
                exigir(
                  Number.isInteger(celula[campo]) && Number(celula[campo]) > 0,
                  `${campo} inválido`,
                );
              apresentacao(celula['apresentacao']);
              conteudo(celula['conteudo']);
            }
          }
          break;
        }
        default:
          throw new Error(`Conteúdo não suportado: ${String(no['tipo'])}`);
      }
    }
  }
  conteudo(norma['conteudo']);
  return entrada as NormaEstruturada;
}
