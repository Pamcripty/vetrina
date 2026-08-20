#!/usr/bin/env node
/* =================================================================
   Le anteprime del portfolio di Sito in Vista.

   Cinque progetti, dieci immagini, tutte 1600×720: solo così nel
   portfolio sembrano una serie invece di schermate raccattate.

   I tre siti dimostrativi li fotografo da qui, quindi si rigenerano
   da soli quando cambiano. I due siti reali sono online e da questo
   ambiente non sono raggiungibili: i loro screenshot arrivano a mano
   e vengono solo portati alla stessa misura.

   Serve che i siti siano costruiti e serviti:
     node imbianchino/costruisci.js && node idraulico/costruisci.js && node estetica/costruisci.js
     python3 -m http.server 4180
   Poi:  node portfolio/strumenti/anteprime.mjs
   ================================================================= */

import { apriBrowser } from '/home/user/sito-in-vista/strumenti/browser.js';
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const FUORI = path.join(QUI, '..', 'master');
const GREZZI = path.join(QUI, '..', 'grezzi');   // gli screenshot consegnati a mano

const LARGHEZZA = 1600;
const ALTEZZA = 720;
const BASE = 'http://localhost:4180';

/* --- i tre dimostrativi, fotografati qui ------------------------
   Per ognuno la schermata che dice meglio di cosa si tratta, non
   per forza quella in cima: l'apertura di A Piombo è tipografica e
   in miniatura sembrerebbe una pagina vuota. */
const DIMOSTRATIVI = [
  ['mano-di-fondo-1', 'imbianchino/sito/index.html', null],
  ['mano-di-fondo-2', 'imbianchino/sito/lavori.html', null],
  ['a-piombo-1', 'idraulico/sito/index.html', '.costi'],
  ['a-piombo-2', 'idraulico/sito/index.html', null],
  ['ora-buona-1', 'estetica/sito/index.html', null],
  ['ora-buona-2', 'estetica/sito/trattamenti.html', null],
];

async function fotografa() {
  const b = await apriBrowser();
  for (const [nome, indirizzo, meta] of DIMOSTRATIVI) {
    const p = await b.newPage({
      viewport: { width: LARGHEZZA, height: ALTEZZA },
      deviceScaleFactor: 2,
    });
    await p.goto(`${BASE}/${indirizzo}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);

    if (meta) {
      /* La sezione va appena sotto la testata: lo scarto lo misuro,
         non lo indovino, altrimenti spunta mezza riga di quella prima. */
      await p.evaluate((sel) => {
        const e = document.querySelector(sel);
        const testata = document.querySelector('.testata');
        const scarto = testata ? testata.getBoundingClientRect().height : 0;
        window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - scarto - 4);
      }, meta);
      /* lo scorrimento è animato: aspetto che si fermi davvero */
      await p.evaluate(async () => {
        let ultimo = -1;
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));
          if (Math.round(window.scrollY) === ultimo) return;
          ultimo = Math.round(window.scrollY);
        }
      });
    }
    await p.waitForTimeout(400);

    const info = await sharp(await p.screenshot())
      .resize(LARGHEZZA, ALTEZZA, { fit: 'cover' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(path.join(FUORI, `${nome}.jpg`));
    console.log(`  ✓ ${nome.padEnd(20)} ${(info.size / 1024).toFixed(0)} kB`);
    await p.close();
  }
  await b.close();
}

/* --- i due siti reali, consegnati a mano ------------------------
   Ritaglio dall'alto: si perde qualche pixel in fondo, mai la parte
   alta della pagina, che è quella che si deve vedere. */
async function normalizza() {
  let presenti;
  try {
    presenti = (await readdir(GREZZI)).filter((f) => /\.(png|jpe?g)$/i.test(f));
  } catch {
    console.log('  · nessuno screenshot da normalizzare in portfolio/grezzi/');
    return;
  }

  for (const file of presenti) {
    const origine = path.join(GREZZI, file);
    const meta = await sharp(origine).metadata();
    const tagliato = Math.min(Math.round(meta.width / (LARGHEZZA / ALTEZZA)), meta.height);
    const nome = file.replace(/\.[^.]+$/, '') + '.jpg';
    const info = await sharp(origine)
      .extract({ left: 0, top: 0, width: meta.width, height: tagliato })
      .resize(LARGHEZZA, ALTEZZA, { fit: 'cover' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(path.join(FUORI, nome));
    console.log(`  ✓ ${nome.padEnd(20)} ${(info.size / 1024).toFixed(0)} kB  (da ${meta.width}×${meta.height})`);
  }
}

await mkdir(FUORI, { recursive: true });
console.log('\n  Siti dimostrativi');
await fotografa();
console.log('\n  Siti reali');
await normalizza();
console.log(`\n  Tutte le anteprime sono ${LARGHEZZA}×${ALTEZZA}.\n`);
