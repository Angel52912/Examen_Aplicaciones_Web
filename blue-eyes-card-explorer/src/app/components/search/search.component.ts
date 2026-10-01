import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Card, ViewState } from '../../models/card.model';
import { CardQuery, YugiohService } from '../../services/yugioh.service';
import { SearchStateService } from '../../services/search-state.service';
import { CardComponent } from '../card/card.component';

// Categorías del filtro. Cada una se traduce en parámetros de la API
// (`type` y/o `attribute`). No hay datos escritos a mano de cartas ni
// expansiones: los resultados siempre vienen de la API.
interface Category {
  key: string;
  label: string;
  types: string[];
  attributes: string[];
}

const PAGE_SIZE = 60;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent],
  template: `
    <section class="explorer-page">
      <header class="section-header">
        <h1>Archivo de cartas</h1>
        <p>Escribe un nombre o elige una categoría y la lista se filtra al momento.</p>
      </header>

      <label class="search-field" for="card-search">
        <span>Nombre de la carta</span>
        <input id="card-search" [formControl]="searchControl" type="search" placeholder="Ej: Blue-Eyes, Dark Magician, Kuriboh..." />
      </label>

      <div class="categories" role="group" aria-label="Filtrar por categoría">
        @for (cat of categories; track cat.key) {
          <button
            type="button"
            [class.active]="selectedCategory() === cat.key"
            [attr.aria-pressed]="selectedCategory() === cat.key"
            (click)="selectCategory(cat.key)">
            {{ cat.label }}
          </button>
        }
      </div>

      @switch (state()) {
        @case ('loading') {
          <p class="status info" role="status">Consultando el archivo de cartas...</p>
        }
        @case ('error') {
          <p class="status error" role="alert">No se pudo conectar con el archivo. Comprueba tu conexión e inténtalo de nuevo.</p>
        }
        @case ('empty') {
          <p class="status info" role="status">No se encontraron cartas con esos criterios.</p>
        }
        @default {
          <p class="result-count">
            @if (hasMore()) { Mostrando {{ items().length }} cartas } @else { {{ items().length }} cartas }
          </p>
          <div class="grid">
            @for (card of items(); track card.id) {
              <app-card [card]="card" />
            }
          </div>
          @if (hasMore()) {
            <div class="more-row">
              <button class="more" type="button" [disabled]="loadingMore()" (click)="loadMore()">
                {{ loadingMore() ? 'Cargando...' : 'Cargar más cartas' }}
              </button>
            </div>
          }
        }
      }
    </section>
  `,
  styles: [
    `
      .section-header { margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid var(--line); }
      .eyebrow { margin: 0 0 10px; color: var(--rose); font: 700 .66rem/1.3 'Cinzel', Georgia, serif; }
      h1 { margin: 0; color: var(--gold-bright); font-size: clamp(1.8rem, 5vw, 2.7rem); line-height: 1.12; }
      .section-header > p:last-child { max-width: 700px; margin: 10px 0 0; color: var(--muted); font: .95rem/1.55 'EB Garamond', Georgia, serif; }
      .search-field { display: grid; gap: 8px; width: min(100%, 620px); color: var(--gold); font: 700 .66rem/1.2 'Cinzel', Georgia, serif; text-transform: uppercase; }
      input { width: 100%; min-height: 52px; padding: 0 16px; border: 1px solid var(--line); outline: none; background: #0d0a14; color: var(--text); font: 1rem/1.4 'EB Garamond', Georgia, serif; }
      input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgb(201 162 75 / 12%); }
      input::placeholder { color: #7f7488; }
      .categories { display: flex; flex-wrap: wrap; gap: 9px; margin: 20px 0 4px; }
      .categories button { display: inline-flex; align-items: center; min-height: 40px; padding: 0 15px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); cursor: pointer; font: 600 .72rem/1 'Cinzel', Georgia, serif; transition: border-color .16s ease, color .16s ease, background .16s ease; }
      .categories button:hover { border-color: var(--gold); color: var(--gold-bright); }
      .categories button.active { border-color: var(--gold); background: linear-gradient(180deg, rgb(201 162 75 / 16%), rgb(142 27 46 / 16%)); color: var(--gold-bright); box-shadow: inset 0 0 14px rgb(201 162 75 / 12%); }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 18px; margin-top: 14px; }
      .status { margin: 24px 0; padding: 15px 17px; border-left: 2px solid var(--ice); background: rgb(19 15 28 / 78%); font: .92rem/1.5 'EB Garamond', Georgia, serif; }
      .error { border-color: var(--danger); color: var(--danger); }
      .result-count { margin: 26px 0 0; color: var(--muted); font: .68rem/1.4 'Cinzel', Georgia, serif; text-transform: uppercase; }
      .more-row { display: flex; justify-content: center; margin-top: 30px; }
      .more { min-height: 46px; padding: 0 26px; border: 1px solid var(--gold); background: linear-gradient(180deg, rgb(201 162 75 / 14%), rgb(142 27 46 / 12%)); color: var(--gold-bright); cursor: pointer; font: 600 .76rem/1 'Cinzel', Georgia, serif; transition: background .18s ease, box-shadow .18s ease; }
      .more:hover:not(:disabled) { box-shadow: 0 0 22px rgb(201 162 75 / 18%); }
      .more:disabled { opacity: .55; cursor: progress; }
      @media (max-width: 650px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; } }
    `,
  ],
})
export class SearchComponent {
  private yugioh = inject(YugiohService);
  private searchState = inject(SearchStateService);
  searchControl = new FormControl('', { nonNullable: true });
  items = signal<Card[]>([]);
  state = signal<ViewState>('loading');
  loadingMore = signal(false);
  hasMore = signal(false);
  private activeRequest?: Subscription;

