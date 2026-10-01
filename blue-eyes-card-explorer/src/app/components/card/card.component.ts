import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Card } from '../../models/card.model';

// Componente reutilizable: muestra los datos básicos de una carta.
// Se usa tanto en el buscador como en la colección Blue-Eyes.
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <article class="card" (click)="goToDetail()">
      @if (card.card_images?.length) {
        <img [src]="card.card_images![0].image_url_small" [alt]="card.name" />
      } @else {
        <div class="no-img">Sin imagen</div>
      }
      <h3>{{ card.name }}</h3>
      <p class="type">{{ card.type }}</p>
      <ul>
        <li><strong>Atributo:</strong> {{ card.attribute ?? '—' }}</li>
        <li><strong>Nivel:</strong> {{ card.level ?? '—' }}</li>
        <li><strong>ATK:</strong> {{ card.atk ?? '—' }}</li>
        <li><strong>DEF:</strong> {{ card.def ?? '—' }}</li>
      </ul>
    </article>
  `,
  styles: [
    `
      .card { background: #1a1a2e; border: 1px solid #444; border-radius: 10px; padding: 12px; cursor: pointer; color: #eee; transition: transform .15s; }
      .card:hover { transform: scale(1.03); border-color: #d4af37; }
      img { width: 100%; border-radius: 6px; }
      .no-img { height: 160px; display: grid; place-items: center; background: #111; border-radius: 6px; color: #777; }
      h3 { font-size: 1rem; margin: 8px 0 4px; }
      .type { color: #d4af37; margin: 0 0 8px; font-size: .85rem; }
      ul { list-style: none; padding: 0; margin: 0; font-size: .85rem; }
      li { margin: 2px 0; }
    `,
  ],
})
export class CardComponent {
  @Input({ required: true }) card!: Card;
  private router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/card', this.card.id]);
  }
}
