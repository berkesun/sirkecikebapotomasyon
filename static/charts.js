/* charts.js — bağımlılıksız SVG/HTML grafikler
   Grafik.donem  : dönem bazlı dikey çubuk / çizgi (gruplu veya yığın)
   Grafik.yatay  : yatay çubuk listesi (dağılım)
   Grafik.kivilcim: KPI kartı için mini çizgi */
const Grafik = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const gozlemciler = [];

  function cssVar(ad) { return getComputedStyle(document.documentElement).getPropertyValue(ad).trim(); }
  function renk(slot) { const v = cssVar('--s' + (Number(slot) || 0)); return v || cssVar('--s0') || '#888'; }
  function yuzey() { return cssVar('--surface') || '#fff'; }

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function metin(parent, x, y, s, attrs) { const t = el('text', Object.assign({ x, y }, attrs), parent); t.textContent = s; return t; }
  function guzelAdim(ham) {
    if (!(ham > 0)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(ham)));
    const k = ham / p;
    const m = k <= 1 ? 1 : k <= 2 ? 2 : k <= 2.5 ? 2.5 : k <= 5 ? 5 : 10;
    return m * p;
  }
  function tikler(min, max, n) {
    if (max === min) max = min + 1;
    const adim = guzelAdim((max - min) / n);
    const t = [];
    const b = Math.floor(min / adim) * adim, s = Math.ceil(max / adim) * adim;
    for (let v = b; v <= s + adim / 2; v += adim) t.push(Math.round(v * 1e6) / 1e6);
    return t;
  }
  /* 4px yuvarlak veri ucu, tabanda köşeli çubuk */
  function cubukYolu(x, yUst, yAlt, w, r, ustYuvarlak) {
    const h = yAlt - yUst;
    if (h <= 0 || w <= 0) return '';
    r = Math.min(r, w / 2, h);
    const f = v => Math.round(v * 10) / 10;
    x = f(x); yUst = f(yUst); yAlt = f(yAlt); w = f(w);
    if (ustYuvarlak) return `M${x},${yAlt} V${f(yUst + r)} Q${x},${yUst} ${f(x + r)},${yUst} H${f(x + w - r)} Q${f(x + w)},${yUst} ${f(x + w)},${f(yUst + r)} V${yAlt} Z`;
    return `M${x},${yUst} H${f(x + w)} V${f(yAlt - r)} Q${f(x + w)},${yAlt} ${f(x + w - r)},${yAlt} H${f(x + r)} Q${x},${yAlt} ${x},${f(yAlt - r)} Z`;
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function temizle() { for (const g of gozlemciler) g.disconnect(); gozlemciler.length = 0; }

  /* cfg: { tur:'cubuk'|'cizgi', yigin, etiketler:[{kisa,uzun}], seriler:[{ad, renk, veri:[], negRenk}],
            format, kisaFormat, yukseklik, legend, etiketle:'max'|'son'|null, alan, ekBilgi(i) } */
  function donem(kap, cfg) {
    kap.innerHTML = '';
    kap.classList.add('chart');
    const sarici = document.createElement('div'); sarici.className = 'chart-wrap'; kap.appendChild(sarici);
    const legend = document.createElement('div'); legend.className = 'chart-legend';
    const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true;
    const gizli = new Set();
    const tur = cfg.tur || 'cubuk';
    const yigin = !!cfg.yigin;
    const fmt = cfg.format || (v => String(v));
    const kisaFmt = cfg.kisaFormat || fmt;
    const H = cfg.yukseklik || 240;

    function ciz() {
      sarici.innerHTML = '';
      const W = Math.max(240, kap.clientWidth || 600);
      const n = Math.max(1, cfg.etiketler.length);
      const gorunen = cfg.seriler.filter(s => !gizli.has(s.ad));
      let min = 0, max = 0;
      if (yigin) {
        for (let i = 0; i < n; i++) {
          let p = 0, q = 0;
          for (const s of gorunen) { const v = s.veri[i] || 0; if (v >= 0) p += v; else q += v; }
          max = Math.max(max, p); min = Math.min(min, q);
        }
      } else {
        for (const s of gorunen) for (const v of s.veri) { if (v == null) continue; max = Math.max(max, v); min = Math.min(min, v); }
      }
      if (max === 0 && min === 0) max = 1;
      const tk = tikler(min, max, 4);
      const ymin = tk[0], ymax = tk[tk.length - 1];
      const etiketGen = Math.max(...tk.map(t => kisaFmt(t).length)) * 6.6 + 10;
      const negEtiket = cfg.etiketle === 'max' && min < 0 && gorunen.length === 1;
      const sol = Math.ceil(etiketGen), sag = 8, ust = 16, alt = 24 + (negEtiket ? 14 : 0);
      const pw = W - sol - sag, ph = H - ust - alt;
      const y = v => ust + (ymax - v) / (ymax - ymin) * ph;
      const band = pw / n;
      const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, sarici);

      const g = el('g', { class: 'grid' }, svg);
      for (const t of tk) {
        el('line', { x1: sol, x2: sol + pw, y1: y(t), y2: y(t), class: t === 0 ? 'baseline' : '' }, g);
        metin(svg, sol - 6, y(t) + 4, kisaFmt(t), { class: 'axis', 'text-anchor': 'end' });
      }
      const adimX = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / 46))));
      for (let i = 0; i < n; i++) if (i % adimX === 0)
        metin(svg, sol + i * band + band / 2, H - 7, (cfg.etiketler[i] || {}).kisa || '', { class: 'axis', 'text-anchor': 'middle' });

      const vurgu = el('rect', { x: sol, y: ust, width: band, height: ph, class: 'hl', opacity: 0 }, svg);
      const seriG = el('g', {}, svg);
      const yz = yuzey();

      if (tur === 'cubuk') {
        const k = yigin ? 1 : Math.max(1, gorunen.length);
        const slot = band * 0.72;
        const bw = Math.max(2, Math.min(24, (slot - (k - 1) * 3) / k));
        const gw = k * bw + (k - 1) * 3;
        const posTop = new Array(n).fill(0), negTop = new Array(n).fill(0);
        gorunen.forEach((s, j) => {
          for (let i = 0; i < n; i++) {
            const v = s.veri[i];
            if (!v) continue;
            const x = sol + i * band + (band - gw) / 2 + (yigin ? 0 : j * (bw + 3));
            let taban, tepe;
            if (yigin) {
              if (v >= 0) { taban = posTop[i]; posTop[i] += v; tepe = posTop[i]; }
              else { taban = negTop[i]; negTop[i] += v; tepe = negTop[i]; }
            } else { taban = 0; tepe = v; }
            let yUst = y(Math.max(taban, tepe)), yAlt = y(Math.min(taban, tepe));
            if (yigin && taban !== 0) { if (v >= 0) yAlt -= 2; else yUst += 2; } /* 2px yüzey boşluğu */
            if (yAlt - yUst < 0.5) continue;
            const c = v < 0 && s.negRenk ? s.negRenk : s.renk;
            el('path', { d: cubukYolu(x, yUst, yAlt, bw, 4, v >= 0), fill: c, class: 'bar' }, seriG);
          }
        });
        if (cfg.etiketle === 'max' && gorunen.length === 1 && n <= 60) {
          const s = gorunen[0]; let mi = -1, mv = 0;
          s.veri.forEach((v, i) => { if (v != null && Math.abs(v) > mv) { mv = Math.abs(v); mi = i; } });
          if (mi >= 0) {
            const v = s.veri[mi];
            const cx = sol + mi * band + band / 2;
            const yy = v >= 0 ? y(v) - 5 : Math.min(y(v) + 14, H - alt + 12); /* negatif çubukta etiket çubuğun altına */
            const anchor = cx > sol + pw - 36 ? 'end' : cx < sol + 36 ? 'start' : 'middle';
            metin(svg, cx, yy, fmt(v), { class: 'vlabel', 'text-anchor': anchor });
          }
        }
      } else {
        gorunen.forEach(s => {
          let d = '', acik = false; const pts = [];
          for (let i = 0; i < n; i++) {
            const v = s.veri[i];
            if (v == null) { acik = false; continue; }
            const cx = sol + i * band + band / 2, cy = y(v);
            pts.push([cx, cy, v]);
            d += (acik ? 'L' : 'M') + cx.toFixed(1) + ',' + cy.toFixed(1);
            acik = true;
          }
          if (cfg.alan && pts.length > 1) {
            const a = `M${pts[0][0]},${y(0)} ` + pts.map(p => `L${p[0]},${p[1]}`).join(' ') + ` L${pts[pts.length - 1][0]},${y(0)} Z`;
            el('path', { d: a, fill: s.renk, 'fill-opacity': 0.1 }, seriG);
          }
          el('path', { d, fill: 'none', stroke: s.renk, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, seriG);
          if (n <= 31) for (const p of pts) el('circle', { cx: p[0], cy: p[1], r: 4, fill: s.renk, stroke: yz, 'stroke-width': 2 }, seriG);
          if (cfg.etiketle === 'son' && pts.length) {
            const p = pts[pts.length - 1];
            metin(svg, p[0], p[1] - 9, fmt(p[2]), { class: 'vlabel', 'text-anchor': p[0] > sol + pw - 40 ? 'end' : 'middle' });
          }
        });
      }

      /* hover katmanı: X'e en yakın dönem, tüm seriler tek araç ipucunda */
      const ov = el('rect', { x: sol, y: ust, width: pw, height: ph, fill: 'transparent', class: 'overlay' }, svg);
      const xh = el('line', { x1: 0, x2: 0, y1: ust, y2: ust + ph, class: 'xhair', opacity: 0 }, svg);
      let son = -1;
      const goster = (e) => {
        const r = sarici.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        const i = Math.max(0, Math.min(n - 1, Math.floor((px - sol) / band)));
        if (i !== son) {
          son = i;
          vurgu.setAttribute('x', sol + i * band); vurgu.setAttribute('opacity', tur === 'cubuk' ? 1 : 0);
          const cx = sol + i * band + band / 2;
          xh.setAttribute('x1', cx); xh.setAttribute('x2', cx); xh.setAttribute('opacity', tur === 'cizgi' ? 1 : 0);
          tip.innerHTML = '';
          const t = document.createElement('div'); t.className = 't';
          t.textContent = (cfg.etiketler[i] || {}).uzun || (cfg.etiketler[i] || {}).kisa || ''; tip.appendChild(t);
          for (const s of gorunen) {
            const v = s.veri[i];
            const row = document.createElement('div'); row.className = 'r';
            const k = document.createElement('span'); k.className = 'k'; k.style.background = (v < 0 && s.negRenk) ? s.negRenk : s.renk;
            const b = document.createElement('b'); b.textContent = fmt(v || 0);
            const nm = document.createElement('span'); nm.className = 'n'; nm.textContent = s.ad;
            row.append(k, b, nm); tip.appendChild(row);
          }
          if (cfg.ekBilgi) { const ek = cfg.ekBilgi(i); if (ek) { const d = document.createElement('div'); d.className = 'ek'; d.textContent = ek; tip.appendChild(d); } }
          tip.hidden = false;
        }
        const tw = tip.offsetWidth, th = tip.offsetHeight;
        let lx = px + 14; if (lx + tw > W) lx = px - 14 - tw; if (lx < 0) lx = 0;
        let ly = py - th - 10; if (ly < 0) ly = py + 16;
        tip.style.left = lx + 'px'; tip.style.top = ly + 'px';
      };
      const gizle = () => { son = -1; tip.hidden = true; vurgu.setAttribute('opacity', 0); xh.setAttribute('opacity', 0); };
      let dokunZaman = null;
      ov.addEventListener('pointermove', goster);
      ov.addEventListener('pointerdown', e => { goster(e); if (e.pointerType === 'touch') { clearTimeout(dokunZaman); dokunZaman = setTimeout(gizle, 2500); } });
      ov.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') gizle(); });
      ov.addEventListener('pointercancel', gizle);
      sarici.appendChild(tip);
    }

    function legendCiz() {
      legend.innerHTML = '';
      if (cfg.legend === false || cfg.seriler.length < 2) { legend.remove(); return; }
      for (const s of cfg.seriler) {
        const it = document.createElement('button'); it.type = 'button';
        it.className = 'legend-item' + (gizli.has(s.ad) ? ' off' : '');
        const sw = document.createElement('span'); sw.className = 'swatch' + (tur === 'cizgi' ? ' line' : ''); sw.style.background = s.renk;
        const nm = document.createElement('span'); nm.textContent = s.ad;
        it.append(sw, nm);
        it.addEventListener('click', () => {
          if (gizli.has(s.ad)) gizli.delete(s.ad);
          else if (gizli.size < cfg.seriler.length - 1) gizli.add(s.ad);
          legendCiz(); ciz();
        });
        legend.appendChild(it);
      }
      kap.appendChild(legend);
    }

    ciz(); legendCiz();
    if (window.ResizeObserver) {
      let sonW = kap.clientWidth;
      const ro = new ResizeObserver(debounce(() => { const w = kap.clientWidth; if (w && w !== sonW && kap.isConnected) { sonW = w; ciz(); } }, 80));
      ro.observe(kap); gozlemciler.push(ro);
    }
    return { yenile: () => { ciz(); legendCiz(); } };
  }

  /* cfg: { satirlar:[{ad, alt, deger, renk, pay}], format, tiklandi } */
  function yatay(kap, cfg) {
    kap.innerHTML = '';
    kap.classList.add('hbars');
    const fmt = cfg.format || String;
    if (!cfg.satirlar.length) { const e = document.createElement('div'); e.className = 'empty-sm'; e.textContent = cfg.bosMetin || 'Bu aralıkta veri yok'; kap.appendChild(e); return; }
    const max = Math.max(1, ...cfg.satirlar.map(r => Math.abs(r.deger)));
    for (const r of cfg.satirlar) {
      const row = document.createElement('div'); row.className = 'hrow'; row.style.setProperty('--c', r.renk);
      const lab = document.createElement('div'); lab.className = 'hlabel';
      const t = document.createElement('span'); t.className = 't'; t.textContent = r.ad; t.title = r.ad; lab.appendChild(t);
      if (r.alt) { const s = document.createElement('span'); s.className = 's'; s.textContent = r.alt; lab.appendChild(s); }
      const track = document.createElement('div'); track.className = 'htrack';
      const bar = document.createElement('div'); bar.className = 'hbar'; bar.style.width = (Math.abs(r.deger) / max * 100).toFixed(2) + '%'; track.appendChild(bar);
      const val = document.createElement('div'); val.className = 'hval';
      const v = document.createElement('span'); v.textContent = fmt(r.deger); val.appendChild(v);
      if (r.pay != null) { const p = document.createElement('span'); p.className = 's'; p.textContent = '%' + (Number(r.pay) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 }); val.appendChild(p); }
      row.append(lab, track, val);
      if (cfg.tiklandi) { row.classList.add('clickable'); row.addEventListener('click', () => cfg.tiklandi(r)); }
      kap.appendChild(row);
    }
  }

  /* mini çizgi: de-emphasis gri çizgi, son nokta vurgu renginde; alan: true → %10 dolgu */
  function kivilcim(kap, veri, vurguRenk, secenek = {}) {
    if (!kap) return;
    kap.innerHTML = '';
    const W = secenek.W || 60, H = secenek.H || 22, n = veri.length;
    if (n < 2) return;
    const max = Math.max(...veri, 0), min = Math.min(...veri, 0);
    const y = v => max === min ? H / 2 : 3 + (max - v) / (max - min) * (H - 6);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'spark-svg' }, kap);
    const pts = veri.map((v, i) => [i / (n - 1) * (W - 6) + 3, y(v)]);
    const cizgi = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    const renkC = vurguRenk || cssVar('--accent');
    if (secenek.alan) el('path', { d: `${cizgi} L${pts[n - 1][0].toFixed(1)},${y(0).toFixed(1)} L${pts[0][0].toFixed(1)},${y(0).toFixed(1)} Z`, fill: renkC, 'fill-opacity': 0.1 }, svg);
    el('path', { d: cizgi, fill: 'none', stroke: secenek.alan ? renkC : cssVar('--s0'), 'stroke-width': secenek.alan ? 2 : 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    const p = pts[n - 1];
    el('circle', { cx: p[0], cy: p[1], r: secenek.alan ? 4 : 3, fill: renkC, stroke: yuzey(), 'stroke-width': 2 }, svg);
  }

  return { donem, yatay, kivilcim, renk, cssVar, temizle };
})();
