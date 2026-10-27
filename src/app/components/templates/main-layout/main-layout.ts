import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <h1>DB Unbosque</h1>
      <nav>
        <a routerLink="/contabilidad" routerLinkActive="active">Contabilidad</a>
        <a routerLink="/pilotos" routerLinkActive="active">Pilotos</a>
      </nav>
    </header>
    <main><router-outlet /></main>
  `,
})
export class MainLayout {}
