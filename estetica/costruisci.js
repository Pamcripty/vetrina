#!/usr/bin/env node
/* =================================================================
   Assembla le pagine del sito (estetica).

   Le pagine stanno in  pagine/*.html  e sono HTML normale, con due
   sole aggiunte:

     <!--@parte nome-->        inserisce parti/nome.html
     {{chiave}}                sostituisce un valore dichiarato in
                               testa alla pagina con <!--@ chiave: … -->

   Dentro le parti funzionano le stesse due cose, così la testata sa
   quale voce di menu è quella corrente.

   Uso:  node estetica/costruisci.js
   Esce in:  estetica/sito/
   ================================================================= */

import { readFile, readdir, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const FUORI = path.join(QUI, 'sito');

const leggi = (p) => readFile(path.join(QUI, p), 'utf8');

/* --- valori dichiarati in testa alla pagina --------------------- */
function estraiValori(testo) {
  const valori = {};
  const corpo = testo.replace(/<!--@ ([\w-]+): ([\s\S]*?) -->\n?/g, (t, k, v) => {
    valori[k] = v.trim();
    return '';
  });
  return { valori, corpo };
}

/* --- sostituzioni, applicate finché ce n'è ---------------------- */
async function risolvi(testo, valori, profondita = 0) {
  if (profondita > 6) throw new Error('parti annidate troppo in profondità');

  let uscita = testo;
  const parti = [...uscita.matchAll(/^([ \t]*)<!--@parte ([\w-]+)-->[ \t]*$/gm)];
  for (const p of parti) {
    const [tutto, rientro, nome] = p;
    let contenuto = await leggi(path.join('parti', `${nome}.html`));
    contenuto = contenuto.trimEnd().split('\n').map((r) => (r ? rientro + r : r)).join('\n');
    uscita = uscita.replace(tutto, contenuto);
  }
  if (parti.length) uscita = await risolvi(uscita, valori, profondita + 1);

  return uscita.replace(/\{\{([\w-]+)\}\}/g, (t, k) => valori[k] ?? '');
}

/* --- lavorazione ------------------------------------------------- */
async function costruisci() {
  await rm(FUORI, { recursive: true, force: true });
  await mkdir(FUORI, { recursive: true });

  const pagine = (await readdir(path.join(QUI, 'pagine'))).filter((f) => f.endsWith('.html'));
  for (const file of pagine) {
    const { valori, corpo } = estraiValori(await leggi(path.join('pagine', file)));
    const html = await risolvi(corpo, valori);
    const rimasti = html.match(/\{\{[\w-]+\}\}|<!--@parte /g);
    if (rimasti) throw new Error(`${file}: rimasti da risolvere → ${[...new Set(rimasti)].join(', ')}`);
    await writeFile(path.join(FUORI, file), html);
    console.log(`  ✓ ${file}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB`);
  }

  /* Copia le cartelle di risorse che esistono davvero: se un sito non
     ha immagini non è un errore, se le ha devono finire nell'uscita. */
  for (const cartella of ['immagini', 'font']) {
    const da = path.join(QUI, cartella);
    if (existsSync(da)) await cp(da, path.join(FUORI, cartella), { recursive: true });
  }
  for (const f of ['stile.css', 'sito.js']) {
    await cp(path.join(QUI, f), path.join(FUORI, f));
  }

  /* Ogni riferimento locale deve puntare a un file che esiste. Un 404
     su un'immagine non si vede nei log del costruttore e in pagina
     lascia solo un riquadro rotto: meglio fermarsi qui. */
  const mancanti = new Set();
  for (const file of pagine) {
    const html = await readFile(path.join(FUORI, file), 'utf8');
    for (const m of html.matchAll(/(?:src|href)="([^"#:]+\.[a-z0-9]{2,5})"/g)) {
      if (!existsSync(path.join(FUORI, m[1]))) mancanti.add(`${file} → ${m[1]}`);
    }
    for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const voce of m[1].split(',')) {
        const rel = voce.trim().split(/\s+/)[0];
        if (rel && !existsSync(path.join(FUORI, rel))) mancanti.add(`${file} → ${rel}`);
      }
    }
  }
  if (mancanti.size) {
    throw new Error('riferimenti a file che non esistono:\n     ' + [...mancanti].join('\n     '));
  }
  console.log(`\n  ${pagine.length} pagine in estetica/sito/`);
}

costruisci().catch((e) => {
  console.error('\n  ✗ ' + e.message + '\n');
  process.exit(1);
});
