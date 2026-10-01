# Blue-Eyes Card Explorer — Examen práctico (Angular)

Construye una aplicación web en **Angular + TypeScript** que consuma la API pública de Yu-Gi-Oh! de YGOPRODeck.

- **Valor:** 100 puntos | **Duración:** 3 horas | **Equipos:** 2 integrantes
- **Docs de la API:** https://ygoprodeck.com/api-guide/
- **Endpoint base:** `https://db.ygoprodeck.com/api/v7/cardinfo.php`

La app debe permitir **buscar cartas y ver sus características**, y tener una sección dedicada al arquetipo **Blue-Eyes** con sus cartas y las expansiones en las que fueron impresas.

Flujo esperado:
**Buscar carta → Consultar API → Mostrar resultados → Ver características → Explorar Blue-Eyes → Consultar impresiones → Filtrar por expansión.**

---

## Requisitos funcionales

### RF-01. Buscador de cartas (20 pts)
- Input para nombre completo o parcial (ej.: `Blue-Eyes`, `Dark Magician`, `Kuriboh`).
- La búsqueda hace una petición a la API.
- **Debe usar RxJS** (`debounceTime`, `distinctUntilChanged`, `switchMap`, etc.) para NO lanzar una petición por cada tecla.

### RF-02. Resultados (15 pts)
- Resultados en **tarjetas**.
- Cada tarjeta muestra, si existe: imagen, nombre, tipo, atributo, nivel, ATK, DEF.
- Debe manejar correctamente cartas que **no tienen** ciertas propiedades (ej.: magias/trampas sin ATK/DEF/nivel/atributo).

### RF-03. Detalle de carta (15 pts)
- Al seleccionar una carta se muestra, como mínimo: imagen, nombre, tipo, descripción, atributo, nivel, ATK, DEF, arquetipo.
- Puede ser una **nueva ruta** o un **componente de detalle**.

### RF-04. Blue-Eyes Collection (20 pts)
- Sección llamada **"Blue-Eyes Collection"**.
- Consulta la API para traer las cartas del arquetipo **Blue-Eyes** (el endpoint completo NO se da: hay que sacarlo de la documentación).
- Las cartas se muestran con **componentes reutilizables** (reusar el mismo componente de tarjeta).

### RF-05. Expansiones de Blue-Eyes (15 pts)
- Para las cartas de la colección, procesar sus diferentes impresiones.
- Generar **automáticamente** la lista de expansiones encontradas, **sin duplicados**.
- **Prohibido** escribir los nombres de expansiones a mano.
- Al seleccionar una carta Blue-Eyes, mostrar como mínimo por cada impresión:

| Dato | Información |
|------|-------------|
| Expansión | Nombre del set |
| Código | Código de impresión |
| Rareza | Rareza de la carta |
| Precio | Precio proporcionado por la API |

### RF-06. Filtro de expansión (10 pts)
- El usuario selecciona una expansión.
- La app muestra **solo** las cartas Blue-Eyes que tengan una impresión en esa expansión.
- El filtrado es **dinámico**, a partir de los datos de la API.

### RF-07. Manejo de estados (5 pts)
Manejar y mostrar en la UI:
- **Loading:** mientras se consulta la API.
- **Success:** cuando hay resultados.
- **Empty:** cuando no hay resultados.
- **Error:** cuando ocurre un problema (**no basta** con `console.log`; debe verse un mensaje en pantalla).

---

## Requisitos técnicos

Usar: Angular, TypeScript, `HttpClient`, RxJS, componentes, servicios e **interfaces TypeScript**.

- La comunicación con YGOPRODeck se hace **mediante un servicio**.
- Estructura mínima (los nombres pueden cambiar si hay buena separación de responsabilidades):
  - `YugiohService`
  - `SearchComponent`
  - `CardComponent`
  - `CardDetailComponent`
  - `BlueEyesComponent`
- **No se permite** hacer toda la app en un único componente.

## Restricciones (prohibido)

- Usar `any` como solución general para los datos de la API (tipar con interfaces).
- Escribir manualmente las cartas Blue-Eyes.
- Escribir manualmente las expansiones.
- Usar un JSON local en lugar de la API.
- Simular respuestas de YGOPRODeck.
- Hacer toda la app en un solo componente.

## Entrega

1. Proyecto Angular.
2. Repositorio Git (**ambos integrantes con commits/aportaciones**).
3. Aplicación funcionando.
4. Nombre completo de ambos integrantes.

## Uso de IA

Se permite usar IA, pero **ambos integrantes deben entender el código**. Pueden pedir explicar el servicio, los operadores RxJS usados, modificar un filtro, mostrar un campo nuevo de la API, corregir una petición o explicar cómo se eliminaron expansiones duplicadas.

> Por eso: **código simple, bien comentado y fácil de explicar.**

---

# Guía de implementación para el asistente de código

## Instrucciones generales
- Angular moderno (standalone components), TypeScript estricto, `HttpClient` con `provideHttpClient()`, routing con `provideRouter`.
- Comentarios breves en español en el servicio y en los operadores RxJS (el equipo tendrá que explicarlos).
- Prefiere soluciones simples y legibles sobre soluciones "ingeniosas".
- Estilos limpios (CSS simple o el que ya esté en el proyecto), diseño en grid de tarjetas, responsive.

