import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Card, ViewState } from '../../models/card.model';
import { YugiohService } from '../../services/yugioh.service';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-blue-eyes',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent],
  template: `
    <section>
      <h2>Blue-Eyes Collection</h2>

      @if (state() === 'loading') {
        <p class="info">Cargando...</p>
      } @else if (state() === 'error') {
        <p class="error">Ocurrió un error al consultar la API.</p>
      } @else if (state() === 'empty') {
        <p class="info">No hay cartas Blue-Eyes disponibles.</p>
      } @else {
        <label for="exp">Filtrar por expansión:</label>
        <select id="exp" [formControl]="expansionControl">
          <option value="">Todas</option>
          @for (exp of expansions(); track exp) {
            <option [value]="exp">{{ exp }}</option>
          }
        </select>

        @if (filteredCards().length === 0) {
          <p class="info">Ninguna carta coincide con esa expansión.</p>
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
      select { padding: 8px; border-radius: 8px; background: #16213e; color: #eee; border: 1px solid #555; margin-left: 8px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-top: 16px; }
      .info { color: #aaa; }
      .error { color: #ff6b6b; font-weight: bold; }
    `,
  ],
})
export class BlueEyesComponent {
  private yugioh = inject(YugiohService);
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
        this.filteredCards.set(cards);
      },
      error: () => this.state.set('error'),
    });

    // Cada vez que cambia la expansión elegida, filtramos dinámicamente.
    this.expansionControl.valueChanges.subscribe((exp) => {
      this.filteredCards.set(
        exp ? this.cards.filter((c) => c.card_sets?.some((s) => s.set_name === exp)) : this.cards,
      );
    });
  }
}
