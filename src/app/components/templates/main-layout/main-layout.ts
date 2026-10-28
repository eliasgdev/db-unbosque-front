import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SelectorContexto } from '../../organisms/selector-contexto/selector-contexto';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SelectorContexto],
  template: `
    <header>
      <h1>Sistema Contable</h1>
      <nav>
        <a routerLink="/plan-cuentas" routerLinkActive="active">Plan de cuentas</a>
        <a routerLink="/asientos" routerLinkActive="active">Asientos</a>
        <a routerLink="/estado-resultados" routerLinkActive="active">Estado de resultados</a>
        <a routerLink="/balance-general" routerLinkActive="active">Balance general</a>
      </nav>
    </header>
    <main>
      <app-selector-contexto />
      <router-outlet />
    </main>
  `,
})
export class MainLayout {}
