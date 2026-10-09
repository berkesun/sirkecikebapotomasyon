/* app.js — Sirkeci Kebap Portal ön yüzü
   Sayfalar: Panel (dashboard), Gelir, Gider, Ayarlar */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = U.esc;
const cv = (v) => Grafik.cssVar(v);

/* ---------- ikonlar (24px, çizgi) ---------- */
const IK = {
  panel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  gelir: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  gider: '<path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/>',
  ayarlar: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevR: '<path d="M9 18l6-6-6-6"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  upload: '<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 3h16"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M16 12h5"/><circle cx="16" cy="12" r="1"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M17.5 13.5a6.5 6.5 0 0 1 4 6.5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 5h14l3 7v7H2v-7z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 4 3 5-7"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[n] || ''}</svg>`;
const ikonBtn = (ikon, attrs, cls, label) => `<button type="button" class="btn sm icon ${cls || ''}" ${attrs || ''} aria-label="${esc(label)}" title="${esc(label)}">${ic(ikon)}</button>`;
const harfAvatar = (ad, cls = '') => `<div class="avatar ${cls}">${esc(String(ad || '?').trim().charAt(0).toLocaleUpperCase('tr-TR'))}</div>`;
const adAvatar = (ad, cls = '') => { const p = String(ad || '').trim().split(/\s+/); const h = (p[0] || '?').charAt(0) + (p[1] ? p[1].charAt(0) : ''); return `<div class="avatar ${cls}">${esc(h.toLocaleUpperCase('tr-TR'))}</div>`; };
const tarihAvatar = (iso) => { const d = U.tarihOku(iso); return `<div class="avatar date"><b>${d.getDate()}</b><span>${U.GUNLER_K[d.getDay()]}</span></div>`; };
const bosDurum = (ikon, baslik, metin, cta = '') => `<div class="empty"><div class="ico">${ic(ikon)}</div>${baslik ? `<b>${baslik}</b>` : ''}<span>${metin}</span>${cta}</div>`;

const SAYFALAR = [['panel', 'Panel'], ['gelir', 'Gelir'], ['gider', 'Gider'], ['ayarlar', 'Ayarlar']];
const TURLER = [['nakit', 'Nakit'], ['kredi_karti', 'Kredi Kartı'], ['yemek_karti', 'Yemek Kartı'], ['online', 'Online Sipariş'], ['diger', 'Diğer']];
const TUR_AD = Object.fromEntries(TURLER);
const ODEMELER = [['nakit', 'Nakit'], ['banka', 'Banka'], ['kart', 'Kart']];
const ODEME_AD = Object.fromEntries(ODEMELER);
const ONAYARLAR = [['bugun', 'Bugün'], ['buHafta', 'Bu Hafta'], ['buAy', 'Bu Ay'], ['gecenAy', 'Geçen Ay'], ['son7', 'Son 7 Gün'], ['son30', 'Son 30 Gün'], ['son90', 'Son 90 Gün'], ['buYil', 'Bu Yıl'], ['ozel', 'Özel']];
const GRANLAR = [['gun', 'Gün'], ['hafta', 'Hafta'], ['ay', 'Ay']];
const LISTE_ONAYAR = [['buAy', 'Bu Ay'], ['gecenAy', 'Geçen Ay'], ['son30', 'Son 30 Gün'], ['buYil', 'Bu Yıl'], ['tumu', 'Tümü']];
const SIRALAMALAR = [['tarih-', 'Tarih: yeni → eski'], ['tarih+', 'Tarih: eski → yeni'], ['tutar-', 'Tutar: büyük → küçük'], ['tutar+', 'Tutar: küçük → büyük']];
const LISTE_ADIM = 30;

const S = {
  boot: null, ayar: {}, yontemler: [], gruplar: [], kategoriler: [], sabitler: [], personeller: [], gelir: [], gider: [],
  sayfa: 'panel',
  ay: U.bugun().slice(0, 7),
  f: { on: 'buAy', ozelBas: null, ozelBit: null, bas: null, bit: null, gran: 'gun', granEl: false,
       kapaliY: new Set(), kapaliK: new Set(), kapaliG: new Set(), ara: '', acik: false },
  gelirListe: { on: 'buAy', bas: null, bit: null, ara: '', sirala: 'tarih-', limit: LISTE_ADIM },
  giderListe: { on: 'buAy', bas: null, bit: null, ara: '', sirala: 'tarih-', limit: LISTE_ADIM, kat: '', odeme: '' },
  gelirForm: { tarih: U.bugun() },
  giderForm: { tarih: U.bugun(), duzenleId: null },
};
const yontemMap = () => Object.fromEntries(S.yontemler.map(y => [y.id, y]));
const katMap = () => Object.fromEntries(S.kategoriler.map(k => [k.id, k]));
const personelKategori = () => (S.ayar.personel_kategori_id ? katMap()[S.ayar.personel_kategori_id] : null) || null;
function ayEtiketi(ay) { const [y, m] = ay.split('-').map(Number); return `${U.AYLAR[m - 1]} ${y}`; }
function ayEkle(ay, n) { const [y, m] = ay.split('-').map(Number); return U.isoTarih(new Date(y, m - 1 + n, 1)).slice(0, 7); }
function ayGunSayisi(ay) { const [y, m] = ay.split('-').map(Number); return new Date(y, m, 0).getDate(); }

/* ------------------------------------------------------------------ */
/* altyapı                                                             */
/* ------------------------------------------------------------------ */
async function api(yol, secenek = {}) {
  const o = { method: secenek.method || 'GET', headers: {} };
  if (secenek.body !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(secenek.body); }
  const r = await fetch(yol, o);
  if (r.status === 401 && yol !== '/api/giris') { girisEkrani(); throw new Error('Giriş gerekli'); }
  let veri = null;
  try { veri = await r.json(); } catch (e) { /* gövde yok */ }
  if (!r.ok) {
    let m = (veri && (veri.detail || veri.hata)) || ('Hata ' + r.status);
    if (Array.isArray(m)) m = m.map(x => (x.loc || []).slice(1).join('.') + ': ' + x.msg).join('; ');
    throw new Error(typeof m === 'string' ? m : JSON.stringify(m));
  }
  return veri;
}
let toastZaman = null;
function toast(msg, tip = 'ok') {
  const root = $('#toast-root');
  root.innerHTML = `<div class="toast ${tip === 'hata' ? 'hata' : ''}">${ic(tip === 'hata' ? 'alert' : 'check')}<span>${esc(msg)}</span></div>`;
  clearTimeout(toastZaman);
  toastZaman = setTimeout(() => { root.innerHTML = ''; }, tip === 'hata' ? 4000 : 2400);
}
function mesgul(b) { document.body.classList.toggle('busy', !!b); }

function modal({ baslik, govde, onay = 'Tamam', iptal = 'Vazgeç', tehlike = false, onOnay = null, kur = null }) {
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">
      <div class="modal-h">${esc(baslik)}</div><div class="modal-b">${govde}</div>
      <div class="modal-f">${iptal ? `<button class="btn" data-m="iptal" type="button">${esc(iptal)}</button>` : ''}
      <button class="btn ${tehlike ? 'danger-solid' : 'primary'}" data-m="onay" type="button">${esc(onay)}</button></div></div></div>`;
    const box = $('.modal', root);
    const escTus = (e) => { if (e.key === 'Escape') kapat(false); };
    const kapat = (sonuc) => { root.innerHTML = ''; document.removeEventListener('keydown', escTus); resolve(sonuc); };
    document.addEventListener('keydown', escTus);
    if (kur) kur(box);
    $('[data-m="onay"]', root).onclick = async () => {
      if (!onOnay) return kapat(true);
      const err = $('.err', box); if (err) err.textContent = '';
      try { const ok = await onOnay(box); if (ok !== false) kapat(true); }
      catch (e) { if (err) err.textContent = e.message; else toast(e.message, 'hata'); }
    };
    const ip = $('[data-m="iptal"]', root); if (ip) ip.onclick = () => kapat(false);
    $('.modal-bg', root).addEventListener('click', e => { if (e.target === e.currentTarget) kapat(false); });
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); $('[data-m="onay"]', root).click(); } });
    const first = $('input:not([type=checkbox]), select', box); if (first) setTimeout(() => first.focus(), 60);
  });
}
/* alanlar: [{ad, etiket, tip:'text'|'number'|'date'|'select'|'renk'|'check', deger, secenekler, ipucu, yer}] */
function formModal({ baslik, alanlar, onay = 'Kaydet', onKaydet }) {
  const govde = alanlar.map(a => {
    const id = 'fm-' + a.ad;
    const etiket = `${esc(a.etiket)}${a.ipucu ? ` <span class="hint">${esc(a.ipucu)}</span>` : ''}`;
    if (a.tip === 'select') return `<div class="field"><label for="${id}">${etiket}</label><select id="${id}" data-f="${a.ad}">${a.secenekler.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(a.deger) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
    if (a.tip === 'renk') return `<div class="field"><label>${etiket}</label><div class="renkler" data-f="${a.ad}" data-deger="${Number(a.deger) || 1}">${[1, 2, 3, 4, 5, 6, 7, 8].map(s => `<button type="button" class="renk ${s === Number(a.deger) ? 'on' : ''}" data-s="${s}" style="--c:${Grafik.renk(s)}" aria-label="Renk ${s}"></button>`).join('')}</div></div>`;
    if (a.tip === 'check') return `<label class="check"><input type="checkbox" data-f="${a.ad}" ${a.deger ? 'checked' : ''}><span>${esc(a.etiket)}</span></label>`;
    if (a.tip === 'date') return `<div class="field"><label for="${id}">${etiket}</label><input id="${id}" data-f="${a.ad}" type="date" value="${esc(a.deger || '')}"></div>`;
    if (a.tip === 'number') return `<div class="field"><label for="${id}">${etiket}</label><div class="${a.para ? 'money' : ''}"><input id="${id}" data-f="${a.ad}" type="text" inputmode="decimal" autocomplete="off" value="${esc(a.deger == null ? '' : a.deger)}" placeholder="${esc(a.yer || '')}"></div></div>`;
    return `<div class="field"><label for="${id}">${etiket}</label><input id="${id}" data-f="${a.ad}" type="text" value="${esc(a.deger == null ? '' : a.deger)}" placeholder="${esc(a.yer || '')}"></div>`;
  }).join('') + '<div class="err"></div>';
  return modal({
    baslik, govde, onay,
    kur: (box) => {
      $$('.renkler', box).forEach(r => r.addEventListener('click', e => {
        const b = e.target.closest('.renk'); if (!b) return;
        r.dataset.deger = b.dataset.s; $$('.renk', r).forEach(x => x.classList.toggle('on', x === b));
      }));
    },
    onOnay: async (box) => {
      const v = {};
      $$('[data-f]', box).forEach(e => {
        const k = e.dataset.f;
        if (e.classList.contains('renkler')) v[k] = Number(e.dataset.deger);
        else if (e.type === 'checkbox') v[k] = e.checked;
        else v[k] = e.value;
      });
      for (const a of alanlar) if (a.tip === 'number') v[a.ad] = U.tutarOku(v[a.ad]);
      await onKaydet(v);
      return true;
    },
  });
}

function temaUygula(tema) {
  const r = document.documentElement;
  if (tema === 'acik') r.dataset.theme = 'light';
  else if (tema === 'koyu') r.dataset.theme = 'dark';
  else delete r.dataset.theme;
  try { localStorage.setItem('tema', tema || 'sistem'); } catch (e) { /* özel pencere */ }
}

async function basla() {
  S.boot = await api('/api/bootstrap');
  if (S.boot.giris_gerekli && !S.boot.girisli) { girisEkrani(); return; }
  document.body.classList.remove('login');
  tanimUygula(S.boot);
  temaUygula(S.ayar.tema);
  navCiz();
  await veriYukle();
  if (!basla.bagli) {
    basla.bagli = true;
    window.addEventListener('hashchange', yonlendir);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', () => { if (S.sayfa === 'panel') yonlendir(); });
  }
  yonlendir();
}
function tanimUygula(b) {
  S.ayar = b.ayar || {}; S.yontemler = b.yontemler || []; S.gruplar = b.gruplar || []; S.kategoriler = b.kategoriler || [];
  S.sabitler = b.sabitler || []; S.personeller = b.personeller || [];
}
async function tanimYukle() { const b = await api('/api/bootstrap'); S.boot = b; tanimUygula(b); navCiz(); navGuncelle(); }
async function veriYukle() {
  const [g, gi] = await Promise.all([api('/api/gelir'), api('/api/gider')]);
  S.gelir = g; S.gider = gi;
}

