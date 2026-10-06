import { expect, test } from '@playwright/test';

async function preencherIdentificacao(page: import('@playwright/test').Page) {
  await page.getByLabel('Órgão emissor *').fill('Órgão de demonstração');
  await page.getByLabel('Número *', { exact: true }).fill('99');
  await page.getByLabel('Ano *', { exact: true }).fill('2026');
  await page.getByLabel('Data do ato *').fill('2026-10-06');
  await page.getByLabel('Epígrafe *').fill('PORTARIA DE TESTE Nº 99');
  await page.getByLabel('Ementa *').fill('Demonstra o fluxo de cadastro.');
}

test('exige informações principais, cadastra, consulta, edita e exclui na mesma sessão', async ({
  page,
}) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/gestao/nova');
  await page.getByRole('button', { name: 'Continuar para conteúdo' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('app-editor-conteudo')).toHaveCount(0);
  await preencherIdentificacao(page);
  await page.getByRole('button', { name: 'Continuar para conteúdo' }).click();
  const raiz = page.locator('app-editor-conteudo').first();
  await raiz.getByRole('button', { name: 'Adicionar elemento', exact: true }).click();
  await page.getByLabel('Rótulo (ex.: Art. 1º, CAPÍTULO I)').fill('Art. 1º');
  await page.getByLabel('Texto do trecho 1').fill('Texto criado na demonstração.');
  await page.getByRole('button', { name: 'Revisar norma' }).click();
  await expect(page.getByRole('article')).toContainText('Art. 1º Texto criado na demonstração.');
  await page.getByRole('button', { name: 'Salvar no mock' }).click();
  await expect(page.getByRole('heading', { name: 'Leitura da norma' })).toBeVisible();
  const url = page.url();
  await page.getByRole('link', { name: 'Voltar à consulta' }).click();
  await page.getByRole('link', { name: 'PORTARIA DE TESTE Nº 99' }).click();
  await page.getByRole('link', { name: 'Editar no mock' }).click();
  await page.getByLabel('Ementa *').fill('Ementa revisada.');
  await page.getByRole('button', { name: 'Continuar para conteúdo' }).click();
  await page.getByLabel('Texto do trecho 1').fill('Texto editado na demonstração.');
  await page.getByRole('button', { name: 'Revisar norma' }).click();
  await page.getByRole('button', { name: 'Salvar no mock' }).click();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole('article')).toContainText('Texto editado na demonstração.');
  await page.getByRole('link', { name: 'Voltar à consulta' }).click();
  await page.getByRole('link', { name: 'Gerenciar normas (mock)' }).click();
  const item = page.locator('.lista-normas > li').filter({ hasText: 'PORTARIA DE TESTE Nº 99' });
  await item.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar exclusão' }).click();
  await expect(item).toBeVisible();
  await item.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click();
  await expect(item).toHaveCount(0);
  await page.getByRole('link', { name: 'Voltar à consulta' }).click();
  await expect(page.getByRole('link', { name: 'PORTARIA DE TESTE Nº 99' })).toHaveCount(0);
  expect(erros).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('edita o documento estruturado preservando tabelas, e cancelar não grava o rascunho', async ({
  page,
}) => {
  await page.goto('/gestao/cnpq-resolucao-1-2023/editar');
  await page.getByLabel('Ementa *').fill('Esta edição será descartada.');
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('link', { name: /^RESOLUÇÃO CNPq Nº 1/ }).click();
  await expect(page.getByRole('article')).not.toContainText('Esta edição será descartada.');
  await page.getByRole('link', { name: 'Editar no mock' }).click();
  await page.getByLabel('Ementa *').fill('Edição temporária da resolução importada.');
  await page.getByRole('button', { name: 'Continuar para conteúdo' }).click();
  await page.getByRole('button', { name: 'Revisar norma' }).click();
  await expect(page.getByRole('table')).toHaveCount(2);
  await page.getByRole('button', { name: 'Salvar no mock' }).click();
  await expect(page.getByRole('table')).toHaveCount(2);
  await expect(page.getByRole('article').locator('[data-tipo="artigo"]')).toHaveCount(20);
  await expect(page.getByRole('article')).toContainText(
    'Edição temporária da resolução importada.',
  );
  await page.reload();
  await expect(page.getByRole('article')).not.toContainText(
    'Edição temporária da resolução importada.',
  );
});

test('preserva fontes e publicações e exige a relação entre elas', async ({ page }) => {
  await page.goto('/gestao/nova');
  await preencherIdentificacao(page);
  await expect(page.getByRole('button', { name: 'Adicionar publicação' })).toBeDisabled();
  await page.getByRole('button', { name: 'Adicionar fonte', exact: true }).click();
  await page.getByLabel('Descrição da fonte *').fill('Fonte de demonstração');
  await page.getByLabel('URL da fonte *').fill('https://example.org/norma');
  await page.getByRole('button', { name: 'Adicionar publicação' }).click();
  await page.getByLabel('Veículo *').fill('Diário de demonstração');
  await page.getByLabel('Data da publicação *').fill('2026-10-07');
  await expect(page.getByRole('button', { name: 'Remover fonte' })).toBeDisabled();
  await page.getByRole('button', { name: 'Continuar para conteúdo' }).click();
  await page.getByRole('button', { name: 'Adicionar elemento', exact: true }).click();
  await page.getByLabel('Rótulo (ex.: Art. 1º, CAPÍTULO I)').fill('Art. 1º');
  await page.getByLabel('Texto do trecho 1').fill('Texto da norma.');
  await page.getByRole('button', { name: 'Revisar norma' }).click();
  await page.getByRole('button', { name: 'Salvar no mock' }).click();
  await expect(page.locator('app-norma')).toContainText('Publicação: 07/10/2026');
  await page.getByText('Origem e informações da extração', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'Fonte de demonstração' })).toHaveAttribute(
    'href',
    'https://example.org/norma',
  );
});
