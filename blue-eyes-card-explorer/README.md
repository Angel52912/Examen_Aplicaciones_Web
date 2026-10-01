# Blue-Eyes Card Explorer

Aplicación web en **Angular + TypeScript** que consume la API pública de Yu-Gi-Oh!
de YGOPRODeck (`https://db.ygoprodeck.com/api/v7/cardinfo.php`).
Permite buscar cartas, ver sus características, explorar el arquetipo Blue-Eyes
y filtrar sus impresiones por expansión.

## Integrantes

- Rosado Angel
- López Milton

## Cómo ejecutar

```bash
npm install
ng serve
```

Abrir `http://localhost:4200`.

## Estructura del proyecto

```
src/app/
├── models/
│   └── card.model.ts          # Interfaces: Card, CardSet, CardImage, ApiResponse, ViewState
├── services/
│   └── yugioh.service.ts      # Toda la comunicación con la API (HttpClient)
├── components/
│   ├── card/                  # CardComponent: tarjeta reutilizable
│   ├── search/                # SearchComponent: buscador con RxJS
│   ├── card-detail/           # CardDetailComponent: detalle de una carta
│   └── blue-eyes/             # BlueEyesComponent: colección y filtro de expansiones
├── app.routes.ts              # Rutas: / , /card/:id , /blue-eyes
└── app.config.ts              # provideRouter + provideHttpClient
```

## Decisiones técnicas (resumen para explicar al equipo)

- **Signals + zoneless**: este proyecto Angular es "zoneless" (sin zone.js),
  por eso el estado de la UI se actualiza con `signal()` de Angular. Con
  variables simples, los resultados de la API no redibujaban la pantalla.
- **Clasificación inicial**: cuando no hay término de búsqueda se muestran
  botones (Monstruos, Magias, Trampas); al elegir uno se consultan los
  correspondientes `type` de la API en paralelo (`forkJoin`) y se muestran
  las primeras 60 cartas.

- **Servicio único (`YugiohService`)**: centraliza todas las peticiones HTTP.
  Cada método devuelve `Observable<Card[]>`. Cuando la API responde **HTTP 400**
  (sin resultados) se interpreta como lista vacía `[]` (estado *empty*), no como
  error; los errores reales (red, 5xx) se propagan (estado *error*).
- **RxJS en el buscador**: `valueChanges` del `FormControl` se encadena con
  `debounceTime(400)` (espera a que el usuario deje de escribir),
  `distinctUntilChanged()` (evita repetir la misma búsqueda) y `switchMap`
  (cancela la petición anterior si llega un término nuevo).
- **Expansiones sin duplicados**: se generan con
  `new Set(cards.flatMap(c => c.card_sets?.map(s => s.set_name) ?? []))` y se
  ordenan. Nunca se escriben a mano.
- **Filtro dinámico**: al elegir una expansión, se filtran las cartas cuya lista
  `card_sets` contenga ese `set_name`.
- **Estados en pantalla**: cada vista muestra *loading / success / empty / error*.
- **Sin `any`**: todos los datos de la API están tipados con interfaces; los
  campos que pueden faltar (`atk`, `def`, `level`, `attribute`, `archetype`,
  `card_sets`) son opcionales (`?`) y se muestran con `—` cuando no existen.