function navCiz() {
  const ad = esc(S.ayar.isletme_adi || (S.boot && S.boot.isletme_adi) || 'Sirkeci Kebap');
  const links = SAYFALAR.map(([k, a]) => `<a href="#${k}" data-sayfa="${k}"><span class="ico">${ic(k)}</span><span>${a}</span></a>`).join('');
  $('#side').innerHTML = `<div class="brand"><img src="/static/icon.svg" alt=""><span>${ad}</span></div><nav>${links}</nav><div class="foot">Gelir / Gider Portalı · v${esc(S.boot.surum)}</div>`;
  $('#tabbar').innerHTML = links;
  $('#topbar').innerHTML = `<img class="logo" src="/static/icon.svg" alt=""><span class="brand">${ad}</span><span class="page" id="top-page"></span>`;
  document.title = (S.ayar.isletme_adi || 'Sirkeci Kebap') + ' · Portal';
}
function navGuncelle() {
  $$('[data-sayfa]').forEach(a => a.classList.toggle('on', a.dataset.sayfa === S.sayfa));
  const tp = $('#top-page'); if (tp) tp.textContent = (SAYFALAR.find(s => s[0] === S.sayfa) || [])[1] || '';
}
function yonlendir() {
  const h = (location.hash || '#panel').slice(1);
  const [sayfa, ...rest] = h.split('/');
  S.sayfa = SAYFALAR.some(s => s[0] === sayfa) ? sayfa : 'panel';
  Grafik.temizle();
  navGuncelle();
  window.scrollTo(0, 0);
  try {
    if (S.sayfa === 'panel') panelGoster();
    else if (S.sayfa === 'gelir') { if (rest[0] && U.gecerliTarih(rest[0])) S.gelirForm.tarih = rest[0]; gelirGoster(); }
    else if (S.sayfa === 'gider') { if (rest[0] === 'duzenle' && rest[1]) S.giderForm.duzenleId = Number(rest[1]); giderGoster(); }
    else ayarlarGoster();
  } catch (e) {
    console.error(e);
    $('#icerik').innerHTML = `<div class="card">${bosDurum('alert', 'Sayfa yüklenemedi', esc(e.message))}</div>`;
  }
}
function girisEkrani() {
  document.body.classList.add('login');
  $('#side').innerHTML = ''; $('#tabbar').innerHTML = ''; $('#topbar').innerHTML = '';
  $('#icerik').innerHTML = `<div class="login-box"><img src="/static/icon.svg" alt=""><h1>${esc((S.boot && S.boot.isletme_adi) || 'Sirkeci Kebap')}</h1>
    <p class="muted">Portala girmek için şifrenizi yazın</p>
    <form id="giris-form"><input type="password" id="giris-sifre" placeholder="Şifre" autocomplete="current-password" required>
    <button class="btn primary" type="submit">${ic('lock')} Giriş</button><div class="err" id="giris-hata"></div></form></div>`;
  $('#giris-form').onsubmit = async e => {
    e.preventDefault();
    try { await api('/api/giris', { method: 'POST', body: { sifre: $('#giris-sifre').value } }); await basla(); }
    catch (err) { $('#giris-hata').textContent = err.message; }
  };
}

/* ------------------------------------------------------------------ */
/* hesaplama                                                           */
/* ------------------------------------------------------------------ */
function aralikHesapla(f) {
  const t = U.bugun();
  let bas, bit, gran;
  switch (f.on) {
    case 'bugun': bas = bit = t; gran = 'gun'; break;
    case 'buHafta': bas = U.haftaBasi(t); bit = t; gran = 'gun'; break;
    case 'buAy': bas = U.ayBasi(t); bit = t; gran = 'gun'; break;
    case 'gecenAy': { const ob = U.gunEkle(U.ayBasi(t), -1); bas = U.ayBasi(ob); bit = ob; gran = 'gun'; break; }
    case 'son7': bas = U.gunEkle(t, -6); bit = t; gran = 'gun'; break;
    case 'son30': bas = U.gunEkle(t, -29); bit = t; gran = 'gun'; break;
    case 'son90': bas = U.gunEkle(t, -89); bit = t; gran = 'hafta'; break;
    case 'buYil': bas = t.slice(0, 4) + '-01-01'; bit = t; gran = 'ay'; break;
    default: {
      bas = f.ozelBas || U.ayBasi(t); bit = f.ozelBit || t;
      if (bas > bit) [bas, bit] = [bit, bas];
      const n = U.gunFarki(bas, bit) + 1;
      gran = n <= 45 ? 'gun' : n <= 200 ? 'hafta' : 'ay';
    }
  }
  f.bas = bas; f.bit = bit;
  if (!f.granEl) f.gran = gran;
}

function hesapla(bas, bit, gran, f) {
  const km = katMap();
  const D = U.donemler(bas, bit, gran).map(d => Object.assign(d, { gelir: 0, gider: 0, komisyon: 0, kdv: 0, kdvInd: 0, net: 0, yontem: {}, grup: {}, kategori: {} }));
  const idx = Object.fromEntries(D.map((d, i) => [d.key, i]));
  const T = { gelir: 0, komisyon: 0, gider: 0, kdv: 0, kdvInd: 0, gunSayisi: U.gunFarki(bas, bit) + 1, kayitliGun: 0, giderAdet: 0 };
  const Y = {}, K = {}, G = {};
  const ara = U.kucuk(f.ara.trim());
  let enIyiGun = null, enKotuGun = null, enYuksekGider = null;

  for (const g of S.gelir) {
    if (g.tarih < bas || g.tarih > bit) continue;
    if (ara && !U.kucuk(g.aciklama).includes(ara)) continue;
    const d = D[idx[U.donemAnahtari(g.tarih, gran)]]; if (!d) continue;
    let gunToplam = 0;
    for (const k of g.kalemler) {
      if (f.kapaliY.has(k.yontem_id)) continue;
      const kom = k.tutar * k.komisyon_orani / 100;
      const kdv = k.kdv_orani ? k.tutar * k.kdv_orani / (100 + k.kdv_orani) : 0;
      d.gelir += k.tutar; d.komisyon += kom; d.kdv += kdv;
      d.yontem[k.yontem_id] = (d.yontem[k.yontem_id] || 0) + k.tutar;
      T.gelir += k.tutar; T.komisyon += kom; T.kdv += kdv;
      const y = Y[k.yontem_id] || (Y[k.yontem_id] = { tutar: 0, komisyon: 0 });
      y.tutar += k.tutar; y.komisyon += kom;
      gunToplam += k.tutar;
    }
    if (gunToplam > 0) {
      T.kayitliGun++;
      if (!enIyiGun || gunToplam > enIyiGun.tutar) enIyiGun = { tarih: g.tarih, tutar: gunToplam };
      if (!enKotuGun || gunToplam < enKotuGun.tutar) enKotuGun = { tarih: g.tarih, tutar: gunToplam };
    }
  }
  for (const g of S.gider) {
    if (g.tarih < bas || g.tarih > bit) continue;
    const kat = km[g.kategori_id]; if (!kat) continue;
    if (f.kapaliK.has(g.kategori_id) || f.kapaliG.has(kat.grup_id)) continue;
    if (ara && !U.kucuk(g.aciklama).includes(ara) && !U.kucuk(kat.ad).includes(ara)) continue;
    const d = D[idx[U.donemAnahtari(g.tarih, gran)]]; if (!d) continue;
    const kdv = g.kdv_orani ? g.tutar * g.kdv_orani / (100 + g.kdv_orani) : 0;
    d.gider += g.tutar; d.kdvInd += kdv;
    d.grup[kat.grup_id] = (d.grup[kat.grup_id] || 0) + g.tutar;
    d.kategori[g.kategori_id] = (d.kategori[g.kategori_id] || 0) + g.tutar;
    T.gider += g.tutar; T.kdvInd += kdv; T.giderAdet++;
    const k = K[g.kategori_id] || (K[g.kategori_id] = { tutar: 0, adet: 0 });
    k.tutar += g.tutar; k.adet++;
    G[kat.grup_id] = (G[kat.grup_id] || 0) + g.tutar;
    if (!enYuksekGider || g.tutar > enYuksekGider.tutar) enYuksekGider = g;
  }
  for (const d of D) d.net = d.gelir - d.komisyon - d.gider;
  T.netTahsilat = T.gelir - T.komisyon;
  T.net = T.netTahsilat - T.gider;
  T.kdvFark = T.kdv - T.kdvInd;
  T.netKdvSonrasi = T.net - Math.max(0, T.kdvFark);
  T.marj = T.gelir ? T.net / T.gelir * 100 : 0;
  T.gunlukOrt = T.kayitliGun ? T.gelir / T.kayitliGun : 0;
  const yontemler = S.yontemler.map(y => ({ ...y, tutar: (Y[y.id] || {}).tutar || 0, komisyon: (Y[y.id] || {}).komisyon || 0, pay: T.gelir ? ((Y[y.id] || {}).tutar || 0) / T.gelir * 100 : 0 }))
    .filter(y => y.tutar > 0).sort((a, b) => b.tutar - a.tutar);
  const kategoriler = S.kategoriler.map(k => ({ ...k, tutar: (K[k.id] || {}).tutar || 0, adet: (K[k.id] || {}).adet || 0, pay: T.gider ? ((K[k.id] || {}).tutar || 0) / T.gider * 100 : 0 }))
    .filter(k => k.tutar > 0).sort((a, b) => b.tutar - a.tutar);
  const gruplar = S.gruplar.map(g => ({ ...g, tutar: G[g.id] || 0, pay: T.gider ? (G[g.id] || 0) / T.gider * 100 : 0 }))
    .filter(g => g.tutar > 0).sort((a, b) => b.tutar - a.tutar);
  return { D, T, yontemler, kategoriler, gruplar, enIyiGun, enKotuGun, enYuksekGider };
}

/* ------------------------------------------------------------------ */
/* PANEL                                                               */
/* ------------------------------------------------------------------ */
function filtreSayisi(f) { return f.kapaliY.size + f.kapaliK.size + f.kapaliG.size + (f.ara.trim() ? 1 : 0); }

/* Aralık uzunluğuna göre anlamlı görünüm seçenekleri */
function granSecenekleri(n) {
  if (n < 14) return ['gun'];
  if (n < 60) return ['gun', 'hafta'];
  if (n <= 120) return ['gun', 'hafta', 'ay'];
  return ['hafta', 'ay'];
}
function panelGoster() {
  const f = S.f; aralikHesapla(f);
  $('#icerik').innerHTML = `
    <div class="page-head"><div><h1>Panel</h1><div class="sub" id="panel-aralik"></div></div></div>
    ${S.boot.giris_gerekli ? '' : `<div class="notice">${ic('lock')}<div>Portal şu an şifresiz. İnternete açmadan önce <a href="#ayarlar">Ayarlar → Güvenlik</a> bölümünden şifre belirleyin.</div></div>`}
    <div class="filterbar" id="filterbar">
      <div class="chips" id="onayarlar">${ONAYARLAR.map(([k, a]) => `<button type="button" class="chip${f.on === k ? ' on' : ''}" data-on="${k}">${a}</button>`).join('')}</div>
      <div class="fb-row ozel" id="ozel-satir" ${f.on === 'ozel' ? '' : 'hidden'}>
        <input type="date" id="f-bas" value="${f.ozelBas || f.bas}" aria-label="Başlangıç"><span class="muted">–</span><input type="date" id="f-bit" value="${f.ozelBit || f.bit}" aria-label="Bitiş"><button class="btn sm primary" id="f-uygula" type="button">Uygula</button></div>
      <div class="fb-row">
        <div class="seg" id="gran"></div>
        <button class="btn sm ghost" id="f-toggle" type="button">${ic('list')}Filtreler<span id="f-cnt"></span></button>
      </div>
      <div class="fpanel" id="fpanel" ${f.acik ? '' : 'hidden'}></div>
    </div>
    <div id="panel-sonuc"></div>`;

  $('#onayarlar').addEventListener('click', e => {
    const b = e.target.closest('[data-on]'); if (!b) return;
    f.on = b.dataset.on; f.granEl = false;
    $$('#onayarlar .chip').forEach(x => x.classList.toggle('on', x === b));
    b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    $('#ozel-satir').hidden = f.on !== 'ozel';
    aralikHesapla(f); panelSonucCiz();
  });
  const aktifChip = $('#onayarlar .chip.on'); if (aktifChip) aktifChip.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#f-uygula').addEventListener('click', () => {
    const b = $('#f-bas').value, t = $('#f-bit').value;
    if (!U.gecerliTarih(b) || !U.gecerliTarih(t)) return toast('Geçerli iki tarih seçin', 'hata');
    f.on = 'ozel'; f.ozelBas = b; f.ozelBit = t; f.granEl = false;
    aralikHesapla(f); panelSonucCiz();
  });
  $('#gran').addEventListener('click', e => {
    const b = e.target.closest('[data-gran]'); if (!b) return;
    f.gran = b.dataset.gran; f.granEl = true; panelSonucCiz();
  });
  $('#f-toggle').addEventListener('click', () => { f.acik = !f.acik; $('#fpanel').hidden = !f.acik; });
  fpanelCiz(); panelSonucCiz();
}
function granCiz() {
  const f = S.f;
  const n = U.gunFarki(f.bas, f.bit) + 1;
  const secenekler = granSecenekleri(n);
  if (!secenekler.includes(f.gran)) { f.granEl = false; aralikHesapla(f); if (!secenekler.includes(f.gran)) f.gran = secenekler[0]; }
  const seg = $('#gran');
  seg.hidden = secenekler.length < 2;
  seg.innerHTML = secenekler.map(k => `<button type="button" class="${f.gran === k ? 'on' : ''}" data-gran="${k}">${GRAN_AD[k]}</button>`).join('');
}
function filtreRozet() {
  const n = filtreSayisi(S.f);
  $('#f-cnt').innerHTML = n ? `<span class="cnt">${n}</span>` : '';
}
function fpanelCiz() {
  const f = S.f;
  const kullanilanK = new Set(S.gider.map(g => g.kategori_id));
  const kats = S.kategoriler.filter(k => k.aktif || kullanilanK.has(k.id));
  const chip = (data, id, on, dotRenk, ad) =>
    `<button type="button" class="chip ${on ? '' : 'off'}" data-${data}="${id}">${dotRenk ? `<span class="dot" style="--c:${dotRenk}"></span>` : ''}<span class="t">${esc(ad)}</span></button>`;
  $('#fpanel').innerHTML = `
    <div class="f-grp"><div class="f-lbl">Ödeme yöntemleri</div><div class="chips wrap" id="f-yontem">${S.yontemler.map(y => chip('y', y.id, !f.kapaliY.has(y.id), Grafik.renk(y.renk), y.ad)).join('')}</div></div>
    <div class="f-grp"><div class="f-lbl">Gider grupları</div><div class="chips wrap" id="f-grup">${S.gruplar.map(g => chip('g', g.id, !f.kapaliG.has(g.id), null, g.ad)).join('')}</div></div>
    <div class="f-grp"><div class="f-lbl">Gider kategorileri</div><div class="chips wrap" id="f-kat">${kats.map(k => chip('k', k.id, !f.kapaliK.has(k.id), null, k.ad)).join('')}</div></div>
    <div class="f-grp"><div class="f-lbl">Açıklamada ara</div><input type="search" id="f-ara" placeholder="örn. düğün, fatura, Ahmet" value="${esc(f.ara)}"></div>
    <div class="f-grp"><button class="btn sm ghost" id="f-sifirla" type="button">Filtreleri sıfırla</button></div>`;
  filtreRozet();
  const toggle = (set, id, btn) => { if (set.has(id)) set.delete(id); else set.add(id); btn.classList.toggle('off', set.has(id)); filtreRozet(); panelSonucCiz(); };
  $('#f-yontem').addEventListener('click', e => { const b = e.target.closest('[data-y]'); if (b) toggle(f.kapaliY, Number(b.dataset.y), b); });
  $('#f-grup').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) toggle(f.kapaliG, Number(b.dataset.g), b); });
  $('#f-kat').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) toggle(f.kapaliK, Number(b.dataset.k), b); });
  $('#f-ara').addEventListener('input', U.debounce(e => { f.ara = e.target.value; filtreRozet(); panelSonucCiz(); }, 250));
  $('#f-sifirla').addEventListener('click', () => {
    f.kapaliY.clear(); f.kapaliK.clear(); f.kapaliG.clear(); f.ara = ''; fpanelCiz(); panelSonucCiz();
  });
}

