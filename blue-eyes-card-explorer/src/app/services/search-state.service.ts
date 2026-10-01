import { Injectable } from '@angular/core';
import { Card } from '../models/card.model';

// Estado de la página de búsqueda. Angular destruye el componente al navegar
// a otra ruta, por eso guardamos aquí el texto, la categoría y las cartas ya
// cargadas. Así, al volver desde el detalle de una carta, la página se
// reconstruye exactamente como estaba (misma búsqueda y mismo filtro).
export interface SearchSnapshot {
  saved: boolean;
  name: string;
  categoryKey: string;
  cards: Card[];
  hasMore: boolean;
}

// Estado de la colección Blue-Eyes (para conservar la expansión elegida).
export interface BlueEyesSnapshot {
  saved: boolean;
  expansion: string;
}

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  snapshot: SearchSnapshot = {
    saved: false,
    name: '',
    categoryKey: 'all',
    cards: [],
    hasMore: false,
  };

  blueEyes: BlueEyesSnapshot = { saved: false, expansion: '' };

  save(partial: Partial<SearchSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial, saved: true };
  }

  saveBlueEyes(expansion: string): void {
    this.blueEyes = { saved: true, expansion };
  }
}