## Notas sobre la API YGOPRODeck v7 (verificar en la documentación)
- Búsqueda por nombre parcial: parámetro `fname` → `cardinfo.php?fname=dark magician`.
- Cartas por arquetipo: parámetro `archetype` → `cardinfo.php?archetype=Blue-Eyes`.
- La respuesta tiene la forma `{ data: Card[] }`.
- Campos útiles de cada carta: `id`, `name`, `type`, `desc`, `atk`, `def`, `level`, `attribute`, `archetype`, `card_images[]` (`image_url`, `image_url_small`) y `card_sets[]`.
- Cada elemento de `card_sets[]` trae: `set_name`, `set_code`, `set_rarity`, `set_price`.
- Muchos campos son **opcionales** (magias/trampas no tienen atk/def/level/attribute; `archetype` y `card_sets` pueden faltar) → marcarlos como opcionales (`?`) en las interfaces.
- Cuando no hay resultados la API responde **HTTP 400** con un mensaje de error: tratarlo como estado **Empty**, no como Error. Errores reales (red, 5xx) → estado **Error**.
- La API tiene límite de peticiones (~20/seg): por eso el debounce.

## Plan de trabajo sugerido

1. **Setup:** crear proyecto Angular, configurar `HttpClient` y rutas (`/`, `/card/:id`, `/blue-eyes`).
2. **Interfaces** (`models/`): `Card`, `CardImage`, `CardSet`, `ApiResponse`, y un tipo para el estado de la vista (`'loading' | 'success' | 'empty' | 'error'`).
3. **`YugiohService`:**
   - `searchCards(name: string): Observable<Card[]>` (`fname`).
   - `getBlueEyesCards(): Observable<Card[]>` (`archetype=Blue-Eyes`).
   - `getCardById(id)` si se usa ruta de detalle.
   - Manejar el 400 "sin resultados" devolviendo `[]` con `catchError`.
4. **`SearchComponent`:** `FormControl` + `valueChanges.pipe(debounceTime(400), distinctUntilChanged(), switchMap(...))`; maneja los 4 estados; muestra resultados con `CardComponent`.
5. **`CardComponent` (reutilizable):** `@Input() card`, muestra imagen, nombre, tipo, atributo, nivel, ATK, DEF con fallbacks (`—`/ocultar si no existe); emite o navega al detalle al hacer clic.
6. **`CardDetailComponent`:** muestra todos los campos del RF-03 (incluye descripción y arquetipo); en cartas Blue-Eyes, muestra además la tabla de impresiones (expansión, código, rareza, precio).
7. **`BlueEyesComponent`:**
   - Carga la colección y maneja los 4 estados.
   - Calcula las expansiones únicas desde `card_sets` (p. ej. `new Set(cards.flatMap(c => c.card_sets?.map(s => s.set_name) ?? []))`, ordenadas).
   - `<select>` de expansión; al elegir una, filtra las cartas que tengan una impresión con ese `set_name`.
   - Reutiliza `CardComponent`.
8. **Navegación:** barra simple con enlaces "Buscador" y "Blue-Eyes Collection".
9. **Revisión final contra la rúbrica:** sin `any`, sin datos hardcodeados, sin `console.log` como único manejo de error, estados visibles en pantalla, varios componentes.

## Criterio de "terminado"
- Buscar "Dark Magician" muestra tarjetas; "xyzxyz" muestra estado vacío; sin internet muestra error en pantalla.
- Blue-Eyes Collection lista cartas, genera expansiones sin duplicados y el filtro funciona.
- El detalle de una carta Blue-Eyes muestra expansión, código, rareza y precio.
- `ng build` compila sin errores.


___________________________________________________________________________________________________

Especificaciones del Proyecto
1. Estructura de Archivos y Arquitectura
Para garantizar una estructura limpia y modular, el proyecto debe organizarse de la siguiente manera:

Una carpeta principal que contenga los recursos base de la interfaz (manteniendo una separación lógica de responsabilidades):

Un archivo HTML (estructura).

Un archivo CSS (estilos).

Un archivo JS principal para la lógica de la interfaz.

Los siguientes elementos deben ubicarse fuera de esta carpeta principal:

Un archivo app.js (controlador principal o punto de entrada).

Un archivo config.json o archivos de datos en formato JSON.

2. Validación y Funcionalidad
Validación de funciones: Debes encargarte de verificar y asegurar que las funciones críticas operen correctamente.

Optimización de recursos:

Utiliza de forma eficiente clases e IDs en HTML/CSS para reducir la redundancia de elementos y optimizar el rendimiento del DOM.

Mantén el código limpio y reutilizable.

3. Estética y Diseño Visual
Temática: El estilo visual y la atmósfera del proyecto deben fusionar la estética de Yu-Gi-Oh! (duelos, misterio, interfaz de tablero/cartas) con la de Kakegurui (apuestas de alto riesgo, elegancia oscura, dramatismo y opulencia caótica).

4. Documentación
Claridad y Humanización: El trabajo debe documentarse de forma clara, directa y fácil de leer.

Los conceptos explicados deben ser comprensibles por sí mismos (legibles y claros, incluso si el lector examina la documentación fuera de su contexto original).