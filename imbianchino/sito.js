/* =================================================================
   Mano di Fondo — comportamenti di pagina.
   Nessuna libreria. Senza questo file il sito resta leggibile:
   le fotografie si vedono, i testi ci sono, i pulsanti rispondono.
   ================================================================= */
(function () {
  'use strict';

  /* --- cursore prima / dopo ------------------------------------
     Il controllo vero è un <input type="range">: da tastiera
     funziona con le frecce, da telefono con il dito, e i lettori
     di schermo lo annunciano correttamente.                     */
  document.querySelectorAll('[data-confronto]').forEach(function (blocco) {
    var cursore = blocco.querySelector('.confronto__cursore');
    if (!cursore) return;

    function aggiorna() {
      blocco.style.setProperty('--pos', cursore.value + '%');
    }
    cursore.addEventListener('input', aggiorna);
    aggiorna();

    /* un tocco secco a sinistra o a destra sposta il confronto,
       per chi non se la sente di trascinare */
    blocco.addEventListener('click', function (e) {
      if (e.target === cursore) return;
      var r = blocco.getBoundingClientRect();
      cursore.value = Math.round(((e.clientX - r.left) / r.width) * 100);
      aggiorna();
    });
  });

  /* --- pannello dimostrativo dei contatti ---------------------- */
  var pannello = document.getElementById('pannello');
  if (pannello) {
    document.querySelectorAll('[data-contatto]').forEach(function (tasto) {
      tasto.addEventListener('click', function () {
        if (typeof pannello.showModal === 'function') pannello.showModal();
        else pannello.setAttribute('open', '');
      });
    });
    /* cliccando fuori dal riquadro si chiude */
    pannello.addEventListener('click', function (e) {
      if (e.target === pannello) pannello.close();
    });
  }

  /* --- menu del telefono ---------------------------------------
     Ogni testata si collega al proprio menu, trovato per posizione e
     non per identificatore: il codice non presume che nella pagina
     ce ne sia una sola.                                          */
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
        chiudi();
        tasto.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 992) chiudi();
    });
  });

  /* --- stima indicativa ----------------------------------------
     Quattro domande, un ordine di grandezza. Non è un preventivo e
     il testo in pagina lo dice: serve a capire se si è nella stessa
     fascia prima di far perdere tempo a qualcuno.

     I prezzi sono al metro quadro di superficie tinteggiata, non di
     pavimento. Stanno tutti qui, in chiaro, così si cambiano in un
     posto solo.                                                  */
  var PREZZI = {
    liscia: [7, 11],        // opaco lavabile, interni
    decorativa: [28, 48],   // finitura a mano, la sola parete d'accento
    facciata: [18, 30],     // esterni, ponteggio escluso
  };
  var MINIMO = 250;         // sotto, non conviene muoversi

  var OPERE = {
    stanza: {
      etichetta: 'Quanti metri quadri di pavimento?',
      aiuto: 'Una camera da letto sta di solito fra 12 e 18 m², un soggiorno fra 20 e 30.',
      min: 8, max: 60, passo: 2, avvio: 20,
    },
    casa: {
      etichetta: 'Quanti metri quadri di pavimento?',
      aiuto: 'È la metratura di casa, quella che trovi sull\'atto o sull\'annuncio.',
      min: 40, max: 200, passo: 5, avvio: 90,
    },
    facciata: {
      etichetta: 'Quanti metri quadri di facciata?',
      aiuto: 'Larghezza per altezza, senza togliere finestre e porte: si conta così.',
      min: 20, max: 400, passo: 10, avvio: 120,
    },
  };

  document.querySelectorAll('[data-stima]').forEach(function (forma) {
    var esito = forma.closest('.stima').querySelector('[data-esito]');
    var cursore = forma.querySelector('.stima__cursore');
    var mostraMq = forma.querySelector('[data-mq]');
    var etichettaMisura = forma.querySelector('[data-etichetta-misura]');
    var aiutoMisura = forma.querySelector('[data-aiuto-misura]');
    var soloInterni = forma.querySelectorAll('[data-solo-interni]');
    var cifra = esito.querySelector('[data-cifra]');
    var dettaglio = esito.querySelector('[data-dettaglio]');
    var operaPrecedente = null;

    function scelto(nome) {
      var c = forma.querySelector('input[name="' + nome + '"]:checked');
      return c ? c.value : null;
    }

    function arrotonda(n) {
      return n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50;
    }

    function euro(n) {
      return arrotonda(n).toLocaleString('it-IT');
    }

    function calcola() {
      var opera = scelto('opera');
      var regole = OPERE[opera];

      /* cambiando opera cambia anche la scala della misura */
      if (opera !== operaPrecedente) {
        operaPrecedente = opera;
        cursore.min = regole.min;
        cursore.max = regole.max;
        cursore.step = regole.passo;
        cursore.value = regole.avvio;
        etichettaMisura.textContent = regole.etichetta;
        aiutoMisura.textContent = regole.aiuto;
        for (var i = 0; i < soloInterni.length; i++) {
          soloInterni[i].hidden = opera === 'facciata';
        }
      }

      var mq = Number(cursore.value);
      mostraMq.textContent = mq;

      var superficie, basso, alto, spiegazione;

      if (opera === 'facciata') {
        superficie = mq;
        basso = superficie * PREZZI.facciata[0];
        alto = superficie * PREZZI.facciata[1];
        spiegazione = 'circa ' + Math.round(superficie) + ' m² di facciata, ponteggio escluso';
      } else {
        /* pareti: il perimetro cresce con la radice della superficie,
           non in proporzione — 2,6 è il moltiplicatore che ne esce
           per stanze di altezza normale */
        superficie = mq * 2.6;
        if (scelto('soffitti') === 'si') superficie += mq;

        if (scelto('finitura') === 'decorativa') {
          /* una parete sola a finitura decorativa, il resto opaco */
          var accento = Math.min(14, superficie * 0.2);
          var resto = superficie - accento;
          basso = resto * PREZZI.liscia[0] + accento * PREZZI.decorativa[0];
          alto = resto * PREZZI.liscia[1] + accento * PREZZI.decorativa[1];
          spiegazione = 'circa ' + Math.round(superficie) + ' m² in tutto, di cui '
            + Math.round(accento) + ' m² di parete decorativa';
        } else {
          basso = superficie * PREZZI.liscia[0];
          alto = superficie * PREZZI.liscia[1];
          spiegazione = 'circa ' + Math.round(superficie) + ' m² di superficie da tinteggiare';
        }
      }

      var sottoIlMinimo = arrotonda(basso) < MINIMO;
      cifra.textContent = euro(Math.max(basso, MINIMO)) + ' – '
        + euro(Math.max(alto, MINIMO)) + ' €';
      dettaglio.textContent = sottoIlMinimo
        ? spiegazione + ' — per un lavoro così piccolo c\'è un minimo di uscita, '
          + 'e conviene raggrupparlo con altro'
        : spiegazione;
    }

    forma.addEventListener('input', calcola);
    forma.addEventListener('change', calcola);
    calcola();
  });

  /* --- testata e contatto fisso allo scorrimento ---------------- */
  var testata = document.querySelector('[data-testata]');
  var fisso = document.querySelector('[data-fisso]');
  var apertura = document.getElementById('apertura');
  var inAttesa = false;

  function allaScorsa() {
    var y = window.scrollY || 0;
    if (testata) {
      if (y > 8) testata.setAttribute('data-attaccata', '');
      else testata.removeAttribute('data-attaccata');
    }
    if (fisso) {
      var soglia = apertura ? apertura.offsetHeight * 0.7 : 400;
      if (y > soglia) fisso.setAttribute('data-visibile', '');
      else fisso.removeAttribute('data-visibile');
    }
  }

  function programma() {
    if (inAttesa) return;
    inAttesa = true;
    window.requestAnimationFrame(function () {
      inAttesa = false;
      allaScorsa();
    });
  }

  window.addEventListener('scroll', programma, { passive: true });
  window.addEventListener('resize', programma, { passive: true });
  allaScorsa();
})();
