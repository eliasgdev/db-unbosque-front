import { Routes } from '@angular/router';
import { MainLayout } from './components/templates/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'plan-cuentas', pathMatch: 'full' },
      { path: 'plan-cuentas', loadComponent: () => import('./pages/plan-cuentas/plan-cuentas').then((m) => m.PlanCuentas) },
      { path: 'asientos', loadComponent: () => import('./pages/asientos/asientos').then((m) => m.Asientos) },
      { path: 'terceros', loadComponent: () => import('./pages/terceros/terceros').then((m) => m.Terceros) },
      { path: 'empresas', loadComponent: () => import('./pages/empresas/empresas').then((m) => m.Empresas) },
      {
        path: 'estado-resultados',
        loadComponent: () => import('./pages/estado-resultados/estado-resultados').then((m) => m.EstadoResultadosPage),
      },
      {
        path: 'balance-general',
        loadComponent: () => import('./pages/balance-general/balance-general').then((m) => m.BalanceGeneralPage),
      },
    ],
  },
];
