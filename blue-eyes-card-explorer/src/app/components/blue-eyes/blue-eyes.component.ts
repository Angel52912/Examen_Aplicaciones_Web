import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Card, ViewState } from '../../models/card.model';
import { YugiohService } from '../../services/yugioh.service';
import { SearchStateService } from '../../services/search-state.service';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-blue-eyes',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent],
  template: `
    <section class="collection-page">
      <header class="section-header">
        <p class="eyebrow">ARCHETYPE DOSSIER / 001</p>
        <h1>Blue-Eyes Collection</h1>
        <p>Una colección de cartas del arquetipo Blue-Eyes, reunidas desde el archivo oficial.</p>
      </header>

      @if (state() === 'loading') {
        <p class="status info" role="status">Cargando la colección...</p>
      } @else if (state() === 'error') {
        <p class="status error" role="alert">No se pudo cargar la colección. Comprueba tu conexión e inténtalo de nuevo.</p>
      } @else if (state() === 'empty') {
        <p class="status info" role="status">No hay cartas Blue-Eyes disponibles.</p>
      } @else {
        <div class="collection-tools">
          <div class="collection-total"><strong>{{ filteredCards().length }}</strong><span>de {{ cards.length }} cartas</span></div>
          <label for="exp">Filtrar por expansión
            <select id="exp" [formControl]="expansionControl">
              <option value="">Todas las expansiones</option>
              @for (exp of expansions(); track exp) {
                <option [value]="exp">{{ exp }}</option>
              }
            </select>
          </label>
        </div>

        @if (filteredCards().length === 0) {
          <p class="status info" role="status">Ninguna carta coincide con esa expansión.</p>
        } @else {
          <div class="grid">
            @for (card of filteredCards(); track card.id) {
              <app-card [card]="card" />
            }
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .section-header { margin-bottom: 28px; padding-bottom: 25px; border-bottom: 1px solid var(--line); }
      .eyebrow { margin: 0 0 10px; color: var(--rose); font: 700 .66rem/1.3 'Cinzel', Georgia, serif; }
      h1 { margin: 0; color: var(--gold-bright); font-size: clamp(1.8rem, 5vw, 2.7rem); line-height: 1.12; }
      .section-header > p:last-child { max-width: 620px; margin: 10px 0 0; color: var(--muted); font: .95rem/1.55 'EB Garamond', Georgia, serif; }
      .collection-tools { display: flex; justify-content: space-between; align-items: end; gap: 20px; padding: 16px 0; border-bottom: 1px solid var(--line); }
      .collection-total { display: flex; align-items: baseline; gap: 9px; color: var(--muted); font: .72rem/1.3 'Cinzel', Georgia, serif; }
      .collection-total strong { color: var(--gold-bright); font: 1.8rem/1 'Cinzel', Georgia, serif; }
      label { display: grid; gap: 7px; color: var(--gold); font: 700 .62rem/1.2 'Cinzel', Georgia, serif; text-transform: uppercase; }
      select { min-width: min(290px, 70vw); min-height: 44px; padding: 0 34px 0 12px; border: 1px solid var(--line); border-radius: 0; background: var(--panel); color: var(--text); font: .92rem/1.4 'EB Garamond', Georgia, serif; }
      select:focus { outline: 1px solid var(--gold); outline-offset: 2px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 18px; margin-top: 20px; }
      .status { margin: 24px 0; padding: 15px 17px; border-left: 2px solid var(--ice); background: rgb(19 15 28 / 78%); color: var(--muted); font: .92rem/1.5 'EB Garamond', Georgia, serif; }
      .error { border-color: var(--danger); color: var(--danger); }
      @media (max-width: 600px) { .collection-tools { align-items: stretch; flex-direction: column; } select { width: 100%; } .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; } }
    `,
  ],
})
export class BlueEyesComponent {
  private yugioh = inject(YugiohService);
  private searchState = inject(SearchStateService);
  cards: Card[] = [];
  expansions = signal<string[]>([]);
  filteredCards = signal<Card[]>([]);
  state = signal<ViewState>('loading');
  expansionControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.yugioh.getBlueEyesCards().subscribe({
      next: (cards) => {
        this.cards = cards;
        this.state.set(cards.length > 0 ? 'success' : 'empty');
        // Expansiones únicas generadas desde los datos de la API (sin escribirlas a mano).
        // flatMap une todos los card_sets de todas las cartas; Set elimina duplicados.
        this.expansions.set(
          Array.from(new Set(cards.flatMap((c) => c.card_sets?.map((s) => s.set_name) ?? []))).sort(),
        );
        // Restaura la expansión que estaba elegida antes de abrir una carta.
        const savedExpansion = this.searchState.blueEyes.expansion;
        if (savedExpansion && this.expansions().includes(savedExpansion)) {
          this.expansionControl.setValue(savedExpansion, { emitEvent: false });
        }
        this.applyFilter(this.expansionControl.value);
      },
      error: () => this.state.set('error'),
    });

    // Cada vez que cambia la expansión elegida, filtramos dinámicamente.
    this.expansionControl.valueChanges.subscribe((exp) => this.applyFilter(exp));
  }

  private applyFilter(exp: string): void {
    this.filteredCards.set(
      exp ? this.cards.filter((c) => c.card_sets?.some((s) => s.set_name === exp)) : this.cards,
    );
    this.searchState.saveBlueEyes(exp);
  }
}