function kpi(etiket, deger, deltaHtml, spark, alt, ikon, renk) {
  return `<div class="kpi" style="--c:${renk}"><div class="kpi-top"><span class="ico">${ic(ikon)}</span>${spark ? `<span class="spark" data-spark="${spark}"></span>` : ''}</div>
    <div><div class="label">${etiket}</div><div class="value">${deger}</div></div>
    <div class="foot">${deltaHtml || ''}${alt ? `<span class="alt">${alt}</span>` : ''}</div></div>`;
}
function delta(cur, prev, iyiYukari) {
  if (!prev) return '';
  const p = (cur - prev) / Math.abs(prev) * 100;
  if (Math.abs(p) < 0.05) return '<span class="delta flat" title="Önceki döneme göre">%0</span>';
  const yukari = p > 0, iyi = yukari === iyiYukari;
  return `<span class="delta ${iyi ? 'good' : 'bad'}" title="Önceki döneme göre">${yukari ? '▲' : '▼'} %${U.yuzde(Math.abs(p))}</span>`;
}
function grafikKarti(id, baslik, alt, tabloVar = true) {
  return `<div class="card chart-card" id="${id}">
    <div class="chart-head"><div><div class="chart-title">${baslik}</div><div class="chart-sub">${alt}</div></div>
    ${tabloVar ? `<button class="btn sm ghost tbl-toggle" type="button">${ic('list')}Tablo</button>` : ''}</div>
    <div class="chart-body"></div><div class="chart-table" hidden></div></div>`;
}
function tabloHTML(basliklar, satirlar, toplam) {
  const th = basliklar.map((b, i) => `<th class="${i ? 'num' : ''}">${esc(b)}</th>`).join('');
  const tr = satirlar.map(s => `<tr>${s.map((c, i) => `<td class="${i ? 'num' : ''}">${i ? U.para(c) : esc(c)}</td>`).join('')}</tr>`).join('');
  const tf = toplam ? `<tfoot><tr>${toplam.map((c, i) => `<td class="${i ? 'num' : ''}">${i ? U.para(c) : esc(c)}</td>`).join('')}</tr></tfoot>` : '';
  return `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${tr || '<tr><td colspan="9" class="empty-sm">Veri yok</td></tr>'}</tbody>${tf}</table></div>`;
}
const GRAN_AD = { gun: 'Günlük', hafta: 'Haftalık', ay: 'Aylık' };

