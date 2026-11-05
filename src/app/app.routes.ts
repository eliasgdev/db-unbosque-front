import { Routes } from '@angular/router';
import { MainLayout } from './components/templates/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        title: 'Resumen · Sistema Contable',
        loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'plan-cuentas',
        title: 'Plan de cuentas · Sistema Contable',
        loadComponent: () => import('./pages/plan-cuentas/plan-cuentas').then((m) => m.PlanCuentas),
      },
      {
        path: 'asientos',
        title: 'Asientos · Sistema Contable',
        loadComponent: () => import('./pages/asientos/asientos').then((m) => m.Asientos),
      },
      {
        path: 'terceros',
        title: 'Terceros · Sistema Contable',
        loadComponent: () => import('./pages/terceros/terceros').then((m) => m.Terceros),
      },
      {
        path: 'empresas',
        title: 'Empresas · Sistema Contable',
        loadComponent: () => import('./pages/empresas/empresas').then((m) => m.Empresas),
      },
      {
        path: 'estado-resultados',
        title: 'Estado de resultados · Sistema Contable',
        loadComponent: () =>
          import('./pages/estado-resultados/estado-resultados').then((m) => m.EstadoResultadosPage),
      },
      {
        path: 'balance-general',
        title: 'Balance general · Sistema Contable',
        loadComponent: () =>
          import('./pages/balance-general/balance-general').then((m) => m.BalanceGeneralPage),
      },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
