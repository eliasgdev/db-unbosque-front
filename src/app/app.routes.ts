import { Routes } from '@angular/router';
import { MainLayout } from './components/templates/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'pilotos', pathMatch: 'full' },
      { path: 'pilotos', loadComponent: () => import('./pages/pilotos/pilotos').then((m) => m.Pilotos) },
    ],
  },
];
