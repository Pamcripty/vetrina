#!/usr/bin/env node
/* Fotografie leggere per A Piombo: i master restano disponibili per
   cambiare un'inquadratura, mentre il sito serve AVIF/WebP responsive. */

import { createRequire } from 'node:module';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const RADICE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MASTER = path.join(RADICE, 'master');
const USCITA = path.join(RADICE, 'immagini');
const LARGHEZZE = [1200, 760, 420];

async function daAggiornare(destino, origine) {
  try {
    const [generata, originale] = await Promise.all([stat(destino), stat(origine)]);
    return generata.mtimeMs < originale.mtimeMs;
  } catch {
    return true;
  }
}

async function genera() {
  await mkdir(USCITA, { recursive: true });
  const fotografie = (await readdir(MASTER)).filter((file) => /\.(png|jpe?g)$/i.test(file));
  let peso = 0;
  let create = 0;

  for (const file of fotografie) {
    const nome = file.replace(/\.[^.]+$/, '');
    const origine = path.join(MASTER, file);
    const metadata = await sharp(origine).metadata();

    for (const larghezza of LARGHEZZE.filter((valore) => valore <= metadata.width)) {
      const formati = [
        ['avif', (immagine) => immagine.avif({ quality: 55, effort: 4 })],
        ['webp', (immagine) => immagine.webp({ quality: 78 })],
      ];

      for (const [estensione, comprimi] of formati) {
        const destino = path.join(USCITA, `${nome}-${larghezza}.${estensione}`);
        if (!(await daAggiornare(destino, origine))) continue;

        const risultato = await comprimi(sharp(origine).resize(larghezza)).toFile(destino);
        peso += risultato.size;
        create += 1;
      }
    }

    const riserva = path.join(USCITA, `${nome}-1200.jpg`);
    if (await daAggiornare(riserva, origine)) {
      const risultato = await sharp(origine)
        .resize(Math.min(1200, metadata.width))
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(riserva);
      peso += risultato.size;
      create += 1;
    }

    console.log(`  ✓ ${nome}  (${metadata.width}×${metadata.height})`);
  }

  console.log(`\n  ${create} immagini create, ${(peso / 1024).toFixed(0)} kB complessivi`);
}

genera().catch((errore) => {
  console.error(`\n  ✗ ${errore.message}\n`);
  process.exit(1);
});
