/* util.js — biçimlendirme, tarih ve yardımcılar (Türkçe) */
const U = (() => {
  'use strict';
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const AYLAR_K = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const GUNLER_K = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const fmt0 = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
  const fmt2 = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function para(n, kurus) {
    n = Number(n) || 0;
    return (kurus ? fmt2 : fmt0).format(n);
  }
  function sayi(n, basamak = 0) {
    return (Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: basamak });
  }
  function yuzde(n) {
    return (Number(n) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  }
  function kisa(n) {
    n = Number(n) || 0;
    const a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e6) return s + (a / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'M';
    if (a >= 1e3) return s + (a / 1e3).toLocaleString('tr-TR', { maximumFractionDigits: a < 1e4 ? 1 : 0 }) + 'K';
    return s + Math.round(a).toString();
  }
  /* input alanına yazmak için: 1500 → "1500", 1500.5 → "1500,5" */
  function sayiYaz(n) {
    n = Number(n) || 0;
    if (!n) return '';
    return n.toLocaleString('tr-TR', { maximumFractionDigits: 2, useGrouping: false });
  }
  /* "1.234,56" / "1234.56" / "1234,5" → 1234.56 */
  function tutarOku(s) {
    if (typeof s === 'number') return Math.round(s * 100) / 100;
    s = String(s == null ? '' : s).trim().replace(/[₺\s]/g, '');
    if (!s) return 0;
    if (s.includes(',') && s.includes('.')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    const v = parseFloat(s);
    return isNaN(v) ? 0 : Math.round(v * 100) / 100;
  }

  /* ---- tarih ---- */
  function tarihOku(iso) { const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  function isoTarih(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function bugun() { return isoTarih(new Date()); }
  function gunEkle(iso, n) { const d = tarihOku(iso); d.setDate(d.getDate() + n); return isoTarih(d); }
  function haftaBasi(iso) { const d = tarihOku(iso); const g = (d.getDay() + 6) % 7; d.setDate(d.getDate() - g); return isoTarih(d); }
  function ayBasi(iso) { return String(iso).slice(0, 8) + '01'; }
  function aySonu(iso) { const d = tarihOku(iso); return isoTarih(new Date(d.getFullYear(), d.getMonth() + 1, 0)); }
  function gunFarki(a, b) { return Math.round((tarihOku(b) - tarihOku(a)) / 86400000); }
  function gecerliTarih(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(tarihOku(s).getTime()); }

  /* stil: kisa "8 Eki" · orta "8 Eki 2026" · uzun "8 Ekim 2026, Perşembe" · gun "Per 8 Eki" */
  function tarihTR(iso, stil = 'orta') {
    if (!iso) return '';
    const d = tarihOku(iso);
    const g = d.getDate(), m = d.getMonth(), y = d.getFullYear();
    switch (stil) {
      case 'kisa': return `${g} ${AYLAR_K[m]}`;
      case 'uzun': return `${g} ${AYLAR[m]} ${y}, ${GUNLER[d.getDay()]}`;
      case 'gun': return `${GUNLER_K[d.getDay()]} ${g} ${AYLAR_K[m]}`;
      case 'ay': return `${AYLAR[m]} ${y}`;
      default: return `${g} ${AYLAR_K[m]} ${y}`;
    }
  }
  function aralikMetni(bas, bit) {
    if (!bas || !bit) return '';
    if (bas === bit) return tarihTR(bas, 'uzun');
    const ayniYil = bas.slice(0, 4) === bit.slice(0, 4);
    return `${tarihTR(bas, ayniYil ? 'kisa' : 'orta')} – ${tarihTR(bit, 'orta')}`;
  }

  function donemAnahtari(iso, gran) {
    if (gran === 'gun') return iso;
    if (gran === 'hafta') return haftaBasi(iso);
    return iso.slice(0, 7);
  }
  /* bas..bit aralığındaki dönemler: [{key, kisa, uzun, bas, bit}] */
  function donemler(bas, bit, gran) {
    const out = [];
    if (!bas || !bit) return out;
    if (bas > bit) [bas, bit] = [bit, bas];
    if (gran === 'gun') {
      for (let t = bas; t <= bit; t = gunEkle(t, 1)) out.push({ key: t, kisa: tarihTR(t, 'kisa'), uzun: tarihTR(t, 'uzun'), bas: t, bit: t });
    } else if (gran === 'hafta') {
      for (let t = haftaBasi(bas); t <= bit; t = gunEkle(t, 7)) {
        const son = gunEkle(t, 6);
        out.push({ key: t, kisa: tarihTR(t, 'kisa'), uzun: `${tarihTR(t, 'orta')} – ${tarihTR(son, 'orta')} haftası`, bas: t, bit: son });
      }
    } else {
      const ayniYil = bas.slice(0, 4) === bit.slice(0, 4);
      let d = tarihOku(ayBasi(bas));
      while (isoTarih(d) <= bit) {
        const key = isoTarih(d).slice(0, 7);
        const m = d.getMonth(), y = d.getFullYear();
        out.push({ key, kisa: ayniYil ? AYLAR_K[m] : `${AYLAR_K[m]} ${String(y).slice(2)}`, uzun: `${AYLAR[m]} ${y}`, bas: isoTarih(d), bit: aySonu(isoTarih(d)) });
        d = new Date(y, m + 1, 1);
      }
    }
    if (!out.length) out.push({ key: bas, kisa: tarihTR(bas, 'kisa'), uzun: tarihTR(bas, 'uzun'), bas, bit });
    return out;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function kucuk(s) { return String(s || '').toLocaleLowerCase('tr-TR'); }

  return { AYLAR, AYLAR_K, GUNLER, GUNLER_K, para, sayi, yuzde, kisa, sayiYaz, tutarOku,
    tarihOku, isoTarih, bugun, gunEkle, haftaBasi, ayBasi, aySonu, gunFarki, gecerliTarih,
    tarihTR, aralikMetni, donemAnahtari, donemler, esc, debounce, kucuk };
})();
