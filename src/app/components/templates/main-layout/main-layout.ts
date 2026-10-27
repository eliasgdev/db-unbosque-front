import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet],
  template: `
    <header><h1>DB Unbosque</h1></header>
    <main><router-outlet /></main>
  `,
})
export class MainLayout {}
