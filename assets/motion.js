/* RELIGHT — Motion layer (2026-11)
   Kinetic Typography / UI-UX animation / Infographic animation
   依存ライブラリなし・prefers-reduced-motion 対応 */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- 1. Scroll progress bar ---------- */
  var bar = document.createElement('div');
  bar.className = 'mx-progress'; bar.setAttribute('aria-hidden','true');
  document.body.appendChild(bar);
  var ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--p', h > 0 ? Math.min(scrollY / h, 1) : 0);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- 2. Kinetic Typography ---------- */
  // 見出しを1文字ずつ分割し、マスクの下から立ち上げる
  function splitChars(el){
    var idx = 0;
    var label = el.textContent.replace(/\s+/g,' ').trim();
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType === 3){
          var frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(function(ch){
            if(/\s/.test(ch)){ frag.appendChild(document.createTextNode(ch)); return; }
            var w = document.createElement('span'); w.className = 'kt-w'; w.setAttribute('aria-hidden','true');
            var c = document.createElement('span'); c.className = 'kt-c'; c.style.setProperty('--i', idx++);
            c.textContent = ch; w.appendChild(c); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if(n.nodeType === 1 && n.tagName !== 'BR'){
          var cs = getComputedStyle(n);
          var clipped = (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text');
          if(clipped || n.tagName === 'svg'){
            // グラデーション文字は1ブロックとして動かす
            var w = document.createElement('span'); w.className = 'kt-w';
            n.parentNode.insertBefore(w, n); w.appendChild(n);
            n.classList.add('kt-c'); n.style.setProperty('--i', idx); idx += 3;
          } else { walk(n); }
        }
      });
    })(el);
    el.setAttribute('aria-label', label);
    el.classList.add('kt');
    // 長い見出しはテンポを上げる
    if(idx > 18) el.style.setProperty('--kt-step', Math.max(12, Math.round(500/idx)) + 'ms');
  }

  var ktTargets = document.querySelectorAll(
    '.hero h1, main h1, section h1, .shead h2, .sec h2, .msg-big, .mvv-content .big, .contact-card h2, .p-name'
  );
  var ktIO = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('kt-in'); ktIO.unobserve(e.target); } });
  },{threshold:.3, rootMargin:'0px 0px -6% 0px'}) : null;

  if(!reduce){
    ktTargets.forEach(function(el){
      if(el.closest('.mx-marquee') || el.dataset.ktSkip !== undefined) return;
      // 既存のフェードと二重にならないよう、見出し自体の rv は外す
      el.classList.remove('rv');
      // ヒーローの既存 keyframes は無効化して文字アニメに置き換え
      if(el.closest('.hero')) { el.style.animation = 'none'; el.style.setProperty('--kt-base','250ms'); }
      splitChars(el);
      if(ktIO) ktIO.observe(el); else el.classList.add('kt-in');
    });
  }

  /* ---------- 3. 数値カウントアップ（Infographic） ---------- */
  // 最初のテキストノードにある数値のみ動かし、最後は必ず元の文字列に戻す
  function countUp(el){
    var tn = null;
    for(var i=0;i<el.childNodes.length;i++){ if(el.childNodes[i].nodeType===3 && /\d/.test(el.childNodes[i].textContent)){ tn = el.childNodes[i]; break; } }
    if(!tn) return;
    var orig = tn.textContent;
    var m = orig.match(/^(\D*?)(\d+(?:\.\d+)?)([\s\S]*)$/);
    if(!m) return;
    var pre = m[1], numStr = m[2], post = m[3];
    var target = parseFloat(numStr), dec = (numStr.split('.')[1]||'').length;
    el.classList.add('mx-num');
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return; io.unobserve(el);
        if(reduce){ el.classList.add('mx-done'); return; }
        var t0 = performance.now(), dur = 1500;
        (function step(t){
          var p = Math.min((t - t0)/dur, 1), v = target * (1 - Math.pow(1 - p, 4));
          tn.textContent = pre + v.toFixed(dec) + post;
          if(p < 1) requestAnimationFrame(step); else { tn.textContent = orig; }
        })(t0);
        el.classList.add('mx-done');
      });
    },{threshold:.6});
    io.observe(el);
  }
  document.querySelectorAll('.stat .v, .stat .num:not([data-count]), .kpi .v').forEach(countUp);

  /* ---------- 4. UI/UX: カードのスポットライト ---------- */
  var cardSel = '.svc, .vcard, .stat, .kpi, .card, .theme, .plan, .tcard, .step, .flow-item, .price-card, .faq-item, .tl-row';
  document.querySelectorAll(cardSel).forEach(function(c){
    var pos = getComputedStyle(c).position;
    if(pos === 'absolute' || pos === 'fixed') return;
    c.classList.add('mx-spot');
    if(!finePointer) return;
    c.addEventListener('pointermove', function(e){
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- 5. UI/UX: マグネットボタン ---------- */
  document.querySelectorAll('.btn, .nav-cta, .mail-btn, .cta-btn, a[class*="btn"], button[class*="btn"]').forEach(function(b){
    if(b.classList.contains('burger')) return;
    b.classList.add('mx-mag');
    if(!finePointer || reduce) return;
    b.addEventListener('pointermove', function(e){
      var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width/2) * .18, y = (e.clientY - r.top - r.height/2) * .28;
      b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
    b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
  });

  /* ---------- 6. Hero のアンビエント光 ---------- */
  var hero = document.querySelector('.hero');
  if(hero && !reduce){
    ['a','b'].forEach(function(k){ var o = document.createElement('span'); o.className = 'mx-orb ' + k; o.setAttribute('aria-hidden','true'); hero.appendChild(o); });
  }
})();
