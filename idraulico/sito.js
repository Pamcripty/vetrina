/* =================================================================
   A Piombo — comportamenti di pagina.
   Nessuna libreria. Senza questo file il sito resta usabile: i testi
   ci sono, l'elenco dei comuni si vede tutto, il menu è aperto.
   ================================================================= */
(function () {
  'use strict';

  /* --- la zona servita -----------------------------------------
     Minuti di viaggio da Bovolone in una giornata normale. Stanno
     qui, in chiaro: aggiungere un comune è una riga.            */
  var ZONA = [
    ['Bovolone', 5], ['Salizzole', 10], ['Isola Rizza', 12],
    ['Oppeano', 15], ['Concamarise', 12], ['Sanguinetto', 15],
    ['Cerea', 15], ['Nogara', 20], ['Legnago', 20],
    ['Roverchiara', 15], ['Angiari', 20], ['Casaleone', 20],
    ['Isola della Scala', 20], ['San Pietro di Morubio', 12],
    ['Minerbe', 25], ['Bonavigo', 18], ['Villa Bartolomea', 30],
  ];

  /* accenti e maiuscole non devono far fallire la ricerca */
  function piatto(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  }

  var forma = document.querySelector('[data-zona]');
  if (forma) {
    var campo = forma.querySelector('[data-comune]');
    var elenco = forma.querySelector('[data-elenco]');
    var esito = document.querySelector('[data-esito]');
    var stato = esito.querySelector('[data-stato]');
    var dettaglio = esito.querySelector('[data-dettaglio]');

    ZONA.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c[0];
      elenco.appendChild(o);
    });

    function cerca() {
      var scritto = piatto(campo.value);
      esito.removeAttribute('data-trovato');
      esito.removeAttribute('data-fuori');

      if (scritto.length < 3) {
        stato.textContent = 'Scrivi il nome del comune';
        dettaglio.textContent = 'Copro Bovolone e i comuni della Bassa Veronese.';
        return;
      }

      var trovato = null;
      for (var i = 0; i < ZONA.length; i++) {
        var nome = piatto(ZONA[i][0]);
        if (nome === scritto || nome.indexOf(scritto) === 0) { trovato = ZONA[i]; break; }
      }

      if (trovato) {
        esito.setAttribute('data-trovato', '');
        stato.textContent = 'Sì, ' + trovato[0] + ' è in zona.';
        dettaglio.textContent = 'Circa ' + trovato[1] + ' minuti di viaggio. Per un\'urgenza, di solito entro un\'ora da quando ci sentiamo.';
      } else {
        esito.setAttribute('data-fuori', '');
        stato.textContent = 'Non è fra i comuni che copro.';
        dettaglio.textContent = 'Per le urgenze arriverei tardi e non servirebbe. Per un lavoro programmato invece chiedi pure: si organizza.';
      }
    }

    campo.addEventListener('input', cerca);
    forma.addEventListener('submit', function (e) { e.preventDefault(); cerca(); });
    cerca();
  }

  /* l'elenco completo, che senza JavaScript è l'unica cosa che resta */
  var tutti = document.querySelector('[data-tutti]');
  if (tutti) {
    ZONA.slice().sort(function (a, b) { return a[0].localeCompare(b[0], 'it'); }).forEach(function (c) {
      var li = document.createElement('li');
      li.innerHTML = c[0] + ' <span class="zona__minuti">' + c[1] + '′</span>';
      tutti.appendChild(li);
    });
  }

  /* --- siamo aperti adesso? ------------------------------------
     Un idraulico che scrive «7–21» e non risponde alle 22 perde
     più credito di uno che dice chiaramente quando è chiuso.   */
  var APRE = 7;
  var CHIUDE = 21;

  /* L'ora è quella italiana, non quella del dispositivo: un'insegna
     aperto/chiuso che sbaglia perché il telefono è su un altro fuso
     è peggio di nessuna insegna. */
  function oraItaliana() {
    try {
      return Number(new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome', hour: 'numeric', hour12: false,
      }).format(new Date()));
    } catch (e) {
      return new Date().getHours();
    }
  }

  document.querySelectorAll('[data-orario]').forEach(function (e) {
    var ora = oraItaliana();
    var aperto = ora >= APRE && ora < CHIUDE;
    e.setAttribute('data-aperto', String(aperto));
    e.textContent = aperto
      ? 'Adesso rispondo — fino alle ' + CHIUDE
      : 'Adesso è chiuso — riapro alle ' + APRE;
  });

  /* --- il pannello dimostrativo -------------------------------- */
  var pannello = document.getElementById('pannello');
  if (pannello) {
    document.querySelectorAll('[data-chiamata]').forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof pannello.showModal === 'function') pannello.showModal();
        else pannello.setAttribute('open', '');
      });
    });
    pannello.addEventListener('click', function (e) {
      if (e.target === pannello) pannello.close();
    });
  }

  /* --- menu del telefono --------------------------------------- */
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

  /* --- testata e barra fissa allo scorrimento ------------------- */
  var testata = document.querySelector('[data-testata]');
  var fisso = document.querySelector('[data-fisso]');
  var inAttesa = false;

  function allaScorsa() {
    var y = window.scrollY || 0;
    if (testata) {
      if (y > 8) testata.setAttribute('data-attaccata', '');
      else testata.removeAttribute('data-attaccata');
    }
    if (fisso) {
      if (y > 260) fisso.setAttribute('data-visibile', '');
      else fisso.removeAttribute('data-visibile');
    }
  }
  function programma() {
    if (inAttesa) return;
    inAttesa = true;
    window.requestAnimationFrame(function () { inAttesa = false; allaScorsa(); });
  }
  window.addEventListener('scroll', programma, { passive: true });
  window.addEventListener('resize', programma, { passive: true });
  allaScorsa();
})();
