#!/usr/bin/env node
/*
 * DALIA — assemblatore autonomo del sito multipagina.
 * Ogni pagina usa parti condivise e dichiara titolo, descrizione e
 * navigazione corrente. Le risorse locali vengono verificate a fine build.
 */
import { readFile, readdir, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = path.dirname(fileURLToPath(import.meta.url));
const USCITA = path.join(RADICE, 'sito');

async function leggi(percorso) {
  return readFile(path.join(RADICE, percorso), 'utf8');
}

function metadati(testo) {
  const valori = {};
  const corpo = testo.replace(/<!--@ ([\w-]+): ([\s\S]*?) -->\n?/g, function (_, chiave, valore) {
    valori[chiave] = valore.trim();
    return '';
  });
  return { valori, corpo };
}

async function componi(testo, valori, profondita = 0) {
  if (profondita > 6) throw new Error('Parti condivise annidate troppo in profondità.');
  let risultato = testo;
  const parti = [...risultato.matchAll(/^([ \t]*)<!--@parte ([\w-]+)-->[ \t]*$/gm)];
  for (const parte of parti) {
    const intera = parte[0];
    const rientro = parte[1];
    const nome = parte[2];
    const contenuto = (await leggi(path.join('parti', nome + '.html')))
      .trimEnd()
      .split('\n')
      .map(function (riga) { return riga ? rientro + riga : riga; })
      .join('\n');
    risultato = risultato.replace(intera, contenuto);
  }
  if (parti.length) risultato = await componi(risultato, valori, profondita + 1);
  return risultato.replace(/\{\{([\w-]+)\}\}/g, function (_, chiave) {
    return valori[chiave] || '';
  });
}

async function costruisci() {
  await rm(USCITA, { recursive: true, force: true });
  await mkdir(USCITA, { recursive: true });

  const pagine = (await readdir(path.join(RADICE, 'pagine')))
    .filter(function (file) { return file.endsWith('.html'); });

  for (const file of pagine) {
    const pagina = metadati(await leggi(path.join('pagine', file)));
    const html = await componi(pagina.corpo, pagina.valori);
    const irrisolti = html.match(/\{\{[\w-]+\}\}|<!--@parte /g);
    if (irrisolti) throw new Error(file + ': parti o valori non risolti.');
    await writeFile(path.join(USCITA, file), html);
    console.log('  ✓ ' + file + '  ' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' kB');
  }

  for (const cartella of ['immagini', 'font']) {
    const origine = path.join(RADICE, cartella);
    if (existsSync(origine)) await cp(origine, path.join(USCITA, cartella), { recursive: true });
  }
  for (const file of ['stile.css', 'sito.js']) {
    await cp(path.join(RADICE, file), path.join(USCITA, file));
  }

  const mancanti = new Set();
  for (const pagina of pagine) {
    const html = await readFile(path.join(USCITA, pagina), 'utf8');
    for (const riferimento of html.matchAll(/(?:src|href)="([^"#:]+\.[a-z0-9]{2,5})"/g)) {
      if (!existsSync(path.join(USCITA, riferimento[1]))) {
        mancanti.add(pagina + ' → ' + riferimento[1]);
      }
    }
    for (const insieme of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const immagine of insieme[1].split(',')) {
        const percorso = immagine.trim().split(/\s+/)[0];
        if (percorso && !existsSync(path.join(USCITA, percorso))) {
          mancanti.add(pagina + ' → ' + percorso);
        }
      }
    }
  }

  if (mancanti.size) {
    throw new Error('Risorse locali mancanti:\n  ' + [...mancanti].join('\n  '));
  }
  console.log('\n  ' + pagine.length + ' pagine in fiorista/sito/');
}

costruisci().catch(function (errore) {
  console.error('\n  ✗ ' + errore.message + '\n');
  process.exit(1);
});
