import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Card, ViewState } from '../../models/card.model';
import { YugiohService } from '../../services/yugioh.service';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  template: `
    @if (state() === 'loading') {
      <p class="info">Cargando...</p>
    } @else if (state() === 'error') {
      <button class="back-link" type="button" (click)="goBack()">← Volver</button>
      <p class="error" role="alert">Ocurrió un error al consultar la API.</p>
    } @else if (state() === 'empty' || !card()) {
      <button class="back-link" type="button" (click)="goBack()">← Volver</button>
      <p class="info">Carta no encontrada.</p>
    } @else {
      <button class="back-link" type="button" (click)="goBack()">← Volver</button>
      <section class="detail">
        <div class="artwork">
          @if (card()!.card_images?.length) {
            <img [src]="card()!.card_images![0].image_url" [alt]="card()!.name" />
          }
          <span>YGO · CARD ARCHIVE</span>
        </div>
        <div class="card-info">
          <p class="eyebrow">{{ card()!.archetype ?? 'DUEL MONSTERS' }}</p>
          <h2>{{ card()!.name }}</h2>
          <p class="type">{{ card()!.type }}</p>
          <dl class="facts">
            <div><dt>Atributo</dt><dd>{{ card()!.attribute ?? '—' }}</dd></div>
            <div><dt>Nivel</dt><dd>{{ card()!.level ?? '—' }}</dd></div>
            <div><dt>ATK</dt><dd>{{ card()!.atk ?? '—' }}</dd></div>
            <div><dt>DEF</dt><dd>{{ card()!.def ?? '—' }}</dd></div>
            <div><dt>Arquetipo</dt><dd>{{ card()!.archetype ?? '—' }}</dd></div>
          </dl>
          <p class="desc">{{ card()!.desc }}</p>

          @if (card()!.card_sets?.length) {
            <h3 class="prints-heading">Impresiones</h3>
            <div class="table-scroll"><table>
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
            </table></div>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .back-link { display: inline-flex; align-items: center; margin-bottom: 22px; padding: 9px 14px; border: 1px solid var(--line); background: var(--panel); color: var(--ice); cursor: pointer; text-decoration: none; font: 600 .78rem/1 'Cinzel', Georgia, serif; transition: border-color .18s ease, color .18s ease, background .18s ease; }
      .back-link:hover { border-color: var(--gold); color: var(--gold-bright); background: var(--panel-raised); }
      .detail { display: grid; grid-template-columns: minmax(220px, 350px) minmax(0, 1fr); gap: clamp(24px, 5vw, 64px); align-items: start; }
      .artwork { position: relative; padding: 12px; border: 1px solid var(--gold); background: linear-gradient(145deg, #241a38, #0c0912); box-shadow: 0 22px 54px rgb(0 0 0 / 48%), 0 0 34px rgb(201 162 75 / 10%); }
      .artwork img { display: block; width: 100%; aspect-ratio: .69; object-fit: contain; background: #07050b; }
      .artwork span { display: block; padding-top: 9px; color: var(--gold); font: 700 .56rem/1 'Cinzel', Georgia, serif; letter-spacing: .12em; }
      .eyebrow { margin: 0 0 8px; color: var(--rose); font: 700 .66rem/1.4 'Cinzel', Georgia, serif; text-transform: uppercase; }
      h2 { margin: 0; color: var(--gold-bright); font-size: clamp(1.7rem, 5vw, 2.6rem); line-height: 1.12; }
      .type { margin: 9px 0 22px; color: var(--muted); font: .88rem/1.5 'EB Garamond', Georgia, serif; }
      .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 1px; margin: 0; border: 1px solid var(--line); background: var(--line); }
      .facts div { min-height: 66px; padding: 11px; background: var(--panel); }
      dt { color: var(--gold); font: 700 .6rem/1.2 'Cinzel', Georgia, serif; text-transform: uppercase; letter-spacing: .06em; }
      dd { margin: 6px 0 0; color: var(--text); font: 600 .9rem/1.3 'EB Garamond', Georgia, serif; }
      .desc { max-width: 760px; margin: 23px 0; color: #d8d0c2; font: 1rem/1.7 'EB Garamond', Georgia, serif; white-space: pre-line; }
      .prints-heading { margin: 30px 0 10px; color: var(--gold-bright); font-size: 1.15rem; }
      .table-scroll { max-width: 100%; overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; font: .84rem/1.45 'EB Garamond', Georgia, serif; }
      th, td { padding: 10px 12px; border: 1px solid var(--line); text-align: left; white-space: nowrap; }
      th { color: var(--gold-bright); background: var(--panel-raised); font-family: 'Cinzel', Georgia, serif; font-size: .68rem; letter-spacing: .06em; }
      td { background: rgb(19 15 28 / 72%); }
      .info { color: var(--muted); }
      .error { color: var(--danger); font-weight: bold; }
      @media (max-width: 680px) { .detail { grid-template-columns: 1fr; } .artwork { width: min(100%, 350px); } }
    `,
  ],
})
export class CardDetailComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private router = inject(Router);
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

  // Vuelve a la página anterior (de donde se abrió la carta). Solo si no hay
  // historial navegable cae al inicio.
  goBack(): void {
    if (history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
