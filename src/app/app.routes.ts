import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/search/search').then((m) => m.Search),
  },
  {
    path: 'normas/:id',
    loadComponent: () => import('./pages/norma/norma').then((m) => m.Norma),
  },
  {
    path: 'leitor',
    loadComponent: () => import('./pages/leitor/leitor').then((m) => m.Leitor),
  },
  { path: '**', redirectTo: '' },
];