  // Filtros actuales (reaccionan al buscador y a las categorías).
  readonly name = signal('');
  readonly selectedCategory = signal('all');

  readonly categories: Category[] = [
    { key: 'all', label: 'Todas', types: [], attributes: [] },
    { key: 'monsters', label: 'Monstruos', types: [], attributes: ['dark', 'earth', 'fire', 'light', 'water', 'wind', 'divine'] },
    { key: 'normal', label: 'Normales', types: ['Normal Monster'], attributes: [] },
    { key: 'effect', label: 'Efecto', types: ['Effect Monster'], attributes: [] },
    { key: 'ritual', label: 'Ritual', types: ['Ritual Monster', 'Ritual Effect Monster'], attributes: [] },
    { key: 'fusion', label: 'Fusión', types: ['Fusion Monster'], attributes: [] },
    { key: 'synchro', label: 'Sincronía', types: ['Synchro Monster'], attributes: [] },
    { key: 'xyz', label: 'Xyz', types: ['XYZ Monster'], attributes: [] },
    { key: 'link', label: 'Link', types: ['Link Monster'], attributes: [] },
    { key: 'spell', label: 'Magias', types: ['Spell Card'], attributes: [] },
    { key: 'trap', label: 'Trampas', types: ['Trap Card'], attributes: [] },
  ];

  constructor() {
    // Si volvemos desde el detalle de una carta hay un estado guardado:
    // restauramos el texto, la categoría y las cartas sin volver a consultar.
    const saved = this.searchState.snapshot;
    if (saved.saved) {
      this.searchControl.setValue(saved.name, { emitEvent: false });
      this.name.set(saved.name);
      this.selectedCategory.set(saved.categoryKey);
      this.items.set(saved.cards);
      this.hasMore.set(saved.hasMore);
      this.state.set(saved.cards.length > 0 ? 'success' : 'empty');
    } else {
      // Primera visita: cargamos el catálogo inicial (cartas sin buscar ni filtrar).
      this.yugioh.getCatalog(PAGE_SIZE).subscribe({
        next: (cards) => {
          this.items.set(cards);
          this.hasMore.set(cards.length === PAGE_SIZE);
          this.state.set(cards.length > 0 ? 'success' : 'empty');
          this.persist();
        },
        error: () => this.state.set('error'),
      });
    }

    // Al escribir: espera (debounce), evita repetir la misma búsqueda
    // (distinctUntilChanged) y vuelve a consultar la API con los filtros.
    // El nombre se guarda de inmediato para que al cambiar de categoría
    // se aplique ya el texto actual, sin esperar al debounce.
    this.searchControl.valueChanges.subscribe((term) => this.name.set(term));

    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        map((term) => `${term.trim().toLowerCase()}|${this.selectedCategory()}`),
        distinctUntilChanged(),
      )
      .subscribe(() => this.loadFirstPage());
  }

  // Guarda el estado actual para poder reconstruir la página al volver.
  private persist(): void {
    this.searchState.save({
      name: this.name(),
      categoryKey: this.selectedCategory(),
      cards: this.items(),
      hasMore: this.hasMore(),
    });
  }

  // Cambiar de categoría reconsulta al instante y conserva el nombre escrito.
  selectCategory(key: string): void {
    this.selectedCategory.set(key);
    this.loadFirstPage();
  }

  // Carga la primera página de resultados según los filtros actuales.
  private loadFirstPage(): void {
    const query = this.buildQuery();
    this.state.set('loading');
    this.activeRequest?.unsubscribe();
    this.activeRequest = this.yugioh.searchCards(query, PAGE_SIZE, 0).subscribe({
      next: (cards) => {
        this.items.set(cards);
        this.hasMore.set(cards.length === PAGE_SIZE);
        this.state.set(cards.length > 0 ? 'success' : 'empty');
        this.persist();
      },
      error: () => this.state.set('error'),
    });
  }

  // Trae la siguiente página y la añade a lo ya mostrado.
  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);
    this.yugioh.searchCards(this.buildQuery(), PAGE_SIZE, this.items().length).subscribe({
      next: (cards) => {
        this.items.update((prev) => [...prev, ...cards]);
        this.hasMore.set(cards.length === PAGE_SIZE);
        this.loadingMore.set(false);
        this.persist();
      },
      error: () => {
        this.loadingMore.set(false);
        this.state.set('error');
      },
    });
  }

  // Construye los parámetros de la API a partir de los filtros actuales.
  private buildQuery(): CardQuery {
    const cat = this.categories.find((c) => c.key === this.selectedCategory()) ?? this.categories[0];
    return {
      name: this.name(),
      types: cat.types,
      attributes: cat.attributes,
    };
  }
}
