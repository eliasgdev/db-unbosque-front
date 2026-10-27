import { Routes } from '@angular/router';
import { MainLayout } from './components/templates/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'contabilidad', pathMatch: 'full' },
      { path: 'contabilidad', loadComponent: () => import('./pages/contabilidad/contabilidad').then((m) => m.Contabilidad) },
      { path: 'pilotos', loadComponent: () => import('./pages/pilotos/pilotos').then((m) => m.Pilotos) },
    ],
  },
];
