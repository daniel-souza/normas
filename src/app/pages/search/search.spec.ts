import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Search } from './search';
import { provideRouter } from '@angular/router';
import { SearchStore } from './search-store';

describe('Search', () => {
  let component: Search;
  let fixture: ComponentFixture<Search>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reflete a busca e a limpeza em componentes irmãos via signals', async () => {
    const store = TestBed.inject(SearchStore);
    store.atualizar({ termo: 'inexistente' });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      '0 normas',
    );
    store.limpar();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      '2 normas',
    );
  });
});
