#!/usr/bin/env node
/*
 * DALIA — ottimizzazione delle fotografie editoriali.
 * Ogni master produce AVIF e WebP responsivi; le immagini più ampie
 * hanno anche una riserva JPEG.
 */
import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MASTER = path.join(RADICE, 'master');
const USCITA = path.join(RADICE, 'immagini');
const PIANO = {
  'dalia-hero': { larghezze: [1500, 1100, 740], jpeg: true },
  'dalia-bouquet': { larghezze: [1200, 800, 520] },
  'dalia-petite': { larghezze: [1200, 800, 520] },
  'dalia-matrimonio': { larghezze: [1500, 1100, 740], jpeg: true },
  'dalia-eventi': { larghezze: [1200, 800, 520] },
  'dalia-atelier': { larghezze: [1200, 800, 520] },
  'dalia-consegna': { larghezze: [1200, 800, 520] },
  'dalia-vaso': { larghezze: [1200, 800, 520] },
  'dalia-dettaglio': { larghezze: [1200, 800, 520] },
};

async function aggiornato(destino, origine) {
  try {
    const esiti = await Promise.all([stat(destino), stat(origine)]);
    return esiti[0].mtimeMs >= esiti[1].mtimeMs;
  } catch {
    return false;
  }
}

async function genera() {
  await mkdir(USCITA, { recursive: true });
  const immagini = (await readdir(MASTER)).filter(function (file) {
    return /\.(jpe?g|png)$/i.test(file);
  });
  let create = 0;

  for (const file of immagini) {
    const nome = file.replace(/\.[^.]+$/, '');
    const piano = PIANO[nome];
    if (!piano) continue;
    const origine = path.join(MASTER, file);
    const meta = await sharp(origine).metadata();

    for (const larghezza of piano.larghezze) {
      if (larghezza > meta.width) continue;
      for (const formato of ['avif', 'webp']) {
        const destino = path.join(USCITA, nome + '-' + larghezza + '.' + formato);
        if (await aggiornato(destino, origine)) continue;
        const foto = sharp(origine).resize(larghezza);
        if (formato === 'avif') await foto.avif({ quality: 55, effort: 4 }).toFile(destino);
        else await foto.webp({ quality: 81 }).toFile(destino);
        create += 1;
      }
    }

    if (piano.jpeg) {
      const destino = path.join(USCITA, nome + '-1200.jpg');
      if (!(await aggiornato(destino, origine))) {
        await sharp(origine).resize(Math.min(1200, meta.width))
          .jpeg({ quality: 84, mozjpeg: true }).toFile(destino);
        create += 1;
      }
    }

    console.log('  ✓ ' + nome + '  (' + meta.width + '×' + meta.height + ')');
  }

  console.log('\n  ' + create + ' immagini ottimizzate generate.');
}

genera().catch(function (errore) {
  console.error(errore);
  process.exit(1);
});
