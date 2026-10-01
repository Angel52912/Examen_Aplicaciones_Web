import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Card, ViewState } from '../../models/card.model';
import { YugiohService } from '../../services/yugioh.service';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  template: `
    @if (state() === 'loading') {
      <p class="info">Cargando...</p>
    } @else if (state() === 'error') {
      <p class="error">Ocurrió un error al consultar la API.</p>
    } @else if (state() === 'empty' || !card()) {
      <p class="info">Carta no encontrada.</p>
    } @else {
      <section class="detail">
        @if (card()!.card_images?.length) {
          <img [src]="card()!.card_images![0].image_url" [alt]="card()!.name" />
        }
        <div>
          <h2>{{ card()!.name }}</h2>
          <p><strong>Tipo:</strong> {{ card()!.type }}</p>
          <p><strong>Atributo:</strong> {{ card()!.attribute ?? '—' }}</p>
          <p><strong>Nivel:</strong> {{ card()!.level ?? '—' }}</p>
          <p><strong>ATK:</strong> {{ card()!.atk ?? '—' }} / <strong>DEF:</strong> {{ card()!.def ?? '—' }}</p>
          <p><strong>Arquetipo:</strong> {{ card()!.archetype ?? '—' }}</p>
          <p class="desc">{{ card()!.desc }}</p>

          @if (card()!.card_sets?.length) {
            <h3>Impresiones</h3>
            <table>
              <thead>
                <tr><th>Expansión</th><th>Código</th><th>Rareza</th><th>Precio</th></tr>
              </thead>
              <tbody>
                @for (set of card()!.card_sets; track set.set_code + set.set_name) {
                  <tr>
                    <td>{{ set.set_name }}</td>
                    <td>{{ set.set_code }}</td>
                    <td>{{ set.set_rarity }}</td>
                    <td>{{ set.set_price }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .detail { display: flex; gap: 24px; flex-wrap: wrap; }
      img { max-width: 280px; border-radius: 10px; }
      table { border-collapse: collapse; width: 100%; margin-top: 8px; }
      th, td { border: 1px solid #444; padding: 6px 10px; text-align: left; }
      th { background: #16213e; }
      .info { color: #aaa; }
      .error { color: #ff6b6b; font-weight: bold; }
      .desc { max-width: 640px; }
    `,
  ],
})
export class CardDetailComponent {
  private route = inject(ActivatedRoute);
  private yugioh = inject(YugiohService);
  card = signal<Card | undefined>(undefined);
  state = signal<ViewState>('loading');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.state.set('empty');
      return;
    }
    this.yugioh.getCardById(id).subscribe({
      next: (cards) => {
        this.card.set(cards[0]);
        this.state.set(cards.length > 0 ? 'success' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }
}
