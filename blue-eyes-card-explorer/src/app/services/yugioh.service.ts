import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, Card } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class YugiohService {
  private http = inject(HttpClient);
  private baseUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

  // Búsqueda por nombre parcial usando el parámetro `fname`.
  // Si la API responde 400 (sin resultados), devolvemos [] en lugar de fallar.
  searchCards(name: string): Observable<Card[]> {
    return this.get(`?fname=${encodeURIComponent(name)}`);
  }

  // Cartas del arquetipo Blue-Eyes usando el parámetro `archetype`.
  getBlueEyesCards(): Observable<Card[]> {
    return this.get(`?archetype=${encodeURIComponent('Blue-Eyes')}`);
  }

  // Una carta por su id numérico.
  getCardById(id: number): Observable<Card[]> {
    return this.get(`?id=${id}`);
  }

  // Tarjetas de uno o varios tipos exactos (p. ej. 'Spell Card', 'Effect Monster').
  // Se lanzan en paralelo con forkJoin y se unen en una sola lista sin duplicados.
  getCardsByTypes(types: string[]): Observable<Card[]> {
    if (types.length === 0) return of([]);
    return forkJoin(types.map((t) => this.get(`?type=${encodeURIComponent(t)}`))).pipe(
      map((results) => {
        const seen = new Set<number>();
        return results.flat().filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
      }),
    );
  }

  // GET genérico: extrae `data` y trata el 400 (sin resultados) como lista vacía.
  private get(query: string): Observable<Card[]> {
    return this.http.get<ApiResponse>(`${this.baseUrl}${query}`).pipe(
      map((res) => res.data ?? []),
      catchError((err: HttpErrorResponse) =>
        err.status === 400 ? of([]) : throwError(() => err),
      ),
    );
  }
}
