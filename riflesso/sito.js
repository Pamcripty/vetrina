(function(){
  'use strict';
  var state={auto:'Berlina',area:'Completo',cond:'Vissuta'};
  var sizes={Compatta:.92,Berlina:1,SUV:1.12,Sportiva:1.08};
  var conditions={'Curata':.92,'Vissuta':1,'Da recuperare':1.18};
  var paths={
    Interni:{name:'Reset interno',min:120,max:160,time:'3–5 ore'},
    Esterni:{name:'Lucidatura correttiva',min:240,max:310,time:'6–10 ore'},
    Completo:{name:'Riflesso completo',min:360,max:430,time:'1 giornata'},
    Protezione:{name:'Protezione ceramica',min:420,max:540,time:'1–2 giornate'}
  };
  function round10(n){return Math.round(n/10)*10}
  function render(){
    var el=document.querySelector('[data-diagnosis]');
    if(!el)return;
    var p=paths[state.area],mult=sizes[state.auto]*conditions[state.cond];
    var min=round10(p.min*mult),max=round10(p.max*mult);
    var name=document.querySelector('[data-result-name]'),time=document.querySelector('[data-result-time]'),price=document.querySelector('[data-result-price]');
    if(name)name.textContent=p.name;if(time)time.textContent=p.time;if(price)price.textContent='€'+min+'–'+max;
    el.querySelectorAll('.choice').forEach(function(btn){btn.classList.toggle('active',state[btn.dataset.group]===btn.dataset.value)});
    var wa=document.querySelector('[data-wa-diagnosis]');
    if(wa){
      var msg='Ciao Riflesso, ho fatto la diagnosi rapida.%0A%0AAuto: '+encodeURIComponent(state.auto)+'%0AIntervento: '+encodeURIComponent(state.area)+'%0ACondizione: '+encodeURIComponent(state.cond)+'%0AIndicazione: '+encodeURIComponent(p.name)+'%0AStima: €'+min+'–'+max+'.%0A%0AVorrei inviarvi le foto per una valutazione.';
      wa.href='https://wa.me/?text='+msg;
    }
  }
  document.querySelectorAll('.choice').forEach(function(btn){btn.addEventListener('click',function(){state[btn.dataset.group]=btn.dataset.value;render()})});
  render();
  document.querySelectorAll('.faq-button').forEach(function(btn){btn.addEventListener('click',function(){var item=btn.closest('.faq-item');var open=item.classList.contains('open');document.querySelectorAll('.faq-item').forEach(function(i){i.classList.remove('open')});if(!open)item.classList.add('open')})});
  document.querySelectorAll('[data-scroll]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');if(id&&id.charAt(0)==='#'){var t=document.querySelector(id);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}})});
})();
