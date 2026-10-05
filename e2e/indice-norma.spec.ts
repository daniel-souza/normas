import { expect, test } from '@playwright/test';

test('preserva exemplos, importa a resolução e mostra os metadados informados', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /PORTARIA DE DEMONSTRAÇÃO Nº 1/ })).toBeVisible();
  await page.getByRole('link', { name: 'RESOLUÇÃO CNPq Nº 1, DE 4 DE OUTUBRO DE 2023' }).click();
  await expect(page.getByRole('heading', { name: 'Leitura da norma' })).toBeVisible();
  await expect(page.locator('main')).toContainText('Situação não verificada');
  await expect(page.locator('main')).toContainText('Publicação não informada');
  await expect(page.locator('main')).toContainText('Data do ato: 04/10/2023');
  await expect(page.locator('main')).not.toContainText('Texto fictício');
  const corpo = page.getByRole('article');
  await expect(corpo.locator('[data-tipo="artigo"]')).toHaveCount(20);
  await expect(corpo.locator('table')).toHaveCount(2);
  await expect(corpo.locator('td[rowspan="2"]')).toHaveCount(4);
  await expect(corpo).toContainText('FORMULÁRIO DE HABILITAÇÃO - EXTRATOR LATTES');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('recolhe capítulos e seções independentemente e navega usando a prévia do artigo', async ({
  page,
}) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/normas/cnpq-resolucao-1-2023');
  const indice = page.getByRole('navigation', { name: 'Artigos do documento' });
  const preliminares = indice.locator('summary').filter({ hasText: /DISPOSIÇÕES PRELIMINARES/ });
  const regulamento = indice.locator('summary').filter({ hasText: /CAPÍTULO I\s*—\s*REGULAMENTO/ });
  const habilitacao = indice
    .locator('summary')
    .filter({ hasText: /Seção III\s*—\s*Da habilitação/ });
  const artigo1 = indice.getByRole('link', { name: /^Art\. 1º/ });
  const artigo5 = indice.getByRole('link', { name: /^Art\. 5º/ });
  await expect(artigo1).toContainText('Esta Resolução Normativa');
  const previa = await artigo1.locator('.previa').innerText();
  expect(Array.from(previa).length).toBeLessThanOrEqual(90);
  expect(previa.endsWith('...')).toBe(true);
  await preliminares.click();
  await expect(artigo1).toBeHidden();
  await expect(artigo5).toBeVisible();
  await regulamento.focus();
  await regulamento.press('Enter');
  await expect(artigo5).toBeHidden();
  await regulamento.press('Enter');
  await habilitacao.click();
  await expect(artigo5).toBeHidden();
  await expect(indice.getByRole('link', { name: /^Art\. 4º/ })).toBeVisible();
  await habilitacao.click();
  await artigo5.click();
  await expect(page.locator('#cnpq-resolucao-1-2023-art-5')).toBeFocused();
  await expect(page.locator('#cnpq-resolucao-1-2023-art-5')).toBeInViewport();
  await expect(artigo1).toBeHidden();
  expect(erros).toEqual([]);
});

test('suporta subseções e artigos fora de agrupamentos no leitor antigo', async ({ page }) => {
  await page.goto('/leitor');
  await page.getByRole('textbox', { name: 'Texto dos dispositivos' })
    .fill(`Art. 1º Abertura sem agrupamento.
CAPÍTULO I
Disposições gerais
Seção I
Do acesso
Subseção I
Da habilitação
Art. 2º Texto inicial da subseção.
CAPÍTULO II
Disposições finais
Art. 3º Encerramento.`);
  const indice = page.getByRole('navigation', { name: 'Artigos do documento' });
  const subsecao = indice.locator('summary').filter({ hasText: /Subseção I/ });
  await expect(indice.getByRole('link', { name: /^Art\. 1º/ })).toBeVisible();
  await subsecao.click();
  await expect(indice.getByRole('link', { name: /^Art\. 2º/ })).toBeHidden();
  await expect(indice.getByRole('link', { name: /^Art\. 3º/ })).toBeVisible();
  await subsecao.click();
  await indice.getByRole('link', { name: /^Art\. 2º/ }).click();
  await expect(page.locator('#leitor-linha-8')).toBeFocused();
  await page
    .getByRole('textbox', { name: 'Texto dos dispositivos' })
    .fill('Art. 1º Outro documento.');
  await expect(indice.locator('details')).toHaveCount(0);
  await expect(indice.getByRole('link')).toHaveCount(1);
});
