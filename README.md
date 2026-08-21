# Vetrina — siti dimostrativi per settore

Siti di esempio realizzati da **[Sito in Vista](https://pamcripty.github.io/sito-in-vista/)**
per mostrare, a chi fa un certo mestiere, che cosa può diventare il suo sito.

Ogni cartella è un sito **realmente autonomo**: proprio linguaggio visivo,
propri contenuti, propri file. Nessun modello riciclato fra un settore e l'altro.

| Cartella | Settore | Pacchetto |
|---|---|---|
| `imbianchino/` | Tinteggiature e decorazioni | Sito Professionale |
| `idraulico/` | Idraulica e riscaldamento | Sito Essenziale |
| `estetica/` | PEACH CLUB · beauty bar | Lancio in Vista |
| `fiorista/` | DALIA · atelier floreale | Sito Professionale |

I quattro siti non si somigliano di proposito, e la differenza parte da come
si vende quel mestiere.

- **Imbianchino** — si vende con le fotografie: carta color calce,
  carattere Archivo, campionario di finiture, cursori prima/dopo.
- **Idraulico** — chi lo cerca ha una perdita in corso, non guarda le
  immagini: niente fotografie, testata scura, IBM Plex, cifre
  monospaziate, disegni tecnici, e due strade fin dalla prima schermata.
- **Centro estetico** — si vende a tempo e si svolge in penombra: fondo
  scuro caldo, Fraunces, fotografie d'ambiente, e il tempo scritto
  accanto a ogni voce.
- **Fiorista boutique** — vende composizioni sartoriali ed emozioni:
  rosa cipria, avorio, fotografia editoriale e richiesta personalizzata.

---

## Attenzione: sono attività inventate

Le imprese di questi siti **non esistono**. Non ci sono clienti reali, recensioni,
indirizzi, partite IVA o numeri di telefono di terzi. Ogni pagina lo dichiara in
cima e porta `noindex, nofollow`, così i motori di ricerca non le indicizzano.

I prezzi indicati sono **ordini di grandezza plausibili**, non listini: servono a
mostrare come funziona uno strumento di stima, non a fare concorrenza a nessuno.

---

## Come si costruiscono

Ogni cartella ha il proprio assemblatore e si costruisce da sola:

```bash
node imbianchino/costruisci.js     # → imbianchino/sito/
node idraulico/costruisci.js       # → idraulico/sito/
node estetica/costruisci.js        # → estetica/sito/
node fiorista/costruisci.js        # → fiorista/sito/
```

Il costruttore, alla fine, verifica che ogni riferimento locale delle
pagine — `src`, `href`, ogni voce di ogni `srcset` — punti a un file che
esiste davvero, e si ferma se ne manca uno. Un'immagine che dà 404 non
si vede nei log e in pagina lascia solo un riquadro rotto.

Le cartelle `sito/` sono **generate**: non si modificano a mano e non
stanno nel repository. Poi si serve la radice:

```bash
python3 -m http.server 4180
# → http://localhost:4180/imbianchino/sito/
# → http://localhost:4180/idraulico/sito/
# → http://localhost:4180/estetica/sito/
# → http://localhost:4180/fiorista/sito/
```

---

## Il sito dell'imbianchino

Cinque pagine: home, lavori, servizi, come lavoriamo, contatti.

```bash
npm install                              # solo la prima volta (serve per le immagini)
node imbianchino/strumenti/immagini.js   # dalle foto master genera AVIF e WebP
node imbianchino/costruisci.js           # assembla le pagine
```

### Dove si modifica cosa

| Percorso | Contenuto |
|---|---|
| `imbianchino/pagine/` | una pagina per file, HTML normale |
| `imbianchino/parti/` | testata, piede, pannello: scritti una volta sola |
| `imbianchino/stile.css` | tutto il foglio di stile |
| `imbianchino/sito.js` | cursore prima/dopo, menu, stima del prezzo |
| `imbianchino/master/` | le fotografie originali, ad alta risoluzione |
| `imbianchino/immagini/` | le versioni generate, quelle che il sito serve |

### Le pagine

Nei file di `pagine/` ci sono due sole aggiunte all'HTML normale:

```html
<!--@ titolo: Il titolo della pagina -->   dichiara un valore
<!--@parte testata-->                      inserisce parti/testata.html
{{titolo}}                                 usa un valore dichiarato
```

### I prezzi della stima

Stanno tutti in cima al blocco «stima indicativa» di `imbianchino/sito.js`:

```js
var PREZZI = {
  liscia: [7, 11],        // opaco lavabile, interni, al m²
  decorativa: [28, 48],   // finitura a mano, la sola parete d'accento
  facciata: [18, 30],     // esterni, ponteggio escluso
};
var MINIMO = 250;         // sotto, non conviene muoversi
```

### Le fotografie

`imbianchino/strumenti/immagini.js` legge `master/` e genera in `immagini/` le
misure che servono, in AVIF e WebP: più larghezze per ogni foto, un ritaglio
verticale del hero per il telefono, e un ritaglio centrale per i campioni di
finitura — senza, alla dimensione in cui compaiono la grana sparirebbe.
Rigenera solo ciò che manca o è più vecchio del master.

---

## Il sito dell'idraulico

Due pagine: la principale e **Prima che arrivi**, la guida da aprire
col telefono in mano mentre esce acqua. Le fotografie mostrano interventi,
attrezzi e ambienti domestici; il disegno della valvola resta un SVG scritto
dentro la pagina perché deve spiegare con precisione aperto e chiuso.

```bash
node idraulico/strumenti/immagini.js  # dalle foto master genera AVIF e WebP
node idraulico/costruisci.js
```

### Dove si modifica cosa

| Percorso | Contenuto |
|---|---|
| `idraulico/pagine/` | le due pagine |
| `idraulico/parti/` | testata, piede, verifica della zona, chiamata |
| `idraulico/stile.css` | tutto il foglio di stile |
| `idraulico/sito.js` | verifica della zona, orario, menu, pannello |
| `idraulico/master/` | fotografie originali da cui ricavare nuovi tagli |
| `idraulico/immagini/` | immagini leggere AVIF, WebP e JPEG di riserva |
| `idraulico/strumenti/immagini.js` | genera le versioni responsive |

### Le tariffe

Stanno nel testo di `idraulico/pagine/index.html`, nella sezione
`.tariffe`: 45 € l'uscita e la prima mezz'ora, 35 € all'ora dopo,
+50% la sera e nei festivi, materiali a parte.

### I comuni serviti

In cima a `idraulico/sito.js`, con i minuti di viaggio. Aggiungerne
uno è una riga:

```js
var ZONA = [
  ['Bovolone', 5], ['Salizzole', 10], ['Isola Rizza', 12],
  // …
];
```

La ricerca ignora accenti e maiuscole e accetta nomi scritti a metà.
L'elenco completo in fondo alla sezione è generato dallo stesso array,
quindi non può disallinearsi.

### L'insegna aperto/chiuso

`idraulico/sito.js` decide se l'attività è aperta confrontando l'ora
di **Europe/Rome** — non quella del dispositivo di chi guarda — con
`APRE` e `CHIUDE`.

---

## Il sito del centro estetico

Quattro pagine: home, trattamenti, prenota, il centro.

```bash
node estetica/strumenti/immagini.js   # dalle foto master genera AVIF e WebP
node estetica/costruisci.js
```

### Dove si modifica cosa

| Percorso | Contenuto |
|---|---|
| `estetica/pagine/` | le quattro pagine |
| `estetica/parti/` | testata, piede, compositore della richiesta |
| `estetica/stile.css` | tutto il foglio di stile |
| `estetica/sito.js` | listino, compositore, menu, pannello |
| `estetica/master/` | le otto fotografie originali di PEACH CLUB |

### Il listino

Sta in cima a `estetica/sito.js`, con durata in minuti e prezzo in euro.
Da lì nascono **sia** il compositore della richiesta **sia** il listino
della pagina Trattamenti, che così non possono disallinearsi — c'è un
controllo che verifica che mostrino le stesse voci.

```js
var LISTINO = [
  { id: 'nails', gruppo: 'Nails', voci: [
    ['Semipermanente color', 60, 30],
    // …
  ]},
];
var SEDUTA_LUNGA = 150;   // oltre, si consiglia di dividere in due volte
```

L'identificatore del gruppo sta nei dati e non si ricava dal nome: così
un link non può puntare a un'ancora che non esiste.

### Le fotografie

Sono chiare e ariose, il sito è scuro. Non vengono scurite con un filtro
— si rovinerebbe ciò che le rende belle. Nell'apertura è un velo sfumato
sul lato del testo a portarle dentro la pagina; nelle schede la luce
delle nature morte contro il fondo scuro le fa sembrare oggetti
illuminati in una stanza buia.

---

## Il sito della boutique floreale

Sei pagine: home, collezioni, matrimoni ed eventi, atelier, consegne
e richiesta personalizzata. La boutique **DALIA** è un'attività
dimostrativa ambientata nel centro storico di Verona.

```bash
node fiorista/strumenti/immagini.js   # genera AVIF, WebP e JPEG di riserva
node fiorista/costruisci.js
```

Le nove fotografie originali sono in `fiorista/master/`; le immagini
ottimizzate per il sito sono in `fiorista/immagini/`. Il configuratore
di `fiorista/sito.js` compone bouquet, palette, consegna ed extra e
mostra il prezzo indicativo prima di preparare il messaggio.

---

## Le anteprime del portfolio

`portfolio/master/` contiene le dieci immagini che il portfolio di Sito
in Vista usa per mostrare i progetti. Sono **tutte 1600×720**: solo così,
messe in fila, sembrano una serie invece di schermate raccattate.

```bash
# servono i tre siti costruiti e serviti sulla porta 4180
node portfolio/strumenti/anteprime.mjs
```

Lo strumento fa due cose diverse:

- **I tre dimostrativi li fotografa da solo.** Cambia il sito, si
  rigenera l'anteprima. Per A Piombo non fotografa l'apertura ma la
  sezione dei prezzi: l'apertura è tipografica e in miniatura
  sembrerebbe una pagina vuota.
- **I due siti reali sono online e da qui non sono raggiungibili** — la
  rete dell'ambiente blocca i domini esterni. I loro screenshot vanno
  messi a mano in `portfolio/grezzi/` e lo strumento li porta alla
  stessa misura, ritagliando dal basso: si perde qualche pixel in fondo,
  mai la parte alta della pagina.

| Progetto | Stato |
|---|---|
| FammiUnKilo | online, screenshot consegnati a mano |
| ZumBox | online, screenshot consegnati a mano |
| Mano di Fondo · A Piombo · PEACH CLUB | dimostrativi, fotografati dallo strumento |

---

## Controlli

Gli strumenti di verifica usano Playwright. Servono in sviluppo, non per
pubblicare. Coprono: assenza di scorrimento orizzontale e di elementi fuori
riquadro su sei larghezze, contrasto WCAG AA, contorni di messa a fuoco,
collegamenti interni che portano davvero da qualche parte, e comportamento
senza JavaScript.
