import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { Card, ViewState } from '../../models/card.model';
import { YugiohService } from '../../services/yugioh.service';
import { CardComponent } from '../card/card.component';

interface Category {
  label: string;
  types: string[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent],
  template: `
    <section>
      <h2>Buscador de cartas</h2>
      <input [formControl]="searchControl" type="text" placeholder="Ej: Blue-Eyes, Dark Magician..." />

      @switch (state()) {
        @case ('loading') {
          <p class="info">Cargando...</p>
        }
        @case ('error') {
          <p class="error">Ocurrió un error al consultar la API. Intenta de nuevo.</p>
        }
        @case ('empty') {
          <p class="info">No se encontraron cartas.</p>
        }
        @case ('success') {
          <div class="grid">
            @for (card of cards(); track card.id) {
              <app-card [card]="card" />
            }
          </div>
        }
        @default {
          <h3>Explorar por clasificación</h3>
          <p class="info">Elige una categoría para ver cartas de ese tipo:</p>
          <div class="categories">
            @for (cat of categories; track cat.label) {
              <button type="button" (click)="selectCategory(cat)">{{ cat.label }}</button>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      input { width: 100%; max-width: 420px; padding: 10px; border-radius: 8px; border: 1px solid #555; background: #16213e; color: #eee; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-top: 16px; }
      .info { color: #aaa; }
      .error { color: #ff6b6b; font-weight: bold; }
      .categories { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
      button { padding: 10px 18px; border-radius: 8px; border: 1px solid #d4af37; background: #16213e; color: #d4af37; cursor: pointer; }
      button:hover { background: #d4af37; color: #111; }
    `,
  ],
})
export class SearchComponent {
  private yugioh = inject(YugiohService);
  searchControl = new FormControl('', { nonNullable: true });
  cards = signal<Card[]>([]);
  state = signal<ViewState | 'idle'>('idle');

  categories: Category[] = [
    { label: 'Monstruos', types: ['Normal Monster', 'Effect Monster', 'Ritual Monster', 'Fusion Monster', 'Synchro Monster', 'Xyz Monster', 'Link Monster'] },
    { label: 'Magias', types: ['Spell Card'] },
    { label: 'Trampas', types: ['Trap Card'] },
  ];

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        // debounceTime: espera a que el usuario deje de escribir
        debounceTime(400),
        // distinctUntilChanged: no repite la misma búsqueda
        distinctUntilChanged(),
        // switchMap: cancela la petición anterior si llega una nueva
        switchMap((term) => {
          const q = term.trim();
          if (!q) {
            this.cards.set([]);
            this.state.set('idle');
            return of(null);
          }
          this.state.set('loading');
          return this.yugioh.searchCards(q).pipe(
            catchError(() => {
              this.state.set('error');
              return of(null);
            }),
          );
        }),
      )
      .subscribe((cards) => {
        if (cards === null) return;
        this.cards.set(cards.slice(0, 60));
        this.state.set(cards.length > 0 ? 'success' : 'empty');
      });
  }

  // Al elegir una clasificación, consulta la API con esos tipos de carta.
  selectCategory(cat: Category): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.state.set('loading');
    this.yugioh.getCardsByTypes(cat.types).subscribe({
      next: (cards) => {
        this.cards.set(cards.slice(0, 60));
        this.state.set(cards.length > 0 ? 'success' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }
}
