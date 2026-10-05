import { TestBed } from '@angular/core/testing';
import { NormaDocumento } from './norma-documento';

describe('NormaDocumento', () => {
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
});
