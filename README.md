# Sirkeci Kebap · Gelir / Gider Portalı

Dükkanın gelir ve giderlerini takip etmek için tek kişilik, mobil uyumlu bir web portalı.

- **Gelir**: günlük tahsilat, ödeme yöntemine göre (Nakit / Kredi Kartı / Yemek Kartı; istediğiniz kadar yöntem ekleyebilirsiniz). Her yöntemin komisyon oranı ve satış KDV oranı otomatik hesaplanır.
- **Gider**: kategori (Et & Tavuk, Manav, Maaş, Kira…) ve grup (Hammadde, Personel, İşletme, Finans) bazında sınıflandırma, ödeme şekli, fiş KDV oranı.
- **Panel**: günlük / haftalık / aylık grafikler, KPI kartları, ödeme yöntemi ve kategori dağılımları, komisyon ve KDV, dönem özeti (yazılı kâr-zarar tablosu). Filtreler hem görsel (çipler) hem yazılı (tarih aralığı, arama).
- **Kayıtlar**: Gelir ve Gider sayfalarındaki "Kayıtlar" kartı; tarih aralığı, arama, sıralama, kategori/ödeme filtresi, düzenleme, silme, CSV (Excel) dışa aktarma.
- **Sabit giderler**: kira, SGK, muhasebe gibi her ay tekrarlayan giderler bir kez tanımlanır; Gider sayfasından her ay tek dokunuşla oluşturulur.
- **Personel**: çalışan listesi ve aylık maaş; Gider sayfasından avans ve maaş ödemeleri gider kaydı olarak işlenir, ay bazında ödenen / kalan görünür.
- **Ayarlar**: işletme adı, KDV oranı, tema (açık / koyu), ödeme yöntemleri, sabit giderler, personel, gider grupları ve kategorileri, şifre, JSON yedek alma ve geri yükleme.

## Çalıştırma (Windows)

1. Python 3.11+ kurulu olmalı.
2. `baslat.bat` dosyasına çift tıklayın. İlk çalıştırmada gerekli paketler kurulur.
3. Tarayıcıda **http://localhost:8000** adresini açın.

Elle başlatmak için:

```bash
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Telefondan (iPhone) kullanma

Bilgisayar ve telefon **aynı Wi-Fi** ağında olmalı.

1. `baslat.bat` penceresi bilgisayarın IP adresini yazar (örn. `http://192.168.1.25:8000`). Bunu iPhone'da Safari'ye yazın.
2. İlk seferde Windows güvenlik duvarı sorarsa **Özel ağlar** için izin verin. Sormazsa: Windows Güvenlik Duvarı → Gelen Kurallar → Yeni Kural → Bağlantı noktası → TCP 8000 → İzin ver.
3. Safari'de **Paylaş → Ana Ekrana Ekle** derseniz uygulama gibi tam ekran açılır.

Portalı dışarıdan (mobil veriyle) kullanmak isterseniz bir sunucuya (VPS) veya Cloudflare Tunnel / ngrok gibi bir tünele koymanız gerekir. **Bunu yapmadan önce mutlaka Ayarlar → Güvenlik'ten şifre belirleyin.**

## Örnek verileri temizleme

Kurulumla gelen veritabanında test için 60 günlük örnek gelir/gider kaydı vardır. Gerçek kullanıma geçmeden önce:

1. Sunucuyu kapatın (`baslat.bat` penceresi).
2. `data/sirkeci.db` dosyasını silin (varsa `sirkeci.db-wal` ve `sirkeci.db-shm` dosyalarını da).
3. Sunucuyu yeniden başlatın; boş bir veritabanı varsayılan kategorilerle yeniden oluşturulur.

## Veri ve yedek

- Tüm veriler `data/sirkeci.db` (SQLite) dosyasındadır. Bu dosyayı kopyalamak tam yedektir.
- Uygulama içinden: **Veri → Yedek indir (JSON)**. Geri yüklemek için aynı sayfadaki **Yedekten geri yükle**.
- Farklı bir veri dosyası kullanmak için `SIRKECI_DB` ortam değişkenini ayarlayın.

## Görünüm

Arayüz Inter yazı tipini Google Fonts'tan yükler; internet yoksa sistem yazı tipine düşer, işlev değişmez. Açık / koyu tema Ayarlar → Görünüm'den seçilir ("Sistem" telefonun ayarını izler).

## Hesaplama notları

- **Komisyon** = tutar × yöntemin komisyon oranı. Oran, kaydın yapıldığı andaki ayardan alınır ve kayıtla birlikte saklanır; sonradan oranı değiştirmek eski kayıtları etkilemez.
- **Hesaplanan KDV** (satış) = tutar × oran ÷ (100 + oran) — fiyatlara KDV dahil varsayılır.
- **İndirilecek KDV** (gider) aynı formülle gider kaydındaki KDV oranından hesaplanır.
- **Ödenecek KDV (tahmini)** = hesaplanan − indirilecek. Kesin beyan için muhasebecinize danışın.
- **Net kâr** = brüt gelir − komisyon − giderler.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `main.py` | FastAPI sunucusu, SQLite veritabanı, API |
| `static/index.html` | Uygulama kabuğu |
| `static/app.js` | Sayfalar, formlar, hesaplamalar |
| `static/charts.js` | Bağımlılıksız SVG grafikler |
| `static/util.js` | Türkçe para / tarih biçimlendirme |
| `static/style.css` | Mobil öncelikli stil, açık / koyu tema |
| `baslat.bat` | Windows başlatma scripti |

## İnternete kurulum (telefondan her yerden erişim)

Proje bir `Dockerfile` ve `Procfile` içerir; Railway, Fly.io, Render gibi hizmetlere doğrudan kurulabilir.

1. Kurulumdan **önce** veya hemen sonra Ayarlar → Güvenlik'ten şifre belirleyin.
2. Hizmette kalıcı bir disk (volume) oluşturup `/data` yoluna bağlayın; veritabanı `SIRKECI_DB=/data/sirkeci.db` dosyasında tutulur. Kalıcı disk olmazsa her yeniden başlatmada veriler silinir.
3. Hizmetin verdiği HTTPS adresini iPhone'da Safari ile açıp "Ana Ekrana Ekle" deyin.

### Railway adımları

1. railway.com → **New Project → Deploy from GitHub repo** → `berkesun/sirkecikebapotomasyon` seçin. Dockerfile otomatik tanınır (`railway.json` ile ayarlıdır).
2. Servise tıklayın → **Variables** sekmesinde bir şey eklemeniz gerekmez (`PORT` Railway tarafından verilir).
3. Servis kutusuna sağ tıklayın → **Add Volume** → mount path: `/data`. Volume eklendikten sonra servis yeniden dağıtılır.
4. **Settings → Networking → Generate Domain** ile adres alın (ör. `https://sirkeci.up.railway.app`).
5. **Settings → Region**: Europe (Amsterdam) seçin; **App Sleeping** kapalı kalsın.
6. Adresi açın, Ayarlar → Güvenlik'ten şifre koyun, sonra iPhone'da ana ekrana ekleyin.

GitHub'a her `git push` sonrasında Railway yeniden dağıtır; veriler volume'da kaldığı için kaybolmaz.
