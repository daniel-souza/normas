# Sistema de Normas

Base Angular 22 importada do anexo `modern-angular.zip`, com os componentes oficiais do GOV.BR. O acervo inclui a Resolução CNPq nº 1/2023 fornecida em JSON e os dois exemplos fictícios originais.

## Executar

Requisitos: Node.js 24 (ambiente validado com 24.19.0) e npm 11.19.1, declarado em `packageManager`.

```bash
npm exec --yes --package=npm@11.19.1 -- npm ci
npm start
```

A porta de desenvolvimento é 4200. As rotas são `/` (consulta), `/normas/:id` (documento), `/leitor` (texto simples), `/gestao` (mock de gestão), `/gestao/nova` (cadastro) e `/gestao/:id/editar` (edição). O desenvolvimento local não exige chaves, autenticação ou serviços externos.

## Verificar

```bash
npm run build
npm test -- --watch=false
npm run test:e2e
```

Os testes de navegador iniciam o servidor automaticamente se ele não estiver em execução. Usam Chromium do sistema quando disponível em `/usr/bin/chromium`; em outras máquinas, execute `npx playwright install chromium` ou defina `CHROMIUM_PATH` com o caminho do navegador. O relatório inclui desktop e celular. Resultados e traces ficam em `test-results/`, ignorado pelo Git.

Os testes unitários usam Vitest/jsdom. `src/test-setup.ts` fornece as APIs `matchMedia` e `Element.part` ausentes no jsdom; o comportamento real dos componentes GOV.BR é exercitado no Chromium, sem mocks desses componentes.

O build inicial inclui cerca de 1,84 MB sem compressão (aproximadamente 218 kB estimados para transferência), principalmente pelos pacotes oficiais já presentes no anexo. O orçamento inicial foi ajustado para aviso em 2 MB e erro em 2,3 MB, conservando a distribuição GOV.BR completa e sem desabilitar os limites. Os orçamentos de CSS por componente foram mantidos.

## Organização e referências

Validação inicial do projeto (anterior ao mock de gestão): instalação com npm 11.19.1, build de produção, 31 testes unitários e 16 testes de navegador (desktop e celular) concluídos com sucesso. O servidor também foi reiniciado após a reinstalação das dependências.

Validação do editor contínuo: build de produção, 44 testes unitários e 16 cenários de gestão em navegador (desktop/celular). Incluem classificações manuais, vazios, IDs estáveis, desfazer/refazer, colagem formatada, tabelas mescladas, reabertura, limites, edição e exclusão.

- [Parser e renderização: regras, níveis e metadados, com exemplos](docs/parser-e-renderizacao.md).
- [Editor contínuo: uso, algoritmo e contrato de dados](docs/editor-continuo.md).
- [Mock de cadastro, edição e exclusão](docs/gestao-mock.md).
- [Arquitetura, convenções de nomes e signals](docs/arquitetura.md).
- [Redação normativa, fontes oficiais e limites do parser](docs/redacao-normativa.md).
- Busca: `src/app/pages/search/`.
- Modelo de leitura e parser: `src/app/shared/normas/`.
- Apresentação do documento: `src/app/shared/components/norma-documento/`.

A resolução importada está em `/normas/cnpq-resolucao-1-2023`; os exemplos anteriores continuam nos mesmos endereços. O índice lateral tem capítulos, seções e subseções recolhíveis e prévias dos artigos limitadas a 90 caracteres, com `...` quando necessário. As duas tabelas do anexo preservam células vazias e mescladas. A situação permanece “não verificada” e a publicação, não informada, como no JSON.

Não há backend, autenticação, upload de DOCX/PDF ou validação do schema JSON completo. O JSON incluído no projeto recebe validação estrutural antes da adaptação. O texto colado no leitor é processado em memória no navegador. O mock de gestão exige as informações principais antes de abrir um editor contínuo com reconhecimento automático, destaques, classificação manual e pré-visualização. Novos cadastros recebem texto formatado e tabelas por colagem ou digitação e conservam suas decisões manuais ao reabrir; documentos já estruturados conservam seus elementos em ajustes recolhidos. A busca e a leitura existentes são reutilizadas. Todas as mutações são temporárias: recarregar a página restaura o acervo inicial.

## Situação das fontes oficiais

Foram identificadas a LC nº 95/1998, o Decreto nº 12.002/2024 e o Manual de Redação da Presidência da República. A leitura online e a verificação da redação vigente estão pendentes: a política de rede do ambiente bloqueou os sites oficiais. As referências e as decisões provisórias de apresentação estão registradas no documento de redação normativa.

O fragmento do schema foi incorporado às interfaces de metadados e o JSON de exemplo integral já está incluído em `src/app/shared/normas/dados/`. O modelo `NormaLeitura` e a validação estrutural não substituem `norma.schema.json`, que continua necessário para verificar todas as regras do contrato.

## Ambiente na nuvem

Trabalhe no checkout existente em `/workspace/normas`; cada tarefa já é isolada e não precisa de um worktree adicional. Dependências e arquivos podem ser preservados no snapshot, mas processos devem ser reiniciados em novas tarefas.

A configuração reutilizável de instalação e inicialização é salva no rascunho do ambiente. Revisar e salvar as configurações e publicar o ambiente são etapas do produto.

Repositório: [daniel-souza/normas](https://github.com/daniel-souza/normas).
