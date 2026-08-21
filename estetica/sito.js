/* =================================================================
   PEACH CLUB — comportamenti di pagina.
   Nessuna libreria. Senza questo file il sito resta leggibile: il
   listino completo è in pagina, il menu è aperto.
   ================================================================= */
(function () {
  'use strict';

  /* --- il listino ----------------------------------------------
     Un posto solo per durate e prezzi: da qui nascono sia il
     compositore della richiesta sia il listino della pagina
     Trattamenti, che così non possono disallinearsi.

     durata in minuti, prezzo in euro.                           */
  var LISTINO = [
    { id: 'nails', gruppo: 'Nails', voci: [
      ['Manicure express', 30, 22],
      ['Semipermanente color', 60, 30],
      ['Semipermanente rinforzato', 70, 35],
      ['Gel refill', 90, 45],
      ['Nail art', 15, 10],
      ['Pedicure color', 60, 38],
    ]},
    { id: 'brows-lashes', gruppo: 'Brows & lashes', voci: [
      ['Brow shape', 20, 15],
      ['Brow shape e tinta', 30, 22],
      ['Laminazione sopracciglia', 50, 50],
      ['Laminazione ciglia', 60, 55],
      ['Lash & brow combo', 90, 85],
    ]},
    { id: 'skin', gruppo: 'Skin glow', voci: [
      ['Pulizia viso smart', 50, 45],
      ['Glow facial', 55, 49],
      ['Hydra boost', 60, 55],
      ['Teen skin reset', 50, 42],
    ]},
    { id: 'smooth', gruppo: 'Smooth skin', voci: [
      ['Ceretta gambe complete', 40, 28],
      ['Ceretta inguine', 20, 15],
      ['Laser viso small', 15, 19],
      ['Laser ascelle', 20, 29],
      ['Laser inguine', 25, 39],
      ['Laser gambe', 45, 69],
    ]},
  ];

  /* oltre questo, in una seduta sola si sta scomodi */
  var SEDUTA_LUNGA = 150;

  function durata(minuti) {
    if (minuti < 60) return minuti + ' minuti';
    var ore = Math.floor(minuti / 60);
    var resto = minuti % 60;
    var testoOre = ore === 1 ? "un'ora" : ore + ' ore';
    if (!resto) return testoOre;
    if (resto === 30) return testoOre + ' e mezza';
    return testoOre + ' e ' + resto + ' minuti';
  }

  /* --- il compositore della richiesta -------------------------- */
  /* il compositore compare su più pagine: il codice non presume che
     in pagina ce ne sia uno solo */
  document.querySelectorAll('[data-compositore]').forEach(function (forma) {
    var sezione = forma.closest('.compositore');
    var contenitore = forma.querySelector('[data-trattamenti]');
    var esito = sezione.querySelector('[data-esito]');
    var vuoto = esito.querySelector('[data-vuoto]');
    var elenco = esito.querySelector('[data-elenco]');
    var totali = esito.querySelector('[data-totali]');
    var mostraTempo = esito.querySelector('[data-tempo]');
    var mostraPrezzo = esito.querySelector('[data-prezzo]');
    var avviso = esito.querySelector('[data-avviso]');
    var invia = esito.querySelector('[data-invia]');

    LISTINO.forEach(function (g) {
      var blocco = document.createElement('fieldset');
      blocco.className = 'scelte__gruppo';
      var titolo = document.createElement('legend');
      titolo.className = 'scelte__titolo';
      titolo.textContent = g.gruppo;
      blocco.appendChild(titolo);

      g.voci.forEach(function (v) {
        var riga = document.createElement('label');
        riga.className = 'scelta';
        riga.innerHTML =
          '<input type="checkbox" value="' + v[0] + '" ' +
          'data-minuti="' + v[1] + '" data-euro="' + v[2] + '">' +
          '<span class="scelta__nome">' + v[0] + '</span>' +
          '<span class="scelta__dati"><b>' + v[1] + '′</b> · ' + v[2] + ' €</span>';
        blocco.appendChild(riga);
      });
      contenitore.appendChild(blocco);
    });

    function aggiorna() {
      var scelti = [].slice.call(forma.querySelectorAll('input[type="checkbox"]:checked'));
      var minuti = 0;
      var euro = 0;

      elenco.innerHTML = '';
      scelti.forEach(function (c) {
        minuti += Number(c.dataset.minuti);
        euro += Number(c.dataset.euro);
        var li = document.createElement('li');
        li.innerHTML = '<span>' + c.value + '</span><span class="esito__riga-dati">' +
          c.dataset.minuti + '′ · ' + c.dataset.euro + ' €</span>';
        elenco.appendChild(li);
      });

      var niente = scelti.length === 0;
      vuoto.hidden = !niente;
      elenco.hidden = niente;
      totali.hidden = niente;
      invia.disabled = niente;

      if (niente) {
        avviso.hidden = true;
        return;
      }

      mostraTempo.textContent = durata(minuti);
      mostraPrezzo.textContent = euro + ' €';

      if (minuti > SEDUTA_LUNGA) {
        avviso.hidden = false;
        avviso.textContent = 'Il tuo beauty mix supera le due ore e mezza: ' +
          'potrebbe essere più comodo dividerlo in due appuntamenti. ' +
          'Nella richiesta resta comunque tutto segnato.';
      } else {
        avviso.hidden = true;
      }
    }

    forma.addEventListener('change', aggiorna);
    aggiorna();

    /* il messaggio che, in un sito vero, partirebbe già scritto */
    invia.addEventListener('click', function () {
      var scelti = [].slice.call(forma.querySelectorAll('input[type="checkbox"]:checked'));
      var momento = forma.querySelector('input[name="momento"]:checked');
      var minuti = scelti.reduce(function (s, c) { return s + Number(c.dataset.minuti); }, 0);
      var testo = 'Ciao PEACH CLUB! Vorrei prenotare: ' +
        scelti.map(function (c) { return c.value.toLowerCase(); }).join(', ') +
        '. Il tempo indicativo è ' + durata(minuti) + '. Preferirei ' +
        (momento ? momento.value : "quando c'è posto") + '.';
      apriPannello(testo);
    });
  });

  /* --- il listino in pagina, dallo stesso elenco ---------------- */
  var listino = document.querySelector('[data-listino]');
  if (listino) {
    LISTINO.forEach(function (g) {
      var sezione = document.createElement('section');
      sezione.className = 'gruppo';
      sezione.id = g.id;
      var righe = g.voci.map(function (v) {
        return '<li class="voce">' +
          '<span class="voce__nome">' + v[0] + '</span>' +
          '<span class="voce__durata">' + durata(v[1]) + '</span>' +
          '<span class="voce__prezzo">' + v[2] + ' €</span>' +
        '</li>';
      }).join('');
      sezione.innerHTML =
        '<h2 class="gruppo__nome">' + g.gruppo + '</h2>' +
        '<ul class="gruppo__voci">' + righe + '</ul>';
      listino.appendChild(sezione);
    });
  }

  /* --- pannello dimostrativo ------------------------------------ */
  var pannello = document.getElementById('pannello');
  var messaggio = pannello && pannello.querySelector('[data-messaggio]');

  function apriPannello(testo) {
    if (!pannello) return;
    if (messaggio) {
      messaggio.textContent = testo || '';
      messaggio.hidden = !testo;
    }
    if (typeof pannello.showModal === 'function') pannello.showModal();
    else pannello.setAttribute('open', '');
  }

  if (pannello) {
    document.querySelectorAll('[data-contatto]').forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault(); apriPannello(''); });
    });
    pannello.addEventListener('click', function (e) {
      if (e.target === pannello) pannello.close();
    });
  }

  /* --- menu del telefono ---------------------------------------- */
  document.querySelectorAll('[data-menu]').forEach(function (tasto) {
    var testata = tasto.closest('.testata');
    var menu = testata && testata.querySelector('.menu');
    if (!menu) return;
    function chiudi() {
      tasto.setAttribute('aria-expanded', 'false');
      menu.removeAttribute('data-aperto');
    }
    tasto.addEventListener('click', function () {
      var aperto = tasto.getAttribute('aria-expanded') === 'true';
      tasto.setAttribute('aria-expanded', String(!aperto));
      if (aperto) menu.removeAttribute('data-aperto');
      else menu.setAttribute('data-aperto', '');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) chiudi();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tasto.getAttribute('aria-expanded') === 'true') {
        chiudi(); tasto.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 992) chiudi();
    });
  });

  /* --- testata allo scorrimento --------------------------------- */
  var testata = document.querySelector('[data-testata]');
  var inAttesa = false;
  function allaScorsa() {
    if (!testata) return;
    if ((window.scrollY || 0) > 8) testata.setAttribute('data-attaccata', '');
    else testata.removeAttribute('data-attaccata');
  }
  function programma() {
    if (inAttesa) return;
    inAttesa = true;
    window.requestAnimationFrame(function () { inAttesa = false; allaScorsa(); });
  }
  window.addEventListener('scroll', programma, { passive: true });
  allaScorsa();
})();
