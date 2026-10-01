import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '../../models/card.model';

// Componente reutilizable: muestra los datos básicos de una carta.
// Se usa tanto en el buscador como en la colección Blue-Eyes.
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a class="card" [routerLink]="['/card', card.id]">
      @if (card.card_images?.length) {
        <img [src]="card.card_images![0].image_url" [alt]="card.name" loading="lazy" />
      } @else {
        <div class="no-img">Sin imagen</div>
      }
      <div class="card-copy">
        <h3>{{ card.name }}</h3>
        <p class="type">{{ card.type }}</p>
        <div class="stats">
          <span><small>ATTRIBUTE</small>{{ card.attribute ?? '—' }}</span>
          <span><small>LEVEL</small>{{ card.level ?? '—' }}</span>
          <span><small>ATK</small>{{ card.atk ?? '—' }}</span>
          <span><small>DEF</small>{{ card.def ?? '—' }}</span>
        </div>
        <span class="inspect">Ver carta <span aria-hidden="true">↗</span></span>
      </div>
    </a>
  `,
  styles: [
    `
      :host { display: block; min-width: 0; }
      .card { position: relative; display: block; height: 100%; overflow: hidden; color: var(--text); text-decoration: none; background: linear-gradient(155deg, #1e1630, #0d0a14 62%); border: 1px solid var(--line); transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease; }
      .card::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(160deg, rgb(201 162 75 / 10%), transparent 42%); opacity: 0; transition: opacity .22s ease; }
      .card:hover, .card:focus-visible { transform: translateY(-5px); border-color: var(--gold); box-shadow: 0 16px 34px rgb(0 0 0 / 48%), 0 0 26px rgb(201 162 75 / 14%); outline: none; }
      .card:hover::before, .card:focus-visible::before { opacity: 1; }
      img, .no-img { display: block; width: 100%; aspect-ratio: 0.69; object-fit: contain; background: #07050b; border-bottom: 1px solid var(--line-soft); }
      .no-img { display: grid; place-items: center; color: var(--muted); }
      .card-copy { padding: 14px; }
      h3 { min-height: 2.5em; margin: 0 0 5px; color: var(--gold-bright); font-size: .98rem; line-height: 1.25; }
      .type { min-height: 2em; margin: 0 0 13px; color: var(--muted); font: .74rem/1.4 'EB Garamond', Georgia, serif; }
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 11px; border-top: 1px solid var(--line-soft); font: .8rem/1.3 'EB Garamond', Georgia, serif; }
      .stats span { display: grid; gap: 3px; }
      .stats small { color: var(--gold); font-size: .56rem; font-weight: 700; letter-spacing: .08em; }
      .inspect { display: flex; justify-content: space-between; margin-top: 13px; color: var(--ice); font-size: .68rem; font-weight: 600; }
      .card:hover .inspect { color: var(--rose); }
    `,
  ],
})
export class CardComponent {
  @Input({ required: true }) card!: Card;
}
