#!/usr/bin/env node
/* =================================================================
   Da ogni immagine master genera le versioni che il sito serve
   davvero: più larghezze, AVIF e WebP, e per il hero un ritaglio
   verticale pensato per il telefono.

   Le immagini master stanno in  estetica/master/
   Le versioni generate finiscono in  estetica/immagini/

   Rigenera solo ciò che manca o è più vecchio del master:
   rilanciarlo quando nulla è cambiato non costa nulla.

   Uso:  node estetica/strumenti/immagini.js
   ================================================================= */

import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.join(QUI, '..');
const MASTER = path.join(RADICE, 'master');
const FUORI = path.join(RADICE, 'immagini');

/* --- che cosa generare da ogni master --------------------------- */
const PIANO = {
  /* L'apertura e l'ambiente: a tutta larghezza, quindi servono le
     misure grandi. Un ritaglio verticale per il telefono, perché in
     16:9 su uno schermo stretto non si vedrebbe più la stanza. */
  'hero-cabina': {
    larghezze: [2400, 1800, 1200, 900],
    verticale: { rapporto: 4 / 5, larghezze: [1080, 810, 640] },
  },
  'il-centro': { larghezze: [2400, 1800, 1200, 900] },

  /* Le nature morte stanno dentro schede larghe al massimo 560 px. */
  'gruppo-viso': { larghezze: [1200, 800, 560], senzaRiserva: true },
  'gruppo-corpo': { larghezze: [1200, 800, 560], senzaRiserva: true },
  'gruppo-epilazione': { larghezze: [1200, 800, 560], senzaRiserva: true },
  'gruppo-mani-piedi': { larghezze: [1200, 800, 560], senzaRiserva: true },
};

const FORMATI = [
  ['avif', (s) => s.avif({ quality: 55, effort: 4 })],
  ['webp', (s) => s.webp({ quality: 80 })],
];

/* --- serve rigenerare? ------------------------------------------ */
async function piuVecchio(destino, origine) {
  try {
    const [d, o] = await Promise.all([stat(destino), stat(origine)]);
    return d.mtimeMs < o.mtimeMs;
  } catch {
    return true; // non esiste ancora
  }
}

async function scrivi(destino, origine, costruisci) {
  if (!(await piuVecchio(destino, origine))) return null;
  const info = await costruisci().toFile(destino);
  return info.size;
}

/* --- lavorazione ------------------------------------------------- */
async function lavora() {
  await mkdir(FUORI, { recursive: true });
  const presenti = (await readdir(MASTER)).filter((f) => /\.(jpe?g|png)$/i.test(f));

  let nuovi = 0;
  let peso = 0;

  for (const file of presenti) {
    const nome = file.replace(/\.[^.]+$/, '');
    const piano = PIANO[nome];
    if (!piano) {
      console.log(`  · ${file} — nessun piano, ignorato`);
      continue;
    }

    const origine = path.join(MASTER, file);
    const meta = await sharp(origine).metadata();

    /* un eventuale ritaglio centrale, applicato prima di ogni misura */
    const centro = piano.ritaglio
      ? {
          width: Math.round(meta.width * piano.ritaglio),
          height: Math.round(meta.height * piano.ritaglio),
          left: Math.round((meta.width * (1 - piano.ritaglio)) / 2),
          top: Math.round((meta.height * (1 - piano.ritaglio)) / 2),
        }
      : null;
    const partenza = () => (centro ? sharp(origine).extract(centro) : sharp(origine));
    const larghezzaMax = centro ? centro.width : meta.width;

    /* versioni orizzontali, nel formato originale */
    for (const larghezza of piano.larghezze) {
      if (larghezza > larghezzaMax) continue;
      for (const [estensione, comprimi] of FORMATI) {
        const destino = path.join(FUORI, `${nome}-${larghezza}.${estensione}`);
        const b = await scrivi(destino, origine, () =>
          comprimi(partenza().resize(larghezza))
        );
        if (b) { nuovi += 1; peso += b; }
      }
    }

    /* una versione JPEG di riserva, per i browser molto vecchi */
    if (!piano.senzaRiserva) {
      const destino = path.join(FUORI, `${nome}-1200.jpg`);
      const b = await scrivi(destino, origine, () =>
        sharp(origine).resize(Math.min(1200, meta.width)).jpeg({ quality: 82, mozjpeg: true })
      );
      if (b) { nuovi += 1; peso += b; }
    }

    /* ritaglio verticale per il telefono */
    if (piano.verticale) {
      const altezza = meta.height;
      const larghezzaRitaglio = Math.round(altezza * piano.verticale.rapporto);
      const sinistra = Math.round((meta.width - larghezzaRitaglio) / 2);

      for (const larghezza of piano.verticale.larghezze) {
        for (const [estensione, comprimi] of FORMATI) {
          const destino = path.join(FUORI, `${nome}-alto-${larghezza}.${estensione}`);
          const b = await scrivi(destino, origine, () =>
            comprimi(
              sharp(origine)
                .extract({ left: sinistra, top: 0, width: larghezzaRitaglio, height: altezza })
                .resize(larghezza)
            )
          );
          if (b) { nuovi += 1; peso += b; }
        }
      }
    }

    console.log(`  ✓ ${nome}  (${meta.width}×${meta.height})`);
  }

  console.log(
    nuovi
      ? `\n  ${nuovi} file generati, ${(peso / 1024 / 1024).toFixed(2)} MB in totale.`
      : '\n  Tutto già aggiornato.'
  );
}

lavora().catch((e) => {
  console.error(e);
  process.exit(1);
});
