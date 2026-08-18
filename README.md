# Vetrina — siti dimostrativi per settore

Siti di esempio realizzati da **[Sito in Vista](https://pamcripty.github.io/sito-in-vista/)**
per mostrare, a chi fa un certo mestiere, che cosa può diventare il suo sito.

Ogni cartella è un sito **realmente autonomo**: proprio linguaggio visivo,
propri contenuti, propri file. Nessun modello riciclato fra un settore e l'altro.

| Cartella | Settore | Pacchetto |
|---|---|---|
| `imbianchino/` | Tinteggiature e decorazioni | Sito Professionale |
| *(da fare)* | Idraulico | Sito Essenziale |
| *(da fare)* | Centro estetico | Lancio in Vista |

---

## Attenzione: sono attività inventate

Le imprese di questi siti **non esistono**. Non ci sono clienti reali, recensioni,
indirizzi, partite IVA o numeri di telefono di terzi. Ogni pagina lo dichiara in
cima e porta `noindex, nofollow`, così i motori di ricerca non le indicizzano.

I prezzi indicati sono **ordini di grandezza plausibili**, non listini: servono a
mostrare come funziona uno strumento di stima, non a fare concorrenza a nessuno.

---

## Il sito dell'imbianchino

Cinque pagine: home, lavori, servizi, come lavoriamo, contatti.

```bash
npm install                          # solo la prima volta (serve per le immagini)
node imbianchino/strumenti/immagini.js   # dalle foto master genera AVIF e WebP
node imbianchino/costruisci.js           # assembla le pagine in imbianchino/sito/
```

Poi apri `imbianchino/sito/index.html`, o servi la cartella:

```bash
python3 -m http.server 4180
# → http://localhost:4180/imbianchino/sito/
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

`imbianchino/sito/` è **generato**: non si modifica a mano e non sta nel
repository. Si rifà con `node imbianchino/costruisci.js`.

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

## Controlli

Gli strumenti di verifica usano Playwright. Servono in sviluppo, non per
pubblicare. Coprono: assenza di scorrimento orizzontale e di elementi fuori
riquadro su sei larghezze, contrasto WCAG AA, contorni di messa a fuoco,
collegamenti interni che portano davvero da qualche parte, e comportamento
senza JavaScript.
