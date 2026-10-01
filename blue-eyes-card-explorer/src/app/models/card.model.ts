// Interfaces TypeScript para tipar la respuesta de la API de YGOPRODeck.
// Muchos campos son opcionales porque las cartas de Magia/Trampa
// no tienen ATK, DEF, nivel ni atributo, y algunas cartas no tienen
// arquetipo ni impresiones (card_sets).

export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_price: string;
}

export interface Card {
  id: number;
  name: string;
  type: string;
  desc: string;
  archetype?: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  card_images?: CardImage[];
  card_sets?: CardSet[];
}

export interface ApiResponse {
  data: Card[];
}

// Estados posibles de la vista (loading / success / empty / error)
export type ViewState = 'loading' | 'success' | 'empty' | 'error';
