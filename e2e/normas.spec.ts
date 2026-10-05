import { expect, test } from '@playwright/test';

test('busca, limpa filtros e inclui documentos revogados', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('2 normas encontradas');
  await page.getByRole('textbox', { name: 'Texto de pesquisa' }).fill('termo inexistente');
  await page.getByRole('button', { name: 'Buscar normas' }).click();
  await expect(page.getByRole('status')).toHaveText('0 normas encontradas');
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByRole('status')).toHaveText('2 normas encontradas');
  await expect(page.getByRole('textbox', { name: 'Texto de pesquisa' })).toHaveValue('');
  // O checkbox oficial usa um label sobre o input; acionar o label é a interação do usuário.
  await page.locator('br-checkbox[name="incluirRevogadas"] label').click();
  await expect(page.getByRole('checkbox', { name: 'Incluir revogadas' })).toBeChecked();
  await page.getByRole('button', { name: 'Buscar normas' }).click();
  await expect(page.getByRole('status')).toHaveText('3 normas encontradas');
  expect(erros).toEqual([]);
});

test('filtra por categoria e mantém os filtros ao voltar do documento', async ({ page }) => {
  await page.goto('/');
  await page.locator('br-checkbox[name="incluirRevogadas"] label').click();
  await page.getByRole('button', { name: 'Abrir opções' }).click();
  await page.getByRole('option', { name: 'Resoluções Normativas', exact: true }).click();
  await page.getByRole('heading', { name: 'Filtros de busca' }).click();
  await page.getByRole('button', { name: 'Buscar normas' }).click();
  await expect(page.getByRole('status')).toHaveText('2 normas encontradas');
  await page.getByRole('link', { name: /RESOLUÇÃO NORMATIVA DE DEMONSTRAÇÃO/ }).click();
  await expect(page.getByRole('heading', { name: 'Leitura da norma' })).toBeVisible();
  await expect(page.getByRole('article')).toContainText('Art. 2º');
  await page.getByRole('link', { name: 'Voltar à consulta' }).click();
  await expect(page.getByRole('checkbox', { name: 'Incluir revogadas' })).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('2 normas encontradas');
  await expect(
    page.getByRole('link', { name: /RESOLUÇÃO NORMATIVA DE DEMONSTRAÇÃO/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByRole('checkbox', { name: 'Incluir revogadas' })).not.toBeChecked();
  await expect(page.getByRole('link', { name: /PORTARIA DE DEMONSTRAÇÃO/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeFocused();
});

test('usa as datas reais do componente GOV.BR e rejeita intervalo invertido', async ({ page }) => {
  await page.goto('/');
  const inicio = page.locator('#data-inicio').getByRole('textbox');
  const fim = page.locator('#data-fim').getByRole('textbox');
  await inicio.fill('03/01/2023');
  await inicio.press('Tab');
  await fim.fill('02/01/2023');
  await fim.press('Tab');
  await expect(page.getByRole('alert')).toContainText('A data de início');
  await expect(page.getByRole('button', { name: 'Buscar normas' })).toBeDisabled();
  await inicio.fill('02/01/2023');
  await inicio.press('Tab');
  await page.getByRole('button', { name: 'Buscar normas' }).click();
  await expect(page.getByRole('status')).toHaveText('1 norma encontrada');
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(inicio).toHaveValue('');
  await expect(fim).toHaveValue('');
});

test('atualiza o leitor, navega pelo índice e preserva texto sem executar HTML', async ({
  page,
}) => {
  await page.goto('/leitor');
  const texto =
    'Art. 1º Texto original.\nParágrafo único. Preservado.\nArt. 10-A. <script>window.executou = true</script>';
  await page.getByRole('textbox', { name: 'Texto dos dispositivos' }).fill(texto);
  const documento = page.getByRole('article');
  await expect(documento).toContainText('<script>window.executou = true</script>');
  await expect(documento.locator('script')).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Artigos do documento' }).getByRole('link'),
  ).toHaveCount(2);
  await page.getByRole('link', { name: /^Art\. 10-A\./ }).click();
  await expect(page.locator('#leitor-linha-3')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('textbox', { name: 'Texto dos dispositivos' }).fill('');
  await expect(documento).toContainText('Insira o texto');
});

test('trata documento ausente sem apresentar dados de outro ato', async ({ page }) => {
  await page.goto('/normas/documento-inexistente');
  await expect(page.getByRole('heading', { name: 'Norma não encontrada' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});
