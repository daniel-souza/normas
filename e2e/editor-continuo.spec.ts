import { expect, test, Page } from '@playwright/test';

async function abrir(page: Page) {
  await page.goto('/gestao/nova');
  await page.getByLabel('Órgão emissor *').fill('Órgão de demonstração');
  await page.getByLabel('Número *', { exact: true }).fill('10');
  await page.getByLabel('Data do ato *').fill('2026-10-06');
  await page.getByLabel('Epígrafe *').fill('PORTARIA DO EDITOR CONTÍNUO');
  await page.getByLabel('Ementa *').fill('Demonstra edição e classificação.');
  await page.getByRole('button', { name: 'Continuar para o editor' }).click();
}
async function colar(page: Page, texto: string, html?: string) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(
    async ({ texto, html }) => {
      if (html)
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([texto], { type: 'text/plain' }),
          }),
        ]);
      else await navigator.clipboard.writeText(texto);
    },
    { texto, html },
  );
  await page.getByRole('textbox', { name: 'Texto da norma', exact: true }).focus();
  await page.keyboard.press('Control+V');
}
async function selecionar(page: Page, inicio: number, fim: number) {
  await page.locator('.tiptap').evaluate(
    (editor, { inicio, fim }) => {
      (editor as HTMLElement).focus();
      const selecao = window.getSelection()!;
      const range = document.createRange();
      range.setStart(editor.children[inicio], 0);
      range.setEnd(editor.children[fim], editor.children[fim].childNodes.length);
      selecao.removeAllRanges();
      selecao.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    },
    { inicio, fim },
  );
}

test('agrupa o preâmbulo, mantém classificação manual e IDs ao editar, desfazer e reabrir', async ({
  page,
}) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await abrir(page);
  await colar(
    page,
    'A autoridade resolve:\nConsiderando os fatos.\nArt. 1º Fica instituída a regra.',
  );
  const paragrafos = page.locator('.tiptap > p');
  await expect(paragrafos).toHaveCount(3);
  await selecionar(page, 0, 1);
  await page.getByLabel('Classificar seleção').selectOption('preambulo');
  await expect(paragrafos.nth(0)).toHaveAttribute('data-tipo-norma', 'preambulo');
  await expect(paragrafos.nth(1)).toHaveAttribute('data-tipo-norma', 'preambulo');
  const unidade = await paragrafos.nth(0).getAttribute('data-unidade');
  await expect(paragrafos.nth(1)).toHaveAttribute('data-unidade', unidade!);
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(paragrafos.nth(0)).toHaveAttribute('data-origem', 'automatico');
  await page.getByRole('button', { name: 'Refazer', exact: true }).click();
  await expect(paragrafos.nth(0)).toHaveAttribute('data-origem', 'manual');
  await paragrafos.nth(0).click();
  await page.keyboard.press('Home');
  await page.keyboard.type('Art. 50. ');
  await expect(paragrafos.nth(0)).toHaveAttribute('data-tipo-norma', 'preambulo');
  const idArtigo = await paragrafos.nth(2).getAttribute('data-id');
  await paragrafos.nth(1).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Outro fundamento.');
  await expect(page.locator('.tiptap [data-tipo-norma="artigo"]')).toHaveAttribute(
    'data-id',
    idArtigo!,
  );
  await expect(page.locator('.tiptap [data-tipo-norma="preambulo"]')).toHaveCount(3);
  await page.getByRole('button', { name: 'Salvar no mock' }).click();
  await expect(page.getByRole('article').locator('[data-tipo="preambulo"]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Editar no mock' }).click();
  await page.getByRole('button', { name: 'Continuar para o editor' }).click();
  await expect(page.locator('.tiptap [data-tipo-norma="preambulo"]')).toHaveCount(3);
  await expect(page.locator('.tiptap [data-tipo-norma="artigo"]')).toHaveAttribute(
    'data-id',
    idArtigo!,
  );
  expect(erros).toEqual([]);
});

test('salva artigo vazio, permite preencher e separar ou continuar elementos', async ({ page }) => {
  await abrir(page);
  await page.getByRole('textbox', { name: 'Texto da norma', exact: true }).click();
  await page.getByLabel('Classificar seleção').selectOption('artigo');
  await expect(page.locator('.tiptap > p')).toHaveAttribute('data-tipo-norma', 'artigo');
  await page.getByRole('button', { name: 'Salvar no mock' }).click();
  await expect(page.getByRole('heading', { name: 'Leitura da norma' })).toBeVisible();
  await page.getByRole('link', { name: 'Editar no mock' }).click();
  await page.getByRole('button', { name: 'Continuar para o editor' }).click();
  await expect(page.locator('.tiptap > p')).toHaveAttribute('data-origem', 'manual');
  await page
    .getByRole('textbox', { name: 'Texto da norma', exact: true })
    .fill('Conteúdo ainda sem numeração.');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Segunda parte.');
  await expect(page.getByRole('article').locator('[data-tipo="artigo"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Separar elemento', exact: true }).click();
  await expect(page.getByRole('article').locator('[data-tipo="artigo"]')).toHaveCount(2);
  await page.getByLabel('Classificar seleção').selectOption('continuacao');
  await expect(page.getByRole('article').locator('[data-tipo="artigo"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Voltar às informações' }).click();
  await page.getByRole('button', { name: 'Continuar para o editor' }).click();
  await expect(page.getByRole('textbox', { name: 'Texto da norma', exact: true })).toContainText(
    'Segunda parte.',
  );
});

test('cola HTML com formatação e tabelas mescladas, edita células e preserva ao salvar', async ({
  page,
}) => {
  await abrir(page);
  await colar(
    page,
    'Regra e tabela',
    `<p style="font-weight: bold">Art. 1º Conteúdo <em>formatado</em>.</p>
    <p><a href="https://example.org">Fonte</a><a href="javascript:window.executou=true">Link inválido</a></p>
    <table><tr><th colspan="2">Dados</th></tr><tr><td rowspan="2">Grupo</td><td>A</td></tr><tr><td>B</td></tr></table>
    <script>window.executou=true</script><p>Fim.</p>`,
  );
  const previa = page.getByRole('article');
  await expect(previa.locator('strong').first()).toContainText('Conteúdo');
  await expect(previa.locator('em, .italico').first()).toContainText('formatado');
  await expect(previa.locator('th[colspan="2"]')).toHaveText('Dados');
  await expect(previa.locator('td[rowspan="2"]')).toContainText('Grupo');
  await expect(previa.getByRole('link', { name: 'Fonte', exact: true })).toHaveAttribute(
    'href',
    'https://example.org/',
  );
  await expect(page.locator('.tiptap a[href^="javascript:"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as { executou?: boolean }).executou),
  ).toBeUndefined();
  const celula = page.locator('.tiptap td').filter({ hasText: /^A$/ });
  await celula.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' revisado');
  await expect(previa.locator('td').filter({ hasText: 'A revisado' })).toBeVisible();
  await page.getByRole('button', { name: '+ Linha', exact: true }).click();
  await expect(page.locator('.tiptap tr')).toHaveCount(4);
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.locator('.tiptap tr')).toHaveCount(3);
  await page.getByRole('button', { name: 'Salvar no mock' }).click();
  await expect(page.getByRole('article').locator('td[rowspan="2"]')).toContainText('Grupo');
  await page.getByRole('link', { name: 'Editar no mock' }).click();
  await page.getByRole('button', { name: 'Continuar para o editor' }).click();
  await expect(page.locator('.tiptap td[rowspan="2"]')).toContainText('Grupo');
  await expect(page.locator('.tiptap')).toContainText('A revisado');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
