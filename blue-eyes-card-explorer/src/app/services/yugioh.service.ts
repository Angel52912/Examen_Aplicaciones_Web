import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, Card } from '../models/card.model';

// Filtros que puede aplicar el buscador de la página de inicio.
export interface CardQuery {
  name?: string;
  types?: string[];
  attributes?: string[];
}

@Injectable({ providedIn: 'root' })
export class YugiohService {
  private http = inject(HttpClient);
  private baseUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

  // Catálogo inicial: primeras cartas ordenadas por nombre.
  // Así la página de inicio muestra cartas sin necesidad de buscar ni filtrar.
  getCatalog(limit = 60, offset = 0): Observable<Card[]> {
    return this.get(`?sort=name&num=${limit}&offset=${offset}`);
  }

  // Búsqueda combinada: nombre (fname) + categorías (type) + atributo (attribute).
  // Todos los parámetros se aplican a la vez, de modo que escribir en el
  // buscador o elegir una categoría refina la lista que ya se ve en pantalla.
  searchCards(query: CardQuery, limit = 60, offset = 0): Observable<Card[]> {
    const params: string[] = [`num=${limit}`, `offset=${offset}`];
    const name = query.name?.trim();
    if (name) params.push(`fname=${encodeURIComponent(name)}`);
    if (query.types?.length) params.push(`type=${encodeURIComponent(query.types.join(','))}`);
    if (query.attributes?.length) params.push(`attribute=${encodeURIComponent(query.attributes.join(','))}`);
    return this.get(`?${params.join('&')}`);
  }

  // Cartas del arquetipo Blue-Eyes usando el parámetro `archetype`.
  getBlueEyesCards(): Observable<Card[]> {
    return this.get(`?archetype=${encodeURIComponent('Blue-Eyes')}`);
  }

  // Una carta por su id numérico.
  getCardById(id: number): Observable<Card[]> {
    return this.get(`?id=${id}`);
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