function panelSonucCiz() {
  const f = S.f; aralikHesapla(f); granCiz();
  const n0 = U.gunFarki(f.bas, f.bit) + 1;
  $('#panel-aralik').textContent = U.aralikMetni(f.bas, f.bit) + (n0 > 1 ? ` · ${GRAN_AD[f.gran].toLocaleLowerCase('tr-TR')} görünüm` : '');
  const R = hesapla(f.bas, f.bit, f.gran, f);
  const n = U.gunFarki(f.bas, f.bit) + 1;
  const oBit = U.gunEkle(f.bas, -1), oBas = U.gunEkle(oBit, -(n - 1));
  const O = hesapla(oBas, oBit, f.gran, f);
  const T = R.T, OT = O.T;
  const kap = $('#panel-sonuc');
  Grafik.temizle();

  if (!S.gelir.length && !S.gider.length) {
    kap.innerHTML = `<div class="card">${bosDurum('chart', 'Henüz kayıt yok', 'İlk gelir veya gider kaydınızı girdiğinizde grafikler burada görünür.', '<div class="actions" style="justify-content:center"><a class="btn primary sm" href="#gelir">Gelir gir</a><a class="btn sm" href="#gider">Gider gir</a></div>')}</div>`;
    return;
  }
  const fmt = v => U.para(v), kfmt = v => U.kisa(v);
  const donemAlt = GRAN_AD[f.gran] + ' · ' + U.aralikMetni(f.bas, f.bit);
  const kdvFarkAd = T.kdvFark >= 0 ? 'Ödenecek (tahmini)' : 'Devreden (tahmini)';
  const netDelta = delta(T.net, OT.net, true);

  kap.innerHTML = `
    <div class="hero">
      <div>
        <div class="label">${ic('wallet')} Net Kâr <span class="hint">· ${U.aralikMetni(f.bas, f.bit)}</span></div>
        <div class="value ${T.net < 0 ? 'neg' : ''}">${fmt(T.net)}</div>
        <div class="meta">${netDelta}${netDelta ? '<span>önceki döneme göre</span>' : ''}${T.gelir ? `<span class="tag">Marj %${U.yuzde(T.marj)}</span>` : ''}</div>
      </div>
      <div class="aside"><div class="spark" data-spark="net"></div>
        <div class="mini"><div><div class="l">Net tahsilat</div><div class="v">${fmt(T.netTahsilat)}</div></div><div><div class="l">Giderler</div><div class="v">${fmt(T.gider)}</div></div></div></div>
    </div>
    <div class="kpis">
      ${kpi('Brüt Gelir', fmt(T.gelir), delta(T.gelir, OT.gelir, true), 'gelir', '', 'gelir', cv('--s1'))}
      ${kpi('Giderler', fmt(T.gider), delta(T.gider, OT.gider, false), 'gider', '', 'gider', cv('--s2'))}
      ${kpi('Komisyon', fmt(T.komisyon), delta(T.komisyon, OT.komisyon, false), null, T.gelir ? `Gelirin %${U.yuzde(T.komisyon / T.gelir * 100)}'i` : '', 'percent', cv('--s7'))}
      ${kpi('Hesaplanan KDV', fmt(T.kdv), delta(T.kdv, OT.kdv, false), null, `${kdvFarkAd}: ${fmt(Math.abs(T.kdvFark))}`, 'receipt', cv('--s3'))}
      ${kpi('Günlük Ort. Gelir', fmt(T.gunlukOrt), delta(T.gunlukOrt, OT.gunlukOrt, true), null, `${T.kayitliGun} kayıtlı gün`, 'calendar', cv('--accent'))}
    </div>
    <div class="sec-h">Genel bakış</div>
    <div class="grid-2">
      ${grafikKarti('g-gelirgider', 'Gelir ve Gider', donemAlt)}
      ${grafikKarti('g-net', 'Net Kâr', 'Gelir − komisyon − gider · ' + GRAN_AD[f.gran].toLocaleLowerCase('tr-TR'))}
    </div>
    <div class="sec-h">Dağılımlar</div>
    <div class="grid-2">
      ${grafikKarti('g-yontem', 'Gelir Dağılımı', 'Ödeme yöntemine göre', false)}
      ${grafikKarti('g-kategori', 'Gider Dağılımı', 'Kategori ve gruba göre', false)}
    </div>
    <div class="sec-h">Trend ve kesintiler</div>
    <div class="grid-2">
      ${grafikKarti('g-yontemTrend', 'Ödeme Yöntemi Trendi', donemAlt)}
      ${grafikKarti('g-kesinti', 'Kesintiler', 'Komisyon ve hesaplanan KDV · ' + GRAN_AD[f.gran].toLocaleLowerCase('tr-TR'))}
    </div>
    <div class="sec-h">Özet</div>
    <div class="grid-2">
      <div class="card"><h2>Dönem Özeti</h2><div id="ozet-pl"></div></div>
      <div class="card"><h2>Öne Çıkanlar</h2><ul class="hl-list" id="ozet-hl"></ul></div>
    </div>`;

  Grafik.kivilcim($('.hero [data-spark="net"]'), R.D.map(d => d.net), T.net < 0 ? cv('--neg') : cv('--pos'), { W: 160, H: 46, alan: true });
  Grafik.kivilcim($('[data-spark="gelir"]'), R.D.map(d => d.gelir), cv('--s1'));
  Grafik.kivilcim($('[data-spark="gider"]'), R.D.map(d => d.gider), cv('--s2'));

  const etik = R.D.map(d => ({ kisa: d.kisa, uzun: d.uzun }));
  const donemAd = R.D.map(d => f.gran === 'gun' ? U.tarihTR(d.key, 'gun') : d.uzun.replace(' haftası', ''));

  Grafik.donem($('#g-gelirgider .chart-body'), {
    tur: 'cubuk', etiketler: etik, format: fmt, kisaFormat: kfmt,
    seriler: [{ ad: 'Gelir', renk: cv('--s1'), veri: R.D.map(d => d.gelir) }, { ad: 'Gider', renk: cv('--s2'), veri: R.D.map(d => d.gider) }],
    ekBilgi: i => `Net: ${fmt(R.D[i].net)}`,
  });
  $('#g-gelirgider .chart-table').innerHTML = tabloHTML(['Dönem', 'Gelir', 'Gider', 'Net'], R.D.map((d, i) => [donemAd[i], d.gelir, d.gider, d.net]), ['Toplam', T.gelir, T.gider, T.net]);

  Grafik.donem($('#g-net .chart-body'), {
    tur: 'cubuk', etiketler: etik, format: fmt, kisaFormat: kfmt, legend: false, etiketle: 'max',
    seriler: [{ ad: 'Net Kâr', renk: cv('--pos'), negRenk: cv('--neg'), veri: R.D.map(d => d.net) }],
    ekBilgi: i => `Gelir ${fmt(R.D[i].gelir)} · Komisyon ${fmt(R.D[i].komisyon)} · Gider ${fmt(R.D[i].gider)}`,
  });
  $('#g-net .chart-table').innerHTML = tabloHTML(['Dönem', 'Net Kâr', 'Komisyon'], R.D.map((d, i) => [donemAd[i], d.net, d.komisyon]), ['Toplam', T.net, T.komisyon]);

  Grafik.yatay($('#g-yontem .chart-body'), {
    format: fmt,
    satirlar: R.yontemler.map(y => ({ ad: y.ad, alt: y.komisyon ? `Komisyon ${U.para(y.komisyon)} (%${U.yuzde(y.komisyon_orani)})` : 'Komisyonsuz', deger: y.tutar, renk: Grafik.renk(y.renk), pay: y.pay })),
  });
  {
    const turToplam = {};
    for (const y of R.yontemler) turToplam[y.tur] = (turToplam[y.tur] || 0) + y.tutar;
    const turler = Object.keys(turToplam);
    const ek = [];
    if (turler.length && turler.length < R.yontemler.length)
      ek.push('<b>Türe göre:</b> ' + turler.map(t => `${esc(TUR_AD[t] || t)} ${U.para(turToplam[t])} (%${U.yuzde(turToplam[t] / T.gelir * 100)})`).join(' · '));
    ek.push(`<b>Net tahsilat:</b> ${fmt(T.netTahsilat)} (komisyon düşülmüş)`);
    $('#g-yontem .chart-body').insertAdjacentHTML('afterend', `<div class="chart-note">${ek.join('<br>')}</div>`);
  }
  {
    const ilk = R.kategoriler.slice(0, 8);
    const kalan = R.kategoriler.slice(8);
    const satirlar = ilk.map(k => ({ ad: k.ad, alt: `${k.grup_ad} · ${k.adet} kayıt`, deger: k.tutar, renk: cv('--s2'), pay: k.pay }));
    if (kalan.length) { const t = kalan.reduce((a, k) => a + k.tutar, 0); satirlar.push({ ad: `Diğer (${kalan.length} kategori)`, deger: t, renk: cv('--s0'), pay: T.gider ? t / T.gider * 100 : 0 }); }
    Grafik.yatay($('#g-kategori .chart-body'), { format: fmt, satirlar });
    $('#g-kategori .chart-body').insertAdjacentHTML('afterend', `<div class="sub-h">Gruba göre</div><div id="g-grup"></div>`);
    Grafik.yatay($('#g-grup'), { format: fmt, satirlar: R.gruplar.map(g => ({ ad: g.ad, deger: g.tutar, renk: cv('--s2'), pay: g.pay })) });
  }
  {
    const ys = S.yontemler.filter(y => R.yontemler.some(r => r.id === y.id));
    Grafik.donem($('#g-yontemTrend .chart-body'), {
      tur: 'cubuk', yigin: true, etiketler: etik, format: fmt, kisaFormat: kfmt,
      seriler: ys.map(y => ({ ad: y.ad, renk: Grafik.renk(y.renk), veri: R.D.map(d => d.yontem[y.id] || 0) })),
    });
    $('#g-yontemTrend .chart-table').innerHTML = tabloHTML(['Dönem', ...ys.map(y => y.ad), 'Toplam'],
      R.D.map((d, i) => [donemAd[i], ...ys.map(y => d.yontem[y.id] || 0), d.gelir]),
      ['Toplam', ...ys.map(y => (R.yontemler.find(r => r.id === y.id) || {}).tutar || 0), T.gelir]);
  }
  Grafik.donem($('#g-kesinti .chart-body'), {
    tur: 'cubuk', etiketler: etik, format: fmt, kisaFormat: kfmt,
    seriler: [{ ad: 'Komisyon', renk: cv('--s7'), veri: R.D.map(d => d.komisyon) }, { ad: 'Hesaplanan KDV', renk: cv('--s3'), veri: R.D.map(d => d.kdv) }],
  });
  $('#g-kesinti .chart-table').innerHTML = tabloHTML(['Dönem', 'Komisyon', 'Hesaplanan KDV', 'İndirilecek KDV'], R.D.map((d, i) => [donemAd[i], d.komisyon, d.kdv, d.kdvInd]), ['Toplam', T.komisyon, T.kdv, T.kdvInd]);

  const pl = (ad, deger, cls = '') => `<tr class="${cls}"><td>${ad}</td><td class="num ${deger < 0 ? 'neg' : ''}">${U.para(deger)}</td></tr>`;
  $('#ozet-pl').innerHTML = `<table class="pl"><tbody>
    ${pl('Brüt gelir (ciro)', T.gelir)}
    ${pl('− Komisyon (banka / yemek kartı)', -T.komisyon)}
    ${pl('= Net tahsilat', T.netTahsilat, 'total')}
    ${pl('− Giderler', -T.gider)}
    ${pl('= Net kâr', T.net, 'total sep')}
    ${pl('Hesaplanan KDV (satışlardaki)', T.kdv)}
    ${pl('− İndirilecek KDV (giderlerdeki)', -T.kdvInd)}
    ${pl(T.kdvFark >= 0 ? '= Ödenecek KDV (tahmini)' : '= Devreden KDV (tahmini)', Math.abs(T.kdvFark), 'total')}
    ${pl('KDV sonrası tahmini kâr', T.netKdvSonrasi, 'total sep')}
  </tbody></table>
  <p class="hint" style="margin-top:8px">KDV, fiyatlara dahil varsayılarak hesaplanır (tutar × oran ÷ (100 + oran)). Kesin beyan için muhasebecinize danışın.</p>`;

  const km = katMap();
  const hl = [];
  hl.push(['Kayıtlı gün', `${T.kayitliGun} / ${T.gunSayisi}`]);
  if (R.enIyiGun) hl.push(['En yüksek gelir günü', `${U.tarihTR(R.enIyiGun.tarih, 'gun')} · ${U.para(R.enIyiGun.tutar)}`]);
  if (R.enKotuGun && T.kayitliGun > 1) hl.push(['En düşük gelir günü', `${U.tarihTR(R.enKotuGun.tarih, 'gun')} · ${U.para(R.enKotuGun.tutar)}`]);
  if (R.enYuksekGider) hl.push(['En büyük gider', `${esc((km[R.enYuksekGider.kategori_id] || {}).ad || '?')} · ${U.tarihTR(R.enYuksekGider.tarih, 'kisa')} · ${U.para(R.enYuksekGider.tutar)}`]);
  if (T.gelir) hl.push(['Gider / gelir oranı', `%${U.yuzde(T.gider / T.gelir * 100)}`]);
  if (T.gelir) hl.push(['Komisyon / gelir oranı', `%${U.yuzde(T.komisyon / T.gelir * 100)}`]);
  hl.push(['Gider kaydı', `${T.giderAdet} adet`]);
  if (T.gunSayisi) hl.push(['Günlük ortalama gider', U.para(T.gider / T.gunSayisi)]);
  if (OT.gelir || OT.gider) hl.push(['Önceki dönem', `${U.aralikMetni(oBas, oBit)}: gelir ${U.para(OT.gelir)}, gider ${U.para(OT.gider)}`]);
  $('#ozet-hl').innerHTML = hl.map(([a, b]) => `<li><span>${a}</span><b>${b}</b></li>`).join('');

  kap.onclick = (e) => {
    const b = e.target.closest('.tbl-toggle'); if (!b) return;
    const kart = b.closest('.chart-card');
    const body = $('.chart-body', kart), tbl = $('.chart-table', kart), leg = $('.chart-legend', kart);
    const tabloAcik = tbl.hidden;
    body.hidden = tabloAcik; tbl.hidden = !tabloAcik; if (leg) leg.hidden = tabloAcik;
    b.innerHTML = tabloAcik ? `${ic('chart')}Grafik` : `${ic('list')}Tablo`;
  };
}

/* ------------------------------------------------------------------ */
/* KAYIT LİSTESİ filtreleri (Gelir ve Gider sayfalarında ortak)        */
/* ------------------------------------------------------------------ */
function listeAralik(L) {
  const t = U.bugun();
  switch (L.on) {
    case 'buAy': L.bas = U.ayBasi(t); L.bit = t; break;
    case 'gecenAy': { const ob = U.gunEkle(U.ayBasi(t), -1); L.bas = U.ayBasi(ob); L.bit = ob; break; }
    case 'son30': L.bas = U.gunEkle(t, -29); L.bit = t; break;
    case 'buYil': L.bas = t.slice(0, 4) + '-01-01'; L.bit = t; break;
    case 'tumu': {
      const hepsi = [...S.gelir.map(g => g.tarih), ...S.gider.map(g => g.tarih)];
      L.bas = hepsi.length ? hepsi.reduce((a, b) => a < b ? a : b) : U.ayBasi(t);
      L.bit = hepsi.length ? hepsi.reduce((a, b) => a > b ? a : b) : t;
      if (L.bit < t) L.bit = t;
      break;
    }
    default: break; /* özel aralık: değerler korunur */
  }
}
function listeFiltreHTML(L, ek = '') {
  return `<div class="chips">${LISTE_ONAYAR.map(([k, a]) => `<button type="button" class="chip${L.on === k ? ' on' : ''}" data-on="${k}">${a}</button>`).join('')}</div>
    <div class="v-filters">
      <input type="date" data-lf="bas" value="${L.bas}" aria-label="Başlangıç"><input type="date" data-lf="bit" value="${L.bit}" aria-label="Bitiş">
      <input type="search" data-lf="ara" placeholder="Açıklamada ara" value="${esc(L.ara)}">
      <select data-lf="sirala" aria-label="Sıralama">${SIRALAMALAR.map(([k, a]) => `<option value="${k}" ${L.sirala === k ? 'selected' : ''}>${a}</option>`).join('')}</select>
      ${ek}
    </div>`;
}
function listeFiltreBagla(kap, L, yenile) {
  kap.addEventListener('click', e => {
    const b = e.target.closest('[data-on]'); if (!b) return;
    L.on = b.dataset.on; listeAralik(L);
    $('[data-lf="bas"]', kap).value = L.bas; $('[data-lf="bit"]', kap).value = L.bit;
    $$('[data-on]', kap).forEach(x => x.classList.toggle('on', x === b));
    yenile();
  });
  const tarihDegisti = () => {
    const b = $('[data-lf="bas"]', kap).value, t = $('[data-lf="bit"]', kap).value;
    if (!U.gecerliTarih(b) || !U.gecerliTarih(t)) return;
    L.on = 'ozel'; L.bas = b <= t ? b : t; L.bit = b <= t ? t : b;
    $$('[data-on]', kap).forEach(x => x.classList.remove('on'));
    yenile();
  };
  $('[data-lf="bas"]', kap).addEventListener('change', tarihDegisti);
  $('[data-lf="bit"]', kap).addEventListener('change', tarihDegisti);
  $('[data-lf="ara"]', kap).addEventListener('input', U.debounce(e => { L.ara = e.target.value; yenile(); }, 200));
  $$('select[data-lf]', kap).forEach(s => s.addEventListener('change', e => { L[e.target.dataset.lf] = e.target.value; yenile(); }));
}
function sirala(arr, mod, tarihF, tutarF) {
  const yon = mod.endsWith('+') ? 1 : -1;
  const f = mod.startsWith('tutar') ? tutarF : tarihF;
  arr.sort((a, b) => { const x = f(a), y = f(b); return x < y ? -yon : x > y ? yon : 0; });
  return arr;
}

/* ------------------------------------------------------------------ */
/* GELİR                                                               */
/* ------------------------------------------------------------------ */
function gelirGoster() {
  const L = S.gelirListe; if (!L.bas) listeAralik(L);
  $('#icerik').innerHTML = `
    <div class="page-head"><div><h1>Gelir</h1><div class="sub">Günlük tahsilatı ödeme yöntemine göre girin</div></div></div>
    <div class="grid-2 top">
      <div class="card" id="gelir-form-kart"></div>
      <div class="card" id="gelir-kayit-kart">
        <div class="form-head"><h2><span class="h-ico">${ic('list')}</span>Kayıtlar</h2><a class="btn sm ghost" id="gelir-csv" href="#">${ic('download')}CSV</a></div>
        <div id="gelir-filtre">${listeFiltreHTML(L)}</div>
        <div class="v-summary" id="gelir-ozet"></div>
        <div class="list" id="gelir-liste"></div>
        <div class="daha" id="gelir-daha"></div>
      </div>
    </div>`;
  listeFiltreBagla($('#gelir-filtre'), L, () => gelirListeCiz());
  $('#gelir-kayit-kart').addEventListener('click', e => {
    const sil = e.target.closest('[data-gsil]'); if (sil) return gelirSil(sil.dataset.gsil);
    if (e.target.closest('[data-daha]')) { L.limit += LISTE_ADIM; gelirListeCiz(false); return; }
    const it = e.target.closest('[data-tarih]'); if (!it) return;
    S.gelirForm.tarih = it.dataset.tarih; gelirFormCiz();
    $('#gelir-form-kart').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  gelirFormCiz(); gelirListeCiz();
}
function gelirFormCiz() {
  const t = S.gelirForm.tarih;
  const mevcut = S.gelir.find(g => g.tarih === t);
  const kalem = {}; (mevcut ? mevcut.kalemler : []).forEach(k => { kalem[k.yontem_id] = k; });
  const yontemler = S.yontemler.filter(y => y.aktif || kalem[y.id]);
  const kart = $('#gelir-form-kart'); if (!kart) return;
  kart.innerHTML = `
    <div class="form-head"><h2><span class="h-ico">${ic('wallet')}</span>Günlük Gelir Girişi</h2>${mevcut ? '<span class="badge">Kayıt var · düzenleniyor</span>' : ''}</div>
    <div class="date-nav"><button class="btn icon" id="g-onceki" type="button" aria-label="Önceki gün">${ic('chevL')}</button>
      <input type="date" id="g-tarih" value="${t}"><button class="btn icon" id="g-sonraki" type="button" aria-label="Sonraki gün">${ic('chevR')}</button></div>
    <div class="date-label">${U.tarihTR(t, 'uzun')}${t === U.bugun() ? ' · bugün' : ''}</div>
    <div class="form-grid">
      ${yontemler.map(y => {
        const k = kalem[y.id]; const kom = k ? k.komisyon_orani : y.komisyon_orani; const kdv = k ? k.kdv_orani : S.ayar.kdv_orani;
        return `<div class="field"><label for="y-${y.id}"><span class="dot" style="--c:${Grafik.renk(y.renk)}"></span>${esc(y.ad)} <span class="hint">${kom ? 'komisyon %' + U.yuzde(kom) : 'komisyonsuz'}${y.aktif ? '' : ' · pasif'}</span></label>
          <div class="money"><input id="y-${y.id}" data-y="${y.id}" data-kom="${kom}" data-kdv="${kdv}" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${U.sayiYaz(k ? k.tutar : 0)}"></div></div>`;
      }).join('')}
    </div>
    ${yontemler.length ? '' : '<p class="muted">Aktif ödeme yöntemi yok. Ayarlar sayfasından ekleyin.</p>'}
    <div class="field"><label for="g-aciklama">Açıklama <span class="hint">isteğe bağlı</span></label><input id="g-aciklama" type="text" placeholder="örn. yağmurlu gün, düğün siparişi" value="${esc(mevcut ? mevcut.aciklama : '')}"></div>
    <div class="summary" id="g-ozet"></div>
    <div class="actions"><button class="btn primary" id="g-kaydet" type="button">${ic('check')}${mevcut ? 'Güncelle' : 'Kaydet'}</button>
      ${mevcut ? `<button class="btn danger" id="g-sil" type="button">${ic('trash')}Günü sil</button>` : ''}</div>`;
  const tarihDegis = (yeni) => { if (!U.gecerliTarih(yeni)) return; S.gelirForm.tarih = yeni; gelirFormCiz(); };
  $('#g-tarih').addEventListener('change', e => tarihDegis(e.target.value));
  $('#g-onceki').addEventListener('click', () => tarihDegis(U.gunEkle(S.gelirForm.tarih, -1)));
  $('#g-sonraki').addEventListener('click', () => tarihDegis(U.gunEkle(S.gelirForm.tarih, 1)));
  kart.addEventListener('input', e => { if (e.target.dataset.y) gelirOzetGuncelle(); });
  kart.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'date') { e.preventDefault(); gelirKaydet(); } });
  $('#g-kaydet').addEventListener('click', gelirKaydet);
  if (mevcut) $('#g-sil').addEventListener('click', () => gelirSil(t));
  gelirOzetGuncelle();
}
function gelirKalemleriOku() {
  return $$('#gelir-form-kart input[data-y]').map(i => ({ yontem_id: Number(i.dataset.y), tutar: U.tutarOku(i.value), komisyon_orani: Number(i.dataset.kom) || 0, kdv_orani: Number(i.dataset.kdv) || 0 }));
}
function gelirOzetGuncelle() {
  const ks = gelirKalemleriOku();
  let toplam = 0, kom = 0, kdv = 0;
  for (const k of ks) { toplam += k.tutar; kom += k.tutar * k.komisyon_orani / 100; kdv += k.kdv_orani ? k.tutar * k.kdv_orani / (100 + k.kdv_orani) : 0; }
  $('#g-ozet').innerHTML = [['Toplam', toplam, false], ['Komisyon', kom, true], ['KDV (dahil)', kdv, true], ['Net tahsilat', toplam - kom, true]]
    .map(([l, v, kurus]) => `<div><div class="l">${l}</div><div class="v">${U.para(v, kurus && v % 1 !== 0)}</div></div>`).join('');
}
async function gelirKaydet() {
  const t = $('#g-tarih').value;
  if (!U.gecerliTarih(t)) return toast('Geçerli bir tarih seçin', 'hata');
  const kalemler = gelirKalemleriOku();
  const aciklama = $('#g-aciklama').value;
  if (!kalemler.some(k => k.tutar > 0) && !aciklama.trim()) return toast('En az bir tutar girin', 'hata');
  mesgul(true);
  try {
    await api('/api/gelir/' + t, { method: 'PUT', body: { aciklama, kalemler } });
    await veriYukle();
    toast(U.tarihTR(t, 'orta') + ' kaydedildi');
    S.gelirForm.tarih = t; gelirFormCiz(); gelirListeCiz(false);
  } catch (e) { toast(e.message, 'hata'); } finally { mesgul(false); }
}
async function gelirSil(t) {
  const ok = await modal({ baslik: 'Günü sil', govde: `<p><b>${U.tarihTR(t, 'uzun')}</b> tarihli gelir kaydı tamamen silinecek.</p>`, onay: 'Sil', tehlike: true });
  if (!ok) return;
  try {
    await api('/api/gelir/' + t, { method: 'DELETE' }); await veriYukle(); toast('Silindi');
    if (S.sayfa === 'gelir') { gelirFormCiz(); gelirListeCiz(false); }
  } catch (e) { toast(e.message, 'hata'); }
}
function gelirListeCiz(sifirla = true) {
  const kap = $('#gelir-liste'); if (!kap) return;
  const L = S.gelirListe; if (sifirla) L.limit = LISTE_ADIM;
  const ym = yontemMap();
  const ara = U.kucuk(L.ara.trim());
  const satirlar = S.gelir.filter(g => g.tarih >= L.bas && g.tarih <= L.bit && (!ara || U.kucuk(g.aciklama).includes(ara)))
    .map(g => ({ g,
      toplam: g.kalemler.reduce((a, k) => a + k.tutar, 0),
      kom: g.kalemler.reduce((a, k) => a + k.tutar * k.komisyon_orani / 100, 0),
      kdv: g.kalemler.reduce((a, k) => a + (k.kdv_orani ? k.tutar * k.kdv_orani / (100 + k.kdv_orani) : 0), 0) }));
  sirala(satirlar, L.sirala, r => r.g.tarih, r => r.toplam);
  const T = { toplam: 0, kom: 0, kdv: 0 };
  satirlar.forEach(r => { T.toplam += r.toplam; T.kom += r.kom; T.kdv += r.kdv; });
  const gorunen = satirlar.slice(0, L.limit);
  $('#gelir-ozet').innerHTML = `<span><b>${satirlar.length}</b> gün</span><span>Toplam <b>${U.para(T.toplam)}</b></span><span>Komisyon <b>${U.para(T.kom)}</b></span><span>KDV <b>${U.para(T.kdv)}</b></span><span>Net <b>${U.para(T.toplam - T.kom)}</b></span>`;
  kap.innerHTML = gorunen.map(({ g, toplam, kom }) => `<div class="item clickable" data-tarih="${g.tarih}" title="Düzenlemek için tıklayın">
      ${tarihAvatar(g.tarih)}
      <div class="body"><div class="t">${U.tarihTR(g.tarih, 'orta')}${g.aciklama ? ` <span class="hint">${esc(g.aciklama)}</span>` : ''}</div>
      <div class="s">${g.kalemler.filter(k => k.tutar).map(k => `${esc((ym[k.yontem_id] || {}).ad || '?')} ${U.para(k.tutar)}`).join(' · ') || '—'}</div></div>
      <div class="right"><div class="v">${U.para(toplam)}</div><div class="s">${kom ? 'komisyon ' + U.para(kom) : ''}</div></div>
      ${ikonBtn('trash', `data-gsil="${g.tarih}"`, 'ghost del', 'Günü sil')}</div>`).join('')
    || bosDurum('inbox', '', 'Bu aralıkta gelir kaydı yok.');
  const kalan = satirlar.length - gorunen.length;
  $('#gelir-daha').innerHTML = kalan > 0 ? `<button class="btn sm" data-daha type="button">Daha fazla göster (${kalan} kayıt daha)</button>` : '';
  $('#gelir-csv').href = `/api/disa-aktar/gelir.csv?bas=${L.bas}&bit=${L.bit}`;
}

/* ------------------------------------------------------------------ */
/* GİDER                                                               */
/* ------------------------------------------------------------------ */
function kategoriSecenekleri(secili) {
  return S.gruplar.map(g => {
    const ks = S.kategoriler.filter(k => k.grup_id === g.id && (k.aktif || k.id === secili));
    if (!ks.length) return '';
    return `<optgroup label="${esc(g.ad)}">${ks.map(k => `<option value="${k.id}" data-kdv="${k.kdv_orani}" ${k.id === secili ? 'selected' : ''}>${esc(k.ad)}${k.aktif ? '' : ' (pasif)'}</option>`).join('')}</optgroup>`;
  }).join('');
}
function giderGoster() {
  const L = S.giderListe; if (!L.bas) listeAralik(L);
  const ek = `<select data-lf="kat" aria-label="Kategori"><option value="">Tüm kategoriler</option>${S.gruplar.map(g => `<optgroup label="${esc(g.ad)}"><option value="g${g.id}" ${L.kat === 'g' + g.id ? 'selected' : ''}>Tüm ${esc(g.ad)}</option>${S.kategoriler.filter(k => k.grup_id === g.id).map(k => `<option value="${k.id}" ${L.kat === String(k.id) ? 'selected' : ''}>${esc(k.ad)}</option>`).join('')}</optgroup>`).join('')}</select>
    <select data-lf="odeme" aria-label="Ödeme şekli"><option value="">Tüm ödemeler</option>${ODEMELER.map(([k, a]) => `<option value="${k}" ${L.odeme === k ? 'selected' : ''}>${a}</option>`).join('')}</select>`;
  $('#icerik').innerHTML = `
    <div class="page-head"><div><h1>Gider</h1><div class="sub">Harcamaları kategorilere göre kaydedin</div></div></div>
    <div class="grid-2 top">
      <div class="card" id="gider-form-kart"></div>
      <div class="card" id="gider-kayit-kart">
        <div class="form-head"><h2><span class="h-ico">${ic('list')}</span>Kayıtlar</h2><a class="btn sm ghost" id="gider-csv" href="#">${ic('download')}CSV</a></div>
        <div id="gider-filtre">${listeFiltreHTML(L, ek)}</div>
        <div class="v-summary" id="gider-ozet"></div>
        <div class="list" id="gider-liste"></div>
        <div class="daha" id="gider-daha"></div>
      </div>
      <div class="card" id="sabit-kart"></div>
      <div class="card" id="personel-kart"></div>
    </div>`;
  listeFiltreBagla($('#gider-filtre'), L, () => giderListeCiz());
  $('#gider-kayit-kart').addEventListener('click', e => {
    const d = e.target.closest('[data-duzenle]'), s = e.target.closest('[data-sil]');
    if (d) { S.giderForm.duzenleId = Number(d.dataset.duzenle); giderFormCiz(); $('#gider-form-kart').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (s) { const g = S.gider.find(x => x.id === Number(s.dataset.sil)); if (g) giderSilOnay(g); }
    if (e.target.closest('[data-daha]')) { L.limit += LISTE_ADIM; giderListeCiz(false); }
  });
  giderFormCiz(); giderListeCiz(); sabitKartiCiz(); personelKartiCiz();
}
function giderFormCiz() {
  const gf = S.giderForm;
  const duz = gf.duzenleId ? S.gider.find(g => g.id === gf.duzenleId) : null;
  if (gf.duzenleId && !duz) gf.duzenleId = null;
  const km = katMap();
  const ilkKat = S.kategoriler.find(k => k.aktif) || S.kategoriler[0];
  const secili = duz ? duz.kategori_id : (gf.sonKategori || (ilkKat && ilkKat.id));
  const kat = km[secili];
  const kart = $('#gider-form-kart'); if (!kart) return;
  const pers = duz && duz.personel_id ? S.personeller.find(p => p.id === duz.personel_id) : null;
  kart.innerHTML = `
    <div class="form-head"><h2><span class="h-ico">${ic('receipt')}</span>${duz ? 'Gideri Düzenle' : 'Gider Ekle'}</h2>${duz ? `<span class="badge">${duz.sabit_id ? 'sabit gider' : pers ? 'personel · ' + esc(pers.ad) : 'kayıt #' + duz.id}</span>` : ''}</div>
    <div class="form-grid">
      <div class="field"><label for="d-tarih">Tarih</label><input type="date" id="d-tarih" value="${duz ? duz.tarih : gf.tarih}"></div>
      <div class="field"><label for="d-kat">Kategori</label><select id="d-kat">${kategoriSecenekleri(secili)}</select></div>
      <div class="field"><label for="d-tutar">Tutar</label><div class="money"><input id="d-tutar" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${duz ? U.sayiYaz(duz.tutar) : ''}"></div></div>
      <div class="field"><label for="d-kdv">KDV oranı (%) <span class="hint">fişteki oran</span></label><input id="d-kdv" type="text" inputmode="decimal" value="${U.sayiYaz(duz ? duz.kdv_orani : (kat ? kat.kdv_orani : 0)) || '0'}"></div>
    </div>
    <div class="field"><label>Ödeme şekli</label><div class="seg" id="d-odeme">${ODEMELER.map(([k, a]) => `<button type="button" class="${(duz ? duz.odeme : gf.sonOdeme || 'nakit') === k ? 'on' : ''}" data-o="${k}">${a}</button>`).join('')}</div></div>
    <div class="field"><label for="d-aciklama">Açıklama <span class="hint">isteğe bağlı</span></label><input id="d-aciklama" type="text" placeholder="örn. 2 kasa domates, elektrik faturası" value="${esc(duz ? duz.aciklama : '')}"></div>
    <div class="actions"><button class="btn primary" id="d-kaydet" type="button">${ic('check')}${duz ? 'Güncelle' : 'Kaydet'}</button>
      ${duz ? `<button class="btn" id="d-iptal" type="button">İptal</button><button class="btn danger right" id="d-sil" type="button">${ic('trash')}Sil</button>` : ''}</div>`;
  $('#d-kat').addEventListener('change', e => { const o = e.target.selectedOptions[0]; if (o) $('#d-kdv').value = U.sayiYaz(Number(o.dataset.kdv)) || '0'; });
  $('#d-odeme').addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (!b) return; $$('#d-odeme button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#d-kaydet').addEventListener('click', giderKaydet);
  kart.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'date') { e.preventDefault(); giderKaydet(); } });
  if (duz) {
    $('#d-iptal').addEventListener('click', () => { gf.duzenleId = null; if (location.hash.startsWith('#gider/')) location.hash = '#gider'; else giderFormCiz(); });
    $('#d-sil').addEventListener('click', () => giderSilOnay(duz));
  }
  if (!duz) setTimeout(() => { const t = $('#d-tutar'); if (t && window.innerWidth >= 900) t.focus(); }, 50);
}
async function giderKaydet() {
  const gf = S.giderForm;
  const odemeBtn = $('#d-odeme .on');
  const body = {
    tarih: $('#d-tarih').value, kategori_id: Number($('#d-kat').value), tutar: U.tutarOku($('#d-tutar').value),
    kdv_orani: U.tutarOku($('#d-kdv').value), odeme: odemeBtn ? odemeBtn.dataset.o : 'nakit', aciklama: $('#d-aciklama').value,
  };
  if (!U.gecerliTarih(body.tarih)) return toast('Geçerli bir tarih seçin', 'hata');
  if (!body.kategori_id) return toast('Kategori seçin', 'hata');
  if (!(body.tutar > 0)) return toast('Tutar sıfırdan büyük olmalı', 'hata');
  const duz = gf.duzenleId ? S.gider.find(g => g.id === gf.duzenleId) : null;
  body.sabit_id = duz ? (duz.sabit_id || null) : null;
  body.personel_id = duz ? (duz.personel_id || null) : null;
  mesgul(true);
  try {
    if (gf.duzenleId) { await api('/api/gider/' + gf.duzenleId, { method: 'PUT', body }); toast('Güncellendi'); gf.duzenleId = null; if (location.hash.startsWith('#gider/')) location.hash = '#gider'; }
    else { await api('/api/gider', { method: 'POST', body }); toast(`${U.para(body.tutar)} gider eklendi`); }
    gf.tarih = body.tarih; gf.sonKategori = body.kategori_id; gf.sonOdeme = body.odeme;
    await veriYukle();
    if (S.sayfa === 'gider') giderSayfaYenile();
  } catch (e) { toast(e.message, 'hata'); } finally { mesgul(false); }
}
function giderSayfaYenile() { giderFormCiz(); giderListeCiz(false); sabitKartiCiz(); personelKartiCiz(); }
async function giderSilOnay(g) {
  const km = katMap();
  const ok = await modal({ baslik: 'Gideri sil', govde: `<p><b>${esc((km[g.kategori_id] || {}).ad || '')}</b> · ${U.tarihTR(g.tarih, 'orta')} · <b>${U.para(g.tutar)}</b>${g.aciklama ? `<br><span class="muted">${esc(g.aciklama)}</span>` : ''}</p><p>Bu kayıt silinecek.</p>`, onay: 'Sil', tehlike: true });
  if (!ok) return;
  try {
    await api('/api/gider/' + g.id, { method: 'DELETE' }); await veriYukle(); toast('Silindi');
    if (S.giderForm.duzenleId === g.id) { S.giderForm.duzenleId = null; if (location.hash.startsWith('#gider/')) location.hash = '#gider'; }
    if (S.sayfa === 'gider') giderSayfaYenile();
  } catch (e) { toast(e.message, 'hata'); }
}
function giderListeCiz(sifirla = true) {
  const kap = $('#gider-liste'); if (!kap) return;
  const L = S.giderListe; if (sifirla) L.limit = LISTE_ADIM;
  const km = katMap();
  const ara = U.kucuk(L.ara.trim());
  const satirlar = S.gider.filter(g => {
    if (g.tarih < L.bas || g.tarih > L.bit) return false;
    const k = km[g.kategori_id] || {};
    if (L.kat) { if (L.kat.startsWith('g')) { if (String(k.grup_id) !== L.kat.slice(1)) return false; } else if (String(g.kategori_id) !== L.kat) return false; }
    if (L.odeme && g.odeme !== L.odeme) return false;
    if (ara && !U.kucuk(g.aciklama).includes(ara) && !U.kucuk(k.ad).includes(ara)) return false;
    return true;
  }).map(g => ({ g, k: km[g.kategori_id] || {}, kdv: g.kdv_orani ? g.tutar * g.kdv_orani / (100 + g.kdv_orani) : 0 }));
  sirala(satirlar, L.sirala, r => r.g.tarih + String(r.g.id).padStart(8, '0'), r => r.g.tutar);
  let toplam = 0, kdvT = 0; satirlar.forEach(r => { toplam += r.g.tutar; kdvT += r.kdv; });
  const gorunen = satirlar.slice(0, L.limit);
  $('#gider-ozet').innerHTML = `<span><b>${satirlar.length}</b> kayıt</span><span>Toplam <b>${U.para(toplam)}</b></span><span>İndirilecek KDV <b>${U.para(kdvT)}</b></span>`;
  kap.innerHTML = gorunen.map(({ g, k }) => `<div class="item">${harfAvatar(k.ad, g.personel_id ? 'good' : g.sabit_id ? 'accent' : '')}
      <div class="body"><div class="t">${esc(k.ad || '?')} <span class="tag">${esc(k.grup_ad || '')}</span>${g.sabit_id ? '<span class="tag">sabit</span>' : ''}</div>
      <div class="s">${U.tarihTR(g.tarih, 'gun')} · ${ODEME_AD[g.odeme] || g.odeme}${g.kdv_orani ? ` · KDV %${U.yuzde(g.kdv_orani)}` : ''}${g.aciklama ? ' · ' + esc(g.aciklama) : ''}</div></div>
      <div class="right"><div class="v">${U.para(g.tutar)}</div><div class="acts">${ikonBtn('edit', `data-duzenle="${g.id}"`, 'ghost', 'Düzenle')}${ikonBtn('trash', `data-sil="${g.id}"`, 'ghost del', 'Sil')}</div></div></div>`).join('')
    || bosDurum('inbox', '', 'Bu aralıkta gider kaydı yok.');
  const kalan = satirlar.length - gorunen.length;
  $('#gider-daha').innerHTML = kalan > 0 ? `<button class="btn sm" data-daha type="button">Daha fazla göster (${kalan} kayıt daha)</button>` : '';
  $('#gider-csv').href = `/api/disa-aktar/gider.csv?bas=${L.bas}&bit=${L.bit}`;
}

/* ------------------------------------------------------------------ */
/* SABİT GİDERLER & PERSONEL (Gider sayfası kartları)                  */
/* ------------------------------------------------------------------ */
function ayBaslik(baslik, ikon) {
  return `<div class="form-head"><h2><span class="h-ico">${ic(ikon)}</span>${baslik}</h2><div class="ay-nav">${ikonBtn('chevL', 'data-ay="-1"', 'ghost', 'Önceki ay')}<span class="ay-ad">${ayEtiketi(S.ay)}</span>${ikonBtn('chevR', 'data-ay="1"', 'ghost', 'Sonraki ay')}</div></div>`;
}
function ayDegistir(n) { S.ay = ayEkle(S.ay, n); sabitKartiCiz(); personelKartiCiz(); }

function sabitKartiCiz() {
  const kap = $('#sabit-kart'); if (!kap) return;
  const km = katMap(); const ay = S.ay;
  const buAy = s => S.gider.find(g => g.sabit_id === s.id && g.tarih.startsWith(ay + '-'));
  const liste = S.sabitler.filter(s => s.aktif || buAy(s));
  const eksik = liste.filter(s => s.aktif && !buAy(s));
  const eksikToplam = eksik.reduce((a, s) => a + s.tutar, 0);
  const toplam = liste.reduce((a, s) => { const g = buAy(s); return a + (g ? g.tutar : s.tutar); }, 0);
  const satir = s => {
    const g = buAy(s); const k = km[s.kategori_id] || {};
    return `<div class="item">${harfAvatar(s.ad, g ? 'good' : '')}<div class="body"><div class="t">${esc(s.ad)} <span class="tag">${esc(k.ad || '?')}</span></div>
      <div class="s">${g ? `✓ ${U.tarihTR(g.tarih, 'gun')} · ${ODEME_AD[g.odeme] || ''}` : `Her ayın ${s.gun}. günü · ${ODEME_AD[s.odeme] || ''}`}</div></div>
      <div class="right"><div class="v">${U.para(g ? g.tutar : s.tutar)}</div><div class="s">${g ? '<span class="pos">oluşturuldu</span>' : 'bekliyor'}</div></div></div>`;
  };
  kap.innerHTML = ayBaslik('Sabit Giderler', 'repeat') + (liste.length
    ? `<div class="list">${liste.map(satir).join('')}</div>
       <div class="actions"><span class="hint">Toplam ${U.para(toplam)}${eksik.length ? ` · eksik ${eksik.length} kayıt (${U.para(eksikToplam)})` : ' · bu ay tamam'}</span>
       ${eksik.length ? `<button class="btn primary sm right" id="sabit-olustur" type="button">${ic('plus')}Eksikleri oluştur</button>` : '<a class="btn sm ghost right" href="#ayarlar">Tanımlar</a>'}</div>`
    : bosDurum('repeat', 'Sabit gider yok', 'Kira, SGK, muhasebe gibi her ay tekrarlayan giderleri bir kez tanımlayın; her ay tek dokunuşla kayda dönüştürün.', `<button class="btn sm primary" id="sabit-tanimla" type="button" style="margin-top:6px">${ic('plus')}Sabit gider tanımla</button>`));
  kap.onclick = async e => {
    const a = e.target.closest('[data-ay]'); if (a) return ayDegistir(Number(a.dataset.ay));
    if (e.target.closest('#sabit-tanimla')) return sabitFormu(null, sabitKartiCiz);
    if (!e.target.closest('#sabit-olustur')) return;
    const ok = await modal({ baslik: 'Sabit giderleri oluştur', onay: 'Oluştur',
      govde: `<p><b>${ayEtiketi(ay)}</b> için ${eksik.length} gider kaydı oluşturulacak (${U.para(eksikToplam)}):</p><ul class="hl-list">${eksik.map(s => `<li><span>${esc(s.ad)}</span><b>${U.para(s.tutar)}</b></li>`).join('')}</ul>` });
    if (!ok) return;
    mesgul(true);
    try { const r = await api('/api/sabit/olustur', { method: 'POST', body: { ay } }); await veriYukle(); toast(`${r.olusturulan} gider kaydı oluşturuldu`); sabitKartiCiz(); giderListeCiz(false); }
    catch (err) { toast(err.message, 'hata'); } finally { mesgul(false); }
  };
}

function personelKartiCiz() {
  const kap = $('#personel-kart'); if (!kap) return;
  const ay = S.ay;
  const pk = personelKategori();
  const odemeler = p => S.gider.filter(g => g.personel_id === p.id && g.tarih.startsWith(ay + '-')).sort((a, b) => a.tarih < b.tarih ? -1 : 1);
  const liste = S.personeller.filter(p => p.aktif || odemeler(p).length);
  let tMaas = 0, tOdenen = 0;
  const rows = liste.map(p => {
    const od = odemeler(p); const odenen = od.reduce((a, g) => a + g.tutar, 0); const kalan = p.maas - odenen;
    if (p.aktif) tMaas += p.maas; tOdenen += odenen;
    const durum = kalan > 0 ? `Kalan <b>${U.para(kalan)}</b>` : kalan < 0 ? `<span class="neg">Fazla ödeme ${U.para(-kalan)}</span>` : '<span class="pos">Ödendi ✓</span>';
    return `<div class="item personel">${adAvatar(p.ad, kalan <= 0 && p.maas ? 'good' : '')}<div class="body"><div class="t">${esc(p.ad)}${p.gorev ? ` <span class="tag">${esc(p.gorev)}</span>` : ''}${p.aktif ? '' : '<span class="tag off">ayrıldı</span>'}</div>
      <div class="s">Maaş ${U.para(p.maas)} · Ödenen ${U.para(odenen)} · ${durum}</div>
      ${od.length ? `<div class="odemeler">${od.map(g => `<span class="odeme-chip">${U.tarihTR(g.tarih, 'kisa')} · ${esc(g.aciklama.split(' · ')[0])} · ${U.para(g.tutar)}<button type="button" class="x" data-osil="${g.id}" aria-label="Ödemeyi sil">×</button></span>`).join('')}</div>` : ''}</div>
      <div class="right"><div class="acts"><button class="btn sm" data-avans="${p.id}" type="button">Avans</button><button class="btn sm ${kalan > 0 ? 'primary' : ''}" data-maas="${p.id}" type="button" ${kalan > 0 ? '' : 'disabled'}>Maaş öde</button></div></div></div>`;
  }).join('');
  kap.innerHTML = ayBaslik('Personel', 'users')
    + (pk ? '' : `<div class="notice">${ic('alert')}<div>Maaş ödemelerinin işleneceği kategori seçili değil. <a href="#ayarlar">Ayarlar → Personel</a> bölümünden seçin.</div></div>`)
    + (liste.length
      ? `<div class="list">${rows}</div><div class="actions"><span class="hint">Toplam maaş ${U.para(tMaas)} · ödenen ${U.para(tOdenen)} · kalan ${U.para(Math.max(0, tMaas - tOdenen))}</span><a class="btn sm ghost right" href="#ayarlar">Personel listesi</a></div>`
      : bosDurum('users', 'Personel yok', 'Çalışanları ekleyin; her ay avans ve maaş ödemelerini buradan tek dokunuşla gider olarak işleyin.', `<button class="btn sm primary" id="personel-ekle" type="button" style="margin-top:6px">${ic('plus')}Personel ekle</button>`));
  kap.onclick = e => {
    const a = e.target.closest('[data-ay]'); if (a) return ayDegistir(Number(a.dataset.ay));
    if (e.target.closest('#personel-ekle')) return personelFormu(null, personelKartiCiz);
    const av = e.target.closest('[data-avans]'), ma = e.target.closest('[data-maas]'), sil = e.target.closest('[data-osil]');
    if (av) personelOdeme(S.personeller.find(p => p.id === Number(av.dataset.avans)), 'Avans');
    else if (ma && !ma.disabled) personelOdeme(S.personeller.find(p => p.id === Number(ma.dataset.maas)), 'Maaş');
    else if (sil) { const g = S.gider.find(x => x.id === Number(sil.dataset.osil)); if (g) giderSilOnay(g); }
  };
}
async function personelOdeme(p, tip) {
  if (!p) return;
  const pk = personelKategori();
  if (!pk) return toast('Önce Ayarlar → Personel bölümünden maaş kategorisini seçin', 'hata');
  const odenen = S.gider.filter(g => g.personel_id === p.id && g.tarih.startsWith(S.ay + '-')).reduce((a, g) => a + g.tutar, 0);
  const kalan = Math.max(0, p.maas - odenen);
  const bugun = U.bugun();
  const tarihVars = bugun.startsWith(S.ay + '-') ? bugun : `${S.ay}-${String(Math.min(Number(bugun.slice(8)), ayGunSayisi(S.ay))).padStart(2, '0')}`;
  await formModal({
    baslik: `${tip} · ${p.ad} · ${ayEtiketi(S.ay)}`, onay: 'Kaydet',
    alanlar: [
      { ad: 'tutar', etiket: 'Tutar', tip: 'number', para: true, deger: tip === 'Maaş' ? U.sayiYaz(kalan) : '', ipucu: tip === 'Maaş' ? `kalan ${U.para(kalan)}` : '' },
      { ad: 'tarih', etiket: 'Tarih', tip: 'date', deger: tarihVars, ipucu: 'ödeme hangi aya aitse o ayın tarihi' },
      { ad: 'odeme', etiket: 'Ödeme şekli', tip: 'select', deger: 'nakit', secenekler: ODEMELER },
      { ad: 'not', etiket: 'Not', ipucu: 'isteğe bağlı', deger: '' },
    ],
    onKaydet: async v => {
      if (!(v.tutar > 0)) throw new Error('Tutar sıfırdan büyük olmalı');
      if (!U.gecerliTarih(v.tarih)) throw new Error('Geçerli bir tarih seçin');
      await api('/api/gider', { method: 'POST', body: { tarih: v.tarih, kategori_id: pk.id, tutar: v.tutar, kdv_orani: 0, odeme: v.odeme,
        aciklama: `${tip} · ${p.ad}${v.not.trim() ? ' · ' + v.not.trim() : ''}`, personel_id: p.id } });
      await veriYukle(); toast(`${p.ad}: ${tip.toLocaleLowerCase('tr-TR')} ${U.para(v.tutar)} işlendi`);
      personelKartiCiz(); giderListeCiz(false);
    },
  });
}

/* ------------------------------------------------------------------ */
/* AYARLAR                                                             */
/* ------------------------------------------------------------------ */
function ayarlarGoster() {
  const gg = S.boot.giris_gerekli;
  const yeni = (id) => `<button class="btn sm" id="${id}" type="button">${ic('plus')}Yeni</button>`;
  $('#icerik').innerHTML = `
    <div class="page-head"><div><h1>Ayarlar</h1><div class="sub">İşletme bilgileri, ödeme yöntemleri, gider sınıfları, personel ve yedekleme</div></div></div>
    <div class="grid-2 top">
      <div class="card"><h2><span class="h-ico">${ic('ayarlar')}</span>Genel</h2>
        <div class="field"><label for="a-ad">İşletme adı</label><input id="a-ad" type="text" value="${esc(S.ayar.isletme_adi || '')}"></div>
        <div class="field"><label for="a-kdv">Satış KDV oranı (%)</label><input id="a-kdv" type="text" inputmode="decimal" value="${U.sayiYaz(S.ayar.kdv_orani) || '0'}"><span class="hint">Yeni gelir kayıtlarında kullanılır. Restoran hizmetlerinde genellikle %10.</span></div>
        <div class="field"><label>Görünüm</label><div class="seg" id="a-tema">${[['sistem', 'Sistem'], ['acik', 'Açık'], ['koyu', 'Koyu']].map(([k, a]) => `<button type="button" class="${(S.ayar.tema || 'sistem') === k ? 'on' : ''}" data-tema="${k}">${a}</button>`).join('')}</div></div>
        <div class="actions"><button class="btn primary" id="a-kaydet" type="button">${ic('check')}Kaydet</button></div>
      </div>
      <div class="card"><h2><span class="h-ico">${ic('lock')}</span>Güvenlik</h2>
        <p class="muted">${gg ? 'Portal şifre ile korunuyor.' : 'Şu an şifre yok. Portalı internete açacaksanız mutlaka şifre belirleyin.'}</p>
        ${gg ? '<div class="field"><label for="s-mevcut">Mevcut şifre</label><input type="password" id="s-mevcut" autocomplete="current-password"></div>' : ''}
        <div class="field"><label for="s-yeni">Yeni şifre</label><input type="password" id="s-yeni" autocomplete="new-password"></div>
        <div class="field"><label for="s-tekrar">Yeni şifre (tekrar)</label><input type="password" id="s-tekrar" autocomplete="new-password"></div>
        <div class="actions"><button class="btn primary" id="s-kaydet" type="button">${ic('check')}Şifreyi kaydet</button>
          ${gg ? '<button class="btn danger" id="s-kaldir" type="button">Şifreyi kaldır</button><button class="btn ghost right" id="s-cikis" type="button">Çıkış yap</button>' : ''}</div>
      </div>
    </div>
    <div class="card"><div class="form-head"><h2><span class="h-ico">${ic('wallet')}</span>Ödeme Yöntemleri</h2>${yeni('y-ekle')}</div>
      <p class="hint" style="margin-bottom:8px">Komisyon oranı, yeni gelir kayıtlarına otomatik uygulanır; eski kayıtlar değişmez.</p><div class="list" id="y-liste"></div></div>
    <div class="card"><div class="form-head"><h2><span class="h-ico">${ic('repeat')}</span>Sabit Giderler</h2>${yeni('sb-ekle')}</div>
      <p class="hint" style="margin-bottom:8px">Her ay tekrarlayan giderler (kira, SGK, muhasebe…). Gider sayfasındaki "Sabit Giderler" kartından ay ay oluşturulur.</p><div class="list" id="sb-liste"></div></div>
    <div class="card"><div class="form-head"><h2><span class="h-ico">${ic('users')}</span>Personel</h2>${yeni('p-ekle')}</div>
      <div class="field"><label for="p-kat">Maaş ve avans ödemeleri şu kategoriye işlenir</label><select id="p-kat"><option value="">Seçin…</option>${kategoriSecenekleri(S.ayar.personel_kategori_id)}</select></div>
      <div class="list" id="p-liste"></div></div>
    <div class="card"><div class="form-head"><h2><span class="h-ico">${ic('list')}</span>Gider Grupları</h2>${yeni('gr-ekle')}</div>
      <p class="hint" style="margin-bottom:8px">Gruplar, kategorileri sınıflandırır (örn. Hammadde, Personel, İşletme).</p><div class="list" id="gr-liste"></div></div>
    <div class="card"><div class="form-head"><h2><span class="h-ico">${ic('receipt')}</span>Gider Kategorileri</h2>${yeni('k-ekle')}</div><div id="k-liste"></div></div>
    <div class="card"><h2><span class="h-ico">${ic('download')}</span>Yedekleme ve Dışa Aktarma</h2>
      <p class="muted">Tüm veriler <code>data/sirkeci.db</code> dosyasında tutulur. Düzenli olarak yedek alın.</p>
      <div class="actions"><a class="btn primary" href="/api/yedek" download>${ic('download')}Yedek indir (JSON)</a>
        <label class="btn danger file-btn">${ic('upload')}Yedekten geri yükle<input type="file" id="yedek-dosya" accept="application/json,.json"></label></div>
      <div class="actions"><a class="btn sm" href="/api/disa-aktar/gelir.csv">${ic('download')}Tüm gelirler (CSV)</a><a class="btn sm" href="/api/disa-aktar/gider.csv">${ic('download')}Tüm giderler (CSV)</a></div>
    </div>
    <div class="card about"><h2>Hakkında</h2><dl><dt>Sürüm</dt><dd>${esc(S.boot.surum)}</dd><dt>Veri</dt><dd>data/sirkeci.db (SQLite)</dd><dt>Kayıt</dt><dd>${S.gelir.length} gelir günü · ${S.gider.length} gider</dd></dl></div>`;

  $('#a-tema').addEventListener('click', async e => {
    const b = e.target.closest('[data-tema]'); if (!b) return;
    $$('#a-tema button').forEach(x => x.classList.toggle('on', x === b));
    temaUygula(b.dataset.tema);
    try { S.ayar = await api('/api/ayar', { method: 'PUT', body: { tema: b.dataset.tema } }); } catch (err) { toast(err.message, 'hata'); }
  });
  $('#a-kaydet').addEventListener('click', async () => {
    try { S.ayar = await api('/api/ayar', { method: 'PUT', body: { isletme_adi: $('#a-ad').value, kdv_orani: U.tutarOku($('#a-kdv').value) } }); navCiz(); navGuncelle(); toast('Kaydedildi'); }
    catch (err) { toast(err.message, 'hata'); }
  });
  $('#s-kaydet').addEventListener('click', () => sifreKaydet(false));
  if (gg) {
    $('#s-kaldir').addEventListener('click', () => sifreKaydet(true));
    $('#s-cikis').addEventListener('click', async () => { await api('/api/cikis', { method: 'POST' }); location.hash = '#panel'; await basla(); });
  }
  $('#y-ekle').addEventListener('click', () => yontemFormu(null));
  $('#sb-ekle').addEventListener('click', () => sabitFormu(null, sabitListeCiz));
  $('#p-ekle').addEventListener('click', () => personelFormu(null, personelListeCiz));
  $('#p-kat').addEventListener('change', async e => {
    const id = Number(e.target.value); if (!id) return;
    try { S.ayar = await api('/api/ayar', { method: 'PUT', body: { personel_kategori_id: id } }); toast('Kaydedildi'); } catch (err) { toast(err.message, 'hata'); }
  });
  $('#gr-ekle').addEventListener('click', () => grupFormu(null));
  $('#k-ekle').addEventListener('click', () => kategoriFormu(null));
  $('#yedek-dosya').addEventListener('change', yedekYukle);
  yontemListeCiz(); sabitListeCiz(); personelListeCiz(); grupListeCiz(); kategoriListeCiz();
}
async function sifreKaydet(kaldir) {
  const mevcut = $('#s-mevcut') ? $('#s-mevcut').value : '';
  const yeni = kaldir ? '' : $('#s-yeni').value;
  if (!kaldir) {
    if (yeni.length < 4) return toast('Şifre en az 4 karakter olmalı', 'hata');
    if (yeni !== $('#s-tekrar').value) return toast('Şifreler eşleşmiyor', 'hata');
  } else {
    const ok = await modal({ baslik: 'Şifreyi kaldır', govde: '<p>Portal şifresiz kalacak; aynı ağdaki herkes erişebilir.</p>', onay: 'Kaldır', tehlike: true });
    if (!ok) return;
  }
  try { await api('/api/sifre', { method: 'PUT', body: { yeni_sifre: yeni, mevcut_sifre: mevcut } }); toast(kaldir ? 'Şifre kaldırıldı' : 'Şifre kaydedildi'); await tanimYukle(); ayarlarGoster(); }
  catch (err) { toast(err.message, 'hata'); }
}
const duzenleSil = (dAttr, sAttr) => `<div class="acts">${ikonBtn('edit', dAttr, 'ghost', 'Düzenle')}${ikonBtn('trash', sAttr, 'ghost del', 'Sil')}</div>`;
function yontemListeCiz() {
  const kap = $('#y-liste'); if (!kap) return;
  kap.innerHTML = S.yontemler.map(y => `<div class="item"><div class="avatar" style="background:${Grafik.renk(y.renk)}20;color:${Grafik.renk(y.renk)}"><span class="dot" style="--c:${Grafik.renk(y.renk)};width:12px;height:12px"></span></div>
    <div class="body"><div class="t">${esc(y.ad)} <span class="tag">${esc(TUR_AD[y.tur] || y.tur)}</span>${y.aktif ? '' : '<span class="tag off">pasif</span>'}</div><div class="s">${y.komisyon_orani ? 'Komisyon %' + U.yuzde(y.komisyon_orani) : 'Komisyonsuz'}</div></div>
    <div class="right">${duzenleSil(`data-yd="${y.id}"`, `data-ys="${y.id}"`)}</div></div>`).join('') || '<div class="empty-sm">Ödeme yöntemi yok.</div>';
  kap.onclick = async e => {
    const d = e.target.closest('[data-yd]'), s = e.target.closest('[data-ys]');
    if (d) yontemFormu(S.yontemler.find(y => y.id === Number(d.dataset.yd)));
    if (s) {
      const y = S.yontemler.find(x => x.id === Number(s.dataset.ys));
      const ok = await modal({ baslik: 'Yöntemi sil', govde: `<p><b>${esc(y.ad)}</b> silinecek. Kayıtlarda kullanılıyorsa silinemez; bunun yerine pasif yapın.</p>`, onay: 'Sil', tehlike: true });
      if (!ok) return;
      try { await api('/api/yontem/' + y.id, { method: 'DELETE' }); await tanimYukle(); toast('Silindi'); yontemListeCiz(); } catch (err) { toast(err.message, 'hata'); }
    }
  };
}
function yontemFormu(y) {
  const sira = y ? y.sira : S.yontemler.length;
  formModal({
    baslik: y ? 'Ödeme yöntemini düzenle' : 'Yeni ödeme yöntemi',
    alanlar: [
      { ad: 'ad', etiket: 'Ad', deger: y ? y.ad : '', yer: 'örn. Multinet' },
      { ad: 'tur', etiket: 'Tür', tip: 'select', deger: y ? y.tur : 'diger', secenekler: TURLER },
      { ad: 'komisyon_orani', etiket: 'Komisyon oranı (%)', tip: 'number', deger: y ? U.sayiYaz(y.komisyon_orani) || '0' : '0', ipucu: 'banka / kart şirketi kesintisi' },
      { ad: 'renk', etiket: 'Grafik rengi', tip: 'renk', deger: y ? y.renk : ((S.yontemler.length % 8) + 1) },
      { ad: 'aktif', etiket: 'Aktif (gelir formunda göster)', tip: 'check', deger: y ? !!y.aktif : true },
    ],
    onKaydet: async v => {
      if (!v.ad.trim()) throw new Error('Ad gerekli');
      const body = { ad: v.ad.trim(), tur: v.tur, komisyon_orani: v.komisyon_orani, renk: v.renk, sira, aktif: v.aktif };
      if (y) await api('/api/yontem/' + y.id, { method: 'PUT', body }); else await api('/api/yontem', { method: 'POST', body });
      await tanimYukle(); toast('Kaydedildi'); yontemListeCiz();
    },
  });
}
function kategoriDuzSecenek(ekId) {
  const ks = S.kategoriler.filter(k => k.aktif || k.id === ekId);
  return ks.map(k => [k.id, `${k.grup_ad} · ${k.ad}${k.aktif ? '' : ' (pasif)'}`]);
}
function sabitListeCiz() {
  const kap = $('#sb-liste'); if (!kap) return;
  const km = katMap();
  kap.innerHTML = S.sabitler.map(s => `<div class="item">${harfAvatar(s.ad, s.aktif ? 'accent' : '')}<div class="body"><div class="t">${esc(s.ad)} <span class="tag">${esc((km[s.kategori_id] || {}).ad || '?')}</span>${s.aktif ? '' : '<span class="tag off">pasif</span>'}</div>
    <div class="s">Her ayın ${s.gun}. günü · ${ODEME_AD[s.odeme] || s.odeme}${s.kdv_orani ? ` · KDV %${U.yuzde(s.kdv_orani)}` : ''}${s.aciklama ? ' · ' + esc(s.aciklama) : ''}</div></div>
    <div class="right"><div class="v">${U.para(s.tutar)}</div>${duzenleSil(`data-sbd="${s.id}"`, `data-sbs="${s.id}"`)}</div></div>`).join('') || '<div class="empty-sm">Henüz sabit gider tanımı yok.</div>';
  kap.onclick = async e => {
    const d = e.target.closest('[data-sbd]'), s = e.target.closest('[data-sbs]');
    if (d) sabitFormu(S.sabitler.find(x => x.id === Number(d.dataset.sbd)), sabitListeCiz);
    if (s) {
      const sb = S.sabitler.find(x => x.id === Number(s.dataset.sbs));
      const ok = await modal({ baslik: 'Sabit gideri sil', govde: `<p><b>${esc(sb.ad)}</b> tanımı silinecek. Daha önce oluşturulmuş gider kayıtları silinmez; kayıt varsa tanım silinemez, pasif yapın.</p>`, onay: 'Sil', tehlike: true });
      if (!ok) return;
      try { await api('/api/sabit/' + sb.id, { method: 'DELETE' }); await tanimYukle(); toast('Silindi'); sabitListeCiz(); } catch (err) { toast(err.message, 'hata'); }
    }
  };
}
function sabitFormu(s, sonra) {
  if (!S.kategoriler.length) return toast('Önce kategori tanımlayın', 'hata');
  const varsayilanKat = (S.kategoriler.find(k => k.ad === 'Kira') || S.kategoriler.find(k => k.aktif) || S.kategoriler[0]).id;
  formModal({
    baslik: s ? 'Sabit gideri düzenle' : 'Yeni sabit gider',
    alanlar: [
      { ad: 'ad', etiket: 'Ad', deger: s ? s.ad : '', yer: 'örn. Dükkan kirası' },
      { ad: 'kategori_id', etiket: 'Kategori', tip: 'select', deger: s ? s.kategori_id : varsayilanKat, secenekler: kategoriDuzSecenek(s ? s.kategori_id : null) },
      { ad: 'tutar', etiket: 'Aylık tutar', tip: 'number', para: true, deger: s ? U.sayiYaz(s.tutar) : '' },
      { ad: 'gun', etiket: 'Ayın kaçıncı günü', tip: 'number', deger: s ? s.gun : 1, ipucu: '1–31; ay kısaysa son güne çekilir' },
      { ad: 'odeme', etiket: 'Ödeme şekli', tip: 'select', deger: s ? s.odeme : 'banka', secenekler: ODEMELER },
      { ad: 'kdv_orani', etiket: 'KDV oranı (%)', tip: 'number', deger: s ? U.sayiYaz(s.kdv_orani) || '0' : '0', ipucu: 'kira için genelde %20; SGK, vergi için 0' },
      { ad: 'aciklama', etiket: 'Açıklama', deger: s ? s.aciklama : '', ipucu: 'isteğe bağlı' },
      { ad: 'aktif', etiket: 'Aktif (her ay oluşturulsun)', tip: 'check', deger: s ? !!s.aktif : true },
    ],
    onKaydet: async v => {
      if (!v.ad.trim()) throw new Error('Ad gerekli');
      if (!(v.tutar > 0)) throw new Error('Tutar sıfırdan büyük olmalı');
      const body = { ad: v.ad.trim(), kategori_id: Number(v.kategori_id), tutar: v.tutar, odeme: v.odeme, gun: Math.max(1, Math.min(31, Math.round(v.gun) || 1)), kdv_orani: v.kdv_orani, aciklama: v.aciklama.trim(), sira: s ? s.sira : S.sabitler.length, aktif: v.aktif };
      if (s) await api('/api/sabit/' + s.id, { method: 'PUT', body }); else await api('/api/sabit', { method: 'POST', body });
      await tanimYukle(); toast('Kaydedildi'); if (sonra) sonra();
    },
  });
}
function personelListeCiz() {
  const kap = $('#p-liste'); if (!kap) return;
  kap.innerHTML = S.personeller.map(p => `<div class="item">${adAvatar(p.ad, p.aktif ? 'good' : '')}<div class="body"><div class="t">${esc(p.ad)}${p.gorev ? ` <span class="tag">${esc(p.gorev)}</span>` : ''}${p.aktif ? '' : '<span class="tag off">ayrıldı</span>'}</div>
    <div class="s">Maaş ${U.para(p.maas)}${p.baslangic ? ' · başlangıç ' + U.tarihTR(p.baslangic, 'orta') : ''}${p.notlar ? ' · ' + esc(p.notlar) : ''}</div></div>
    <div class="right">${duzenleSil(`data-pd="${p.id}"`, `data-ps="${p.id}"`)}</div></div>`).join('') || '<div class="empty-sm">Henüz personel yok.</div>';
  kap.onclick = async e => {
    const d = e.target.closest('[data-pd]'), s = e.target.closest('[data-ps]');
    if (d) personelFormu(S.personeller.find(x => x.id === Number(d.dataset.pd)), personelListeCiz);
    if (s) {
      const p = S.personeller.find(x => x.id === Number(s.dataset.ps));
      const ok = await modal({ baslik: 'Personeli sil', govde: `<p><b>${esc(p.ad)}</b> silinecek. Ödeme kaydı varsa silinemez; bunun yerine "Çalışıyor" işaretini kaldırın.</p>`, onay: 'Sil', tehlike: true });
      if (!ok) return;
      try { await api('/api/personel/' + p.id, { method: 'DELETE' }); await tanimYukle(); toast('Silindi'); personelListeCiz(); } catch (err) { toast(err.message, 'hata'); }
    }
  };
}
function personelFormu(p, sonra) {
  formModal({
    baslik: p ? 'Personeli düzenle' : 'Yeni personel',
    alanlar: [
      { ad: 'ad', etiket: 'Ad Soyad', deger: p ? p.ad : '', yer: 'örn. Ahmet Yılmaz' },
      { ad: 'gorev', etiket: 'Görev', deger: p ? p.gorev : '', yer: 'örn. Usta, Garson, Kurye', ipucu: 'isteğe bağlı' },
      { ad: 'maas', etiket: 'Aylık net maaş', tip: 'number', para: true, deger: p ? U.sayiYaz(p.maas) : '' },
      { ad: 'baslangic', etiket: 'İşe başlama', tip: 'date', deger: p ? p.baslangic : '', ipucu: 'isteğe bağlı' },
      { ad: 'notlar', etiket: 'Not', deger: p ? p.notlar : '', ipucu: 'isteğe bağlı' },
      { ad: 'aktif', etiket: 'Çalışıyor', tip: 'check', deger: p ? !!p.aktif : true },
    ],
    onKaydet: async v => {
      if (!v.ad.trim()) throw new Error('Ad gerekli');
      const body = { ad: v.ad.trim(), gorev: v.gorev.trim(), maas: v.maas, baslangic: v.baslangic || '', notlar: v.notlar.trim(), sira: p ? p.sira : S.personeller.length, aktif: v.aktif };
      if (p) await api('/api/personel/' + p.id, { method: 'PUT', body }); else await api('/api/personel', { method: 'POST', body });
      await tanimYukle(); toast('Kaydedildi'); if (sonra) sonra();
    },
  });
}
function grupListeCiz() {
  const kap = $('#gr-liste'); if (!kap) return;
  kap.innerHTML = S.gruplar.map(g => `<div class="item">${harfAvatar(g.ad)}<div class="body"><div class="t">${esc(g.ad)}</div><div class="s">${S.kategoriler.filter(k => k.grup_id === g.id).length} kategori</div></div>
    <div class="right">${duzenleSil(`data-gd="${g.id}"`, `data-gs="${g.id}"`)}</div></div>`).join('') || '<div class="empty-sm">Grup yok.</div>';
  kap.onclick = async e => {
    const d = e.target.closest('[data-gd]'), s = e.target.closest('[data-gs]');
    if (d) grupFormu(S.gruplar.find(g => g.id === Number(d.dataset.gd)));
    if (s) {
      const g = S.gruplar.find(x => x.id === Number(s.dataset.gs));
      const ok = await modal({ baslik: 'Grubu sil', govde: `<p><b>${esc(g.ad)}</b> silinecek. İçinde kategori varsa önce onları başka gruba taşıyın.</p>`, onay: 'Sil', tehlike: true });
      if (!ok) return;
      try { await api('/api/grup/' + g.id, { method: 'DELETE' }); await tanimYukle(); toast('Silindi'); grupListeCiz(); kategoriListeCiz(); } catch (err) { toast(err.message, 'hata'); }
    }
  };
}
function grupFormu(g) {
  formModal({
    baslik: g ? 'Grubu düzenle' : 'Yeni grup',
    alanlar: [{ ad: 'ad', etiket: 'Grup adı', deger: g ? g.ad : '', yer: 'örn. Hammadde' }],
    onKaydet: async v => {
      if (!v.ad.trim()) throw new Error('Ad gerekli');
      const body = { ad: v.ad.trim(), renk: g ? g.renk : 0, sira: g ? g.sira : S.gruplar.length };
      if (g) await api('/api/grup/' + g.id, { method: 'PUT', body }); else await api('/api/grup', { method: 'POST', body });
      await tanimYukle(); toast('Kaydedildi'); grupListeCiz(); kategoriListeCiz();
    },
  });
}
function kategoriListeCiz() {
  const kap = $('#k-liste'); if (!kap) return;
  kap.innerHTML = S.gruplar.map(g => {
    const ks = S.kategoriler.filter(k => k.grup_id === g.id);
    if (!ks.length) return '';
    return `<div class="k-grup"><h3>${esc(g.ad)}</h3><div class="list">${ks.map(k => `<div class="item"><div class="body"><div class="t">${esc(k.ad)}${k.aktif ? '' : '<span class="tag off">pasif</span>'}</div><div class="s">Varsayılan KDV %${U.yuzde(k.kdv_orani)}</div></div>
      <div class="right">${duzenleSil(`data-kd="${k.id}"`, `data-ks="${k.id}"`)}</div></div>`).join('')}</div></div>`;
  }).join('') || '<div class="empty-sm">Kategori yok.</div>';
  kap.onclick = async e => {
    const d = e.target.closest('[data-kd]'), s = e.target.closest('[data-ks]');
    if (d) kategoriFormu(S.kategoriler.find(k => k.id === Number(d.dataset.kd)));
    if (s) {
      const k = S.kategoriler.find(x => x.id === Number(s.dataset.ks));
      const ok = await modal({ baslik: 'Kategoriyi sil', govde: `<p><b>${esc(k.ad)}</b> silinecek. Gider kayıtlarında kullanılıyorsa silinemez; bunun yerine pasif yapın.</p>`, onay: 'Sil', tehlike: true });
      if (!ok) return;
      try { await api('/api/kategori/' + k.id, { method: 'DELETE' }); await tanimYukle(); toast('Silindi'); kategoriListeCiz(); grupListeCiz(); } catch (err) { toast(err.message, 'hata'); }
    }
  };
}
function kategoriFormu(k) {
  if (!S.gruplar.length) return toast('Önce bir grup ekleyin', 'hata');
  formModal({
    baslik: k ? 'Kategoriyi düzenle' : 'Yeni kategori',
    alanlar: [
      { ad: 'ad', etiket: 'Kategori adı', deger: k ? k.ad : '', yer: 'örn. Baharat' },
      { ad: 'grup_id', etiket: 'Grup', tip: 'select', deger: k ? k.grup_id : S.gruplar[0].id, secenekler: S.gruplar.map(g => [g.id, g.ad]) },
      { ad: 'kdv_orani', etiket: 'Varsayılan KDV oranı (%)', tip: 'number', deger: k ? U.sayiYaz(k.kdv_orani) || '0' : '0', ipucu: 'gider formunda önerilir' },
      { ad: 'aktif', etiket: 'Aktif (gider formunda göster)', tip: 'check', deger: k ? !!k.aktif : true },
    ],
    onKaydet: async v => {
      if (!v.ad.trim()) throw new Error('Ad gerekli');
      const body = { ad: v.ad.trim(), grup_id: Number(v.grup_id), kdv_orani: v.kdv_orani, sira: k ? k.sira : S.kategoriler.length, aktif: v.aktif };
      if (k) await api('/api/kategori/' + k.id, { method: 'PUT', body }); else await api('/api/kategori', { method: 'POST', body });
      await tanimYukle(); toast('Kaydedildi'); kategoriListeCiz(); grupListeCiz();
    },
  });
}
async function yedekYukle(e) {
  const f = e.target.files[0]; if (!f) return;
  let veri;
  try { veri = JSON.parse(await f.text()); } catch (err) { e.target.value = ''; return toast('Dosya okunamadı (JSON değil)', 'hata'); }
  e.target.value = '';
  if (veri.uygulama !== 'sirkeci-kebap-portal' || !Array.isArray(veri.gelir)) return toast('Bu dosya bir portal yedeği değil', 'hata');
  const ok = await modal({ baslik: 'Yedekten geri yükle', tehlike: true, onay: 'Evet, geri yükle',
    govde: `<p>Mevcut <b>tüm kayıtlar silinecek</b> ve yedekteki veriler yüklenecek. Bu işlem geri alınamaz.</p><p class="muted">Yedek tarihi: ${esc(veri.tarih || '?')}<br>${veri.gelir.length} gelir günü · ${(veri.gider || []).length} gider kaydı</p>` });
  if (!ok) return;
  mesgul(true);
  try { const r = await api('/api/yedek/geri-yukle', { method: 'POST', body: veri }); await tanimYukle(); await veriYukle(); toast(`Geri yüklendi: ${r.gelir} gün, ${r.gider} gider`); ayarlarGoster(); }
  catch (err) { toast(err.message, 'hata'); } finally { mesgul(false); }
}

/* ------------------------------------------------------------------ */
window.addEventListener('error', e => { if (e.message) console.error(e.message); });
basla().catch(e => { console.error(e); $('#icerik').innerHTML = `<div class="card">${bosDurum('alert', 'Sunucuya bağlanılamadı', esc(e.message), '<button class="btn primary sm" onclick="location.reload()" style="margin-top:6px">Yeniden dene</button>')}</div>`; });
})();
