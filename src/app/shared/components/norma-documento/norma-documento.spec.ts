import { TestBed } from '@angular/core/testing';
import { NormaDocumento } from './norma-documento';
import { NORMA_CNPQ } from '../../normas/norma-cnpq';
import documentoOriginal from '../../normas/dados/norma-cnpq-1-2023.json';

describe('NormaDocumento', () => {
  it('renderiza todos os artigos, as tabelas e o texto rico do JSON original', async () => {
    const fixture = TestBed.createComponent(NormaDocumento);
    fixture.componentRef.setInput('texto', NORMA_CNPQ.texto);
    fixture.componentRef.setInput('estrutura', NORMA_CNPQ.leitura);
    await fixture.whenStable();
    const dom = fixture.nativeElement as HTMLElement;
    expect(dom.querySelectorAll('article [data-tipo="artigo"]')).toHaveLength(20);
    expect(dom.querySelectorAll('article table')).toHaveLength(2);
    expect(dom.querySelectorAll('article td')).toHaveLength(65);
    expect(dom.querySelector('article td[rowspan="2"]')).toBeTruthy();
    expect(dom.querySelector('article a[href="mailto:atendimento@cnpq.br"]')).toBeTruthy();
    expect(
      [...dom.querySelectorAll('article strong')].some(
        (el) => el.textContent === 'Internet Protocol',
      ),
    ).toBe(true);
    expect(dom.querySelectorAll('nav details')).toHaveLength(8);
    expect(dom.querySelector('nav a')?.textContent).toContain('Esta Resolução Normativa');
    const exibido = dom.querySelector('article')!.textContent!.replace(/\s+/g, ' ');
    function verificarTextos(valor: unknown): void {
      if (Array.isArray(valor)) {
        valor.forEach(verificarTextos);
        return;
      }
      if (!valor || typeof valor !== 'object') return;
      const no = valor as Record<string, unknown>;
      if (no['tipo'] === 'texto') {
        const texto = (no['trechos'] as { texto: string }[])
          .map((trecho) => trecho.texto)
          .join('')
          .replace(/\s+/g, ' ')
          .trim();
        if (texto) expect(exibido).toContain(texto);
      }
      Object.values(no).forEach(verificarTextos);
    }
    verificarTextos(documentoOriginal.conteudo);
  });

  it('atualiza documento e índice ao receber um novo input signal', async () => {
    const fixture = TestBed.createComponent(NormaDocumento);
    fixture.componentRef.setInput('texto', 'Art. 1º Primeiro texto.');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('nav a')).toHaveLength(1);
    fixture.componentRef.setInput('texto', 'Art. 1º Novo texto.\nArt. 2º Segundo artigo.');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('nav a')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('article').textContent).toContain('Novo texto.');
  });

  it('renderiza conteúdo recebido como texto e nunca como HTML executável', async () => {
    const fixture = TestBed.createComponent(NormaDocumento);
    fixture.componentRef.setInput('texto', 'Art. 1º <img src=x onerror=alert(1)>');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('preserva o texto de links com protocolo não permitido sem torná-los executáveis', async () => {
    const fixture = TestBed.createComponent(NormaDocumento);
    fixture.componentRef.setInput('texto', '');
    fixture.componentRef.setInput('estrutura', {
      original: '',
      avisos: [],
      blocos: [
        {
          id: 'texto-seguro',
          tipo: 'texto',
          texto: '',
          original: '',
          rotulo: '',
          linha: 0,
          profundidade: 0,
          trechos: [
            {
              texto: '<script>texto recebido</script>',
              href: 'javascript:alert(1)',
              marcas: ['negrito'],
            },
          ],
        },
      ],
    });
    await fixture.whenStable();
    const artigo = fixture.nativeElement.querySelector('article') as HTMLElement;
    expect(artigo.querySelector('a')).toBeNull();
    expect(artigo.querySelector('script')).toBeNull();
    expect(artigo.querySelector('strong')?.textContent).toBe('<script>texto recebido</script>');
  });
});
