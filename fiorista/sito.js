/*
 * DALIA — interazioni leggere e autonome.
 * Il sito resta leggibile anche senza JavaScript; il configuratore
 * serve soltanto a mostrare come nascerebbe una richiesta reale.
 */
(function () {
  'use strict';

  var euro = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

  function dataItaliana(valore) {
    if (!valore) return '';
    var parti = valore.split('-');
    if (parti.length !== 3) return valore;
    return parti[2] + '/' + parti[1] + '/' + parti[0];
  }

  var pannello = document.getElementById('pannello');
  var testoPannello = pannello && pannello.querySelector('[data-messaggio]');

  function mostraPannello(messaggio) {
    if (!pannello) return;
    if (testoPannello) {
      testoPannello.textContent = messaggio || '';
      testoPannello.hidden = !messaggio;
    }
    if (typeof pannello.showModal === 'function') pannello.showModal();
    else pannello.setAttribute('open', '');
  }

  if (pannello) {
    pannello.addEventListener('click', function (evento) {
      if (evento.target === pannello && typeof pannello.close === 'function') {
        pannello.close();
      }
    });
    document.querySelectorAll('[data-contatto]').forEach(function (collegamento) {
      collegamento.addEventListener('click', function (evento) {
        evento.preventDefault();
        mostraPannello('');
      });
    });
  }

  var forma = document.querySelector('[data-compositore]');
  if (forma) {
    var nomeRiepilogo = document.querySelector('[data-riepilogo-nome]');
    var paletteRiepilogo = document.querySelector('[data-riepilogo-palette]');
    var vociRiepilogo = document.querySelector('[data-riepilogo-voci]');
    var totaleRiepilogo = document.querySelector('[data-totale]');
    var tastoInvia = document.querySelector('[data-invia]');
    var selezioneMisura = [].slice.call(forma.querySelectorAll('input[name="misura"]'));
    var parametri = new URLSearchParams(window.location.search);
    var misuraRichiesta = parametri.get('misura');
    var occasioneRichiesta = parametri.get('occasione');

    if (misuraRichiesta) {
      selezioneMisura.forEach(function (scelta) {
        if (scelta.dataset.id === misuraRichiesta) scelta.checked = true;
      });
    }

    if (occasioneRichiesta === 'matrimonio') {
      forma.elements.occasione.value = 'un matrimonio o evento';
    }

    function aggiungiRiga(titolo, valore) {
      if (!vociRiepilogo) return;
      var riga = document.createElement('div');
      var nome = document.createElement('dt');
      var prezzo = document.createElement('dd');
      nome.textContent = titolo;
      prezzo.textContent = valore;
      riga.appendChild(nome);
      riga.appendChild(prezzo);
      vociRiepilogo.appendChild(riga);
    }

    function statoAttuale() {
      var misura = forma.querySelector('input[name="misura"]:checked');
      var palette = forma.querySelector('input[name="palette"]:checked');
      var consegna = forma.elements.consegna;
      var opzioneConsegna = consegna.options[consegna.selectedIndex];
      var extra = [].slice.call(forma.querySelectorAll('input[name="extra"]:checked'));
      var prezzoMisura = Number(misura.dataset.prezzo || 0);
      var prezzoConsegna = Number(opzioneConsegna.dataset.prezzo || 0);
      var prezzoExtra = extra.reduce(function (somma, voce) {
        return somma + Number(voce.dataset.prezzo || 0);
      }, 0);

      return {
        misura: misura,
        palette: palette,
        consegna: consegna,
        extra: extra,
        prezzoMisura: prezzoMisura,
        prezzoConsegna: prezzoConsegna,
        prezzoExtra: prezzoExtra,
        totale: prezzoMisura + prezzoConsegna + prezzoExtra,
      };
    }

    function aggiorna() {
      var stato = statoAttuale();
      if (nomeRiepilogo) nomeRiepilogo.textContent = stato.misura.value;
      if (paletteRiepilogo) {
        var testoPalette = stato.palette.value;
        paletteRiepilogo.textContent =
          testoPalette.charAt(0).toUpperCase() + testoPalette.slice(1);
      }
      if (vociRiepilogo) vociRiepilogo.innerHTML = '';
      aggiungiRiga('Composizione', euro.format(stato.prezzoMisura));
      aggiungiRiga(
        stato.prezzoConsegna ? 'Consegna' : 'Ritiro in atelier',
        stato.prezzoConsegna ? euro.format(stato.prezzoConsegna) : 'Incluso'
      );
      stato.extra.forEach(function (voce) {
        aggiungiRiga(voce.value, euro.format(Number(voce.dataset.prezzo)));
      });
      if (totaleRiepilogo) totaleRiepilogo.textContent = euro.format(stato.totale);
    }

    forma.addEventListener('change', aggiorna);
    aggiorna();

    if (tastoInvia) {
      tastoInvia.addEventListener('click', function () {
        var stato = statoAttuale();
        var data = dataItaliana(forma.elements.data.value);
        var nota = forma.elements.messaggio.value.trim();
        var testo = 'Ciao DALIA! Vorrei un bouquet ' + stato.misura.value +
          ' per ' + forma.elements.occasione.value + ', nella palette ' +
          stato.palette.value + '. Preferisco ' + stato.consegna.value;

        if (data) testo += ' per il ' + data;
        if (stato.extra.length) {
          testo += '. Vorrei aggiungere ' + stato.extra.map(function (voce) {
            return voce.value;
          }).join(' e ');
        }
        if (nota) testo += '. Nota: ' + nota;
        testo += '. Totale indicativo: ' + euro.format(stato.totale) + '.';
        mostraPannello(testo);
      });
    }
  }

  document.querySelectorAll('[data-menu]').forEach(function (tasto) {
    var testata = tasto.closest('.testata');
    var navigazione = testata && testata.querySelector('.navigazione');
    if (!navigazione) return;

    function chiudi() {
      tasto.setAttribute('aria-expanded', 'false');
      navigazione.removeAttribute('data-aperta');
    }

    tasto.addEventListener('click', function () {
      var aperta = tasto.getAttribute('aria-expanded') === 'true';
      tasto.setAttribute('aria-expanded', String(!aperta));
      if (aperta) navigazione.removeAttribute('data-aperta');
      else navigazione.setAttribute('data-aperta', '');
    });

    navigazione.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) chiudi();
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && tasto.getAttribute('aria-expanded') === 'true') {
        chiudi();
        tasto.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 992) chiudi();
    });
  });

  var testata = document.querySelector('[data-testata]');
  var fotogramma = false;

  function aggiornaTestata() {
    if (!testata) return;
    if ((window.scrollY || 0) > 8) testata.setAttribute('data-attaccata', '');
    else testata.removeAttribute('data-attaccata');
  }

  window.addEventListener('scroll', function () {
    if (fotogramma) return;
    fotogramma = true;
    window.requestAnimationFrame(function () {
      fotogramma = false;
      aggiornaTestata();
    });
  }, { passive: true });

  aggiornaTestata();
})();
