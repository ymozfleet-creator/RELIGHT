/* RELIGHT v3 — 読みやすさを妨げない最小限の動き（外部ライブラリなし） */
(function(){
  'use strict';
  var d = document;
  d.documentElement.classList.remove('no-js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ヘッダーの影 */
  var hd = d.querySelector('.hd');
  function onScroll(){ if(hd) hd.classList.toggle('scr', scrollY > 10); }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* スマホメニュー */
  var bg = d.querySelector('.burger'), nav = d.querySelector('.nav');
  function closeNav(){ nav.classList.remove('open'); bg.classList.remove('open'); bg.setAttribute('aria-expanded','false'); d.body.style.overflow=''; }
  if(bg && nav){
    bg.addEventListener('click', function(){
      var o = nav.classList.toggle('open'); bg.classList.toggle('open', o);
      bg.setAttribute('aria-expanded', o); d.body.style.overflow = o ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeNav); });
    addEventListener('keydown', function(e){ if(e.key === 'Escape') closeNav(); });
  }

  /* タイトル：1文字ずつ静かに表示（1回だけ） */
  var h1 = d.querySelector('.hero h1');
  if(h1){
    var i = 0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType === 3){
          var f = d.createDocumentFragment();
          Array.from(n.textContent).forEach(function(ch){
            if(/\s/.test(ch)) return;
            var s = d.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden','true');
            s.style.setProperty('--i', i++); s.textContent = ch; f.appendChild(s);
          });
          n.parentNode.replaceChild(f, n);
        } else if(n.nodeType === 1){ walk(n); }
      });
    })(h1);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ h1.classList.add('in'); }); });
  }

  /* スクロールで表示 */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.15, rootMargin:'0px 0px -5% 0px'});
  d.querySelectorAll('.rv, .steps-line').forEach(function(el){ io.observe(el); });

  /* 数字のカウントアップ（最後は必ず元の表記に戻す） */
  var co = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, orig = el.textContent, target = parseFloat(orig);
      if(reduce || isNaN(target)) return;
      var t0 = performance.now();
      (function step(now){
        var p = Math.min((now - t0) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if(p < 1) requestAnimationFrame(step); else el.textContent = orig;
      })(t0);
    });
  }, {threshold:.6});
  d.querySelectorAll('[data-count]').forEach(function(el){ co.observe(el); });

  /* メールアドレスのコピー */
  d.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click', function(){
      var t = b.dataset.copy, o = b.innerHTML;
      function done(){ b.textContent = 'コピーしました ✓'; setTimeout(function(){ b.innerHTML = o; }, 1800); }
      if(navigator.clipboard) navigator.clipboard.writeText(t).then(done, done); else done();
    });
  });
})();
