import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Piloto } from '../models/piloto';

@Injectable({ providedIn: 'root' })
export class PilotoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pilotos`;

  listar() {
    return this.http.get<Piloto[]>(this.url);
  }

  obtener(id: number) {
    return this.http.get<Piloto>(`${this.url}/${id}`);
  }
}
