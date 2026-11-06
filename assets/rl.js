/* RELIGHT Design System v2 — interactions
   WebGL shader hero / Lenis smooth scroll / GSAP ScrollTrigger
   ライブラリが読めない環境でも内容は必ず表示される設計 */
(function(){
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if(hasGsap && !reduce) root.classList.add('js');

  /* ---------- Header ---------- */
  var hd = d.querySelector('.hd'), lastY = 0;
  function hdState(y){
    if(!hd) return;
    hd.classList.toggle('scr', y > 30);
    hd.classList.toggle('hide', y > 500 && y > lastY && !d.querySelector('.nav.open'));
    lastY = y;
  }
  var prog = d.querySelector('.prog');
  function onScroll(){
    var y = window.scrollY; hdState(y);
    if(prog){ var h = root.scrollHeight - innerHeight; prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')'; }
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  var bg = d.querySelector('.burger'), nav = d.querySelector('.nav');
  if(bg && nav){
    bg.addEventListener('click', function(){
      var o = nav.classList.toggle('open'); bg.classList.toggle('open', o);
      bg.setAttribute('aria-expanded', o); d.body.style.overflow = o ? 'hidden' : '';
      if(window.__lenis) o ? window.__lenis.stop() : window.__lenis.start();
    });
    nav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){
      nav.classList.remove('open'); bg.classList.remove('open'); d.body.style.overflow = '';
      if(window.__lenis) window.__lenis.start();
    }); });
  }

  /* ---------- Copy email ---------- */
  d.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click', function(){
      var t = b.dataset.copy, o = b.innerHTML;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(function(){
        var ta = d.createElement('textarea'); ta.value = t; d.body.appendChild(ta); ta.select();
        try{ d.execCommand('copy'); }catch(e){} ta.remove();
      });
      b.textContent = 'コピーしました ✓'; b.classList.add('copy-ok');
      setTimeout(function(){ b.innerHTML = o; b.classList.remove('copy-ok'); }, 1800);
    });
  });

  /* ---------- Spotlight cells ---------- */
  if(fine){
    d.querySelectorAll('.cell').forEach(function(c){
      c.addEventListener('pointermove', function(e){
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    /* magnetic buttons */
    d.querySelectorAll('.btn, .nav .cta').forEach(function(b){
      b.addEventListener('pointermove', function(e){
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width/2) * .2).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height/2) * .3).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
    });
  }

  /* ---------- WebGL aurora shader ---------- */
  (function(){
    var cv = d.getElementById('gl'); if(!cv) return;
    var gl = cv.getContext('webgl', {antialias:false, alpha:true, premultipliedAlpha:false});
    if(!gl) return;
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;',
      'uniform vec2 r;uniform float t;uniform vec2 m;uniform float s;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);',
      ' float T=t*.06;',
      ' vec2 q=vec2(fbm(p*1.4+T),fbm(p*1.4-T+3.1));',
      ' vec2 w=vec2(fbm(p*1.2+q*1.8+vec2(1.7,9.2)+T*1.3),fbm(p*1.2+q*1.8+vec2(8.3,2.8)-T));',
      ' float f=fbm(p*1.1+w*2.2);',
      ' vec2 mm=(m-.5)*vec2(r.x/min(r.x,r.y),r.y/min(r.x,r.y));',
      ' float glow=exp(-3.2*length(p-mm*vec2(1.,-1.)));',
      ' vec3 c1=vec3(.486,.612,1.);vec3 c2=vec3(.616,.482,1.);vec3 c3=vec3(.243,.878,.941);vec3 bg=vec3(.02,.027,.059);',
      ' vec3 col=mix(bg,c1,smoothstep(.35,.95,f)*.85);',
      ' col=mix(col,c2,smoothstep(.45,1.,w.x)*.55);',
      ' col=mix(col,c3,smoothstep(.62,1.,q.y*f*1.6)*.45);',
      ' col+=glow*.18*c1;',
      ' float vig=smoothstep(1.25,.15,length(p*vec2(.85,1.15)));',
      ' col=mix(bg,col,vig*.95);',
      ' col*=1.-s*.65;',
      ' float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);col+=(g-.5)*.025;',
      ' gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');
    function sh(type, src){ var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr,'r'), uT = gl.getUniformLocation(pr,'t'), uM = gl.getUniformLocation(pr,'m'), uS = gl.getUniformLocation(pr,'s');
    var dpr = Math.min(window.devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.5) * .75;
    var mx = .5, my = .45, tx = .5, ty = .45, visible = true, t0 = performance.now();
    function size(){ cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; gl.viewport(0,0,cv.width,cv.height); }
    size(); addEventListener('resize', size);
    if(fine) addEventListener('pointermove', function(e){ tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; }, {passive:true});
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) loop(); }).observe(cv);
    var running = false;
    function frame(now){
      mx += (tx - mx) * .04; my += (ty - my) * .04;
      var sc = Math.min(window.scrollY / innerHeight, 1);
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, reduce ? 20 : (now - t0) / 1000 + 20);
      gl.uniform2f(uM, mx, my); gl.uniform1f(uS, sc);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop(){
      if(running) return; running = true;
      (function tick(now){ if(!visible || reduce){ running = false; if(reduce) frame(performance.now()); return; } frame(now); requestAnimationFrame(tick); })(performance.now());
    }
    loop();
    cv.style.opacity = 0; cv.style.transition = 'opacity 1.6s ease'; requestAnimationFrame(function(){ cv.style.opacity = 1; });
  })();

  /* ---------- Count (数値は最後に必ず元の表記へ戻す) ---------- */
  function countEl(el, dur){
    var orig = el.textContent, m = orig.match(/^(\D*?)(\d+(?:\.\d+)?)([\s\S]*)$/);
    if(!m) return;
    var target = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, t0 = performance.now();
    (function step(now){
      var p = Math.min((now - t0) / dur, 1), v = target * (1 - Math.pow(1 - p, 4));
      el.textContent = m[1] + v.toFixed(dec) + m[3];
      if(p < 1) requestAnimationFrame(step); else el.textContent = orig;
    })(t0);
  }

  /* ---------- Statement: wrap chars ---------- */
  d.querySelectorAll('.stmt').forEach(function(el){
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType === 3){
          var f = d.createDocumentFragment();
          Array.from(n.textContent).forEach(function(ch){
            if(/\s/.test(ch)){ f.appendChild(d.createTextNode(ch)); return; }
            var s = d.createElement('span'); s.className = 'w'; s.textContent = ch; f.appendChild(s);
          });
          n.parentNode.replaceChild(f, n);
        } else if(n.nodeType === 1 && n.tagName !== 'BR'){ walk(n); }
      });
    })(el);
  });

  if(!hasGsap || reduce){
    d.querySelectorAll('[data-count]').forEach(function(e){});
    d.querySelectorAll('.ring .fg').forEach(function(c){ c.style.strokeDashoffset = c.dataset.off; });
    return;
  }

  /* ================= GSAP ================= */
  var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
  var ST = window.ScrollTrigger;

  /* Lenis smooth scroll */
  if(window.Lenis && fine){
    var lenis = new window.Lenis({lerp:.09, smoothWheel:true});
    window.__lenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    d.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        var id = a.getAttribute('href'); if(id.length < 2) return;
        var tg = d.querySelector(id); if(!tg) return;
        e.preventDefault(); lenis.scrollTo(tg, {offset:-20, duration:1.4});
      });
    });
  }

  /* Hero: kinetic typography */
  var h1 = d.querySelector('.hero h1');
  if(h1){
    h1.querySelectorAll('.ln').forEach(function(ln){
      var inner = ln.innerHTML, tmp = d.createElement('div'); tmp.innerHTML = inner; ln.innerHTML = '';
      Array.prototype.slice.call(tmp.childNodes).forEach(function(n){
        if(n.nodeType === 3){
          Array.from(n.textContent).forEach(function(ch){ var s = d.createElement('span'); s.className = 'ch'; s.textContent = ch; ln.appendChild(s); });
        } else { n.classList.add('ch'); ln.appendChild(n); }
      });
    });
    var tl = gsap.timeline({delay:.15});
    tl.from('.hero .tag', {y:20, opacity:0, duration:.9, ease:'expo.out'})
      .from('.hero h1 .ch', {yPercent:110, rotate:6, opacity:0, duration:1.2, stagger:.035, ease:'expo.out'}, '-=.6')
      .from('.hero-sub', {y:24, opacity:0, duration:1, ease:'expo.out'}, '-=.8')
      .from('.hero-act > *', {y:24, opacity:0, duration:1, stagger:.08, ease:'expo.out'}, '-=.8')
      .from('.hero-meta', {opacity:0, duration:1}, '-=.6');
    /* scroll: 見出しが奥に引いていく */
    gsap.to('.hero-in', {yPercent:-18, opacity:.0, scale:.96, ease:'none',
      scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}});
  }

  /* Generic reveal */
  gsap.utils.toArray('.rv').forEach(function(el){
    gsap.to(el, {opacity:1, y:0, duration:1.2, ease:'expo.out', delay:(+el.dataset.d || 0),
      scrollTrigger:{trigger:el, start:'top 88%', once:true}});
  });

  /* Section titles: line mask rise */
  gsap.utils.toArray('.h-sec').forEach(function(el){
    gsap.from(el, {yPercent:40, opacity:0, clipPath:'inset(0 0 100% 0)', duration:1.3, ease:'expo.out',
      scrollTrigger:{trigger:el, start:'top 88%', once:true}});
  });

  /* Bento infographics */
  d.querySelectorAll('[data-count]').forEach(function(el){
    ST.create({trigger:el, start:'top 85%', once:true, onEnter:function(){ countEl(el, 1600); }});
  });
  d.querySelectorAll('.ring .fg').forEach(function(c){
    gsap.fromTo(c, {strokeDashoffset:c.dataset.len}, {strokeDashoffset:c.dataset.off, duration:1.8, ease:'expo.out',
      scrollTrigger:{trigger:c.closest('.cell'), start:'top 80%', once:true}});
  });
  d.querySelectorAll('.bars').forEach(function(b){
    gsap.from(b.children, {scaleY:0, duration:1.2, stagger:.12, ease:'expo.out',
      scrollTrigger:{trigger:b, start:'top 88%', once:true}});
  });
  gsap.utils.toArray('.bento .cell').forEach(function(c, i){
    gsap.from(c, {y:60, opacity:0, duration:1.2, ease:'expo.out', delay:(i % 3) * .08,
      scrollTrigger:{trigger:c, start:'top 92%', once:true}});
  });

  /* Services: sticky stack — 奥のカードが縮んで暗くなる */
  var cards = gsap.utils.toArray('.svc');
  if(innerWidth > 860){
    cards.forEach(function(c, i){
      if(i === cards.length - 1) return;
      gsap.to(c, {scale:.96, filter:'brightness(.75)', ease:'none',
        scrollTrigger:{trigger:cards[i+1], start:'top 55%', end:'top 140px', scrub:true}});
    });
  }

  /* Process: pinned horizontal scroll */
  var mmq = gsap.matchMedia();
  mmq.add('(min-width: 861px)', function(){
    var track = d.querySelector('.proc-track'); if(!track) return;
    var dist = function(){ return track.scrollWidth - innerWidth; };
    var tw = gsap.to(track, {x:function(){ return -dist(); }, ease:'none',
      scrollTrigger:{trigger:'.proc-pin', start:'top top', end:function(){ return '+=' + dist(); }, pin:true, scrub:1, invalidateOnRefresh:true}});
    gsap.to('.proc-bar i', {scaleX:1, ease:'none', scrollTrigger:{trigger:'.proc-pin', start:'top top', end:function(){ return '+=' + dist(); }, scrub:true}});
    gsap.utils.toArray('.step').forEach(function(s){
      gsap.to(s.querySelector('.ln-prog'), {scaleX:1, ease:'none',
        scrollTrigger:{trigger:s, containerAnimation:tw, start:'left 80%', end:'right 60%', scrub:true}});
    });
  });
  mmq.add('(max-width: 860px)', function(){
    gsap.utils.toArray('.step').forEach(function(s){
      gsap.from(s, {y:50, opacity:0, duration:1.1, ease:'expo.out', scrollTrigger:{trigger:s, start:'top 90%', once:true}});
      gsap.to(s.querySelector('.ln-prog'), {scaleX:1, duration:1.4, ease:'expo.out', scrollTrigger:{trigger:s, start:'top 75%', once:true}});
    });
  });

  /* Statement: スクロールに合わせて文字が点灯 */
  d.querySelectorAll('.stmt').forEach(function(el){
    gsap.to(el.querySelectorAll('.w'), {opacity:1, stagger:.05, ease:'none',
      scrollTrigger:{trigger:el, start:'top 80%', end:'bottom 45%', scrub:true}});
  });

  /* News rows */
  gsap.utils.toArray('.ni').forEach(function(n, i){
    gsap.from(n, {x:-30, opacity:0, duration:1, ease:'expo.out', scrollTrigger:{trigger:n, start:'top 92%', once:true}});
  });

  /* Footer wordmark */
  gsap.from('.ft-word', {yPercent:60, opacity:0, duration:1.6, ease:'expo.out', scrollTrigger:{trigger:'.ft', start:'top 90%', once:true}});

  addEventListener('load', function(){ ST.refresh(); });
})();
