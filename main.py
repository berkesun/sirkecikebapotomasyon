"""
Sirkeci Kebap - Gelir / Gider Portalı
Tek kişilik kullanım için FastAPI + SQLite arka ucu.

Çalıştırmak için:  python -m uvicorn main:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import calendar
import csv
import hashlib
import hmac
import io
import os
import secrets
import sqlite3
import time
from contextlib import asynccontextmanager, contextmanager
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE = Path(__file__).resolve().parent
DATA_DIR = BASE / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = Path(os.environ.get("SIRKECI_DB", DATA_DIR / "sirkeci.db"))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
STATIC = BASE / "static"
COOKIE = "sirkeci_oturum"
SURUM = "1.0.0"

# --------------------------------------------------------------------------- #
# Veritabanı
# --------------------------------------------------------------------------- #

SEMA = """
CREATE TABLE IF NOT EXISTS ayar (
    anahtar TEXT PRIMARY KEY,
    deger   TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS odeme_yontemi (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ad             TEXT    NOT NULL,
    tur            TEXT    NOT NULL DEFAULT 'diger',
    komisyon_orani REAL    NOT NULL DEFAULT 0,
    renk           INTEGER NOT NULL DEFAULT 1,
    sira           INTEGER NOT NULL DEFAULT 0,
    aktif          INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS grup (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    ad   TEXT    NOT NULL UNIQUE,
    renk INTEGER NOT NULL DEFAULT 1,
    sira INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS kategori (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ad        TEXT    NOT NULL,
    grup_id   INTEGER NOT NULL REFERENCES grup(id),
    kdv_orani REAL    NOT NULL DEFAULT 0,
    sira      INTEGER NOT NULL DEFAULT 0,
    aktif     INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS gelir_gun (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    tarih      TEXT NOT NULL UNIQUE,
    aciklama   TEXT NOT NULL DEFAULT '',
    olusturma  TEXT NOT NULL,
    guncelleme TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gelir_kalem (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    gun_id         INTEGER NOT NULL REFERENCES gelir_gun(id) ON DELETE CASCADE,
    yontem_id      INTEGER NOT NULL REFERENCES odeme_yontemi(id),
    tutar          REAL    NOT NULL DEFAULT 0,
    komisyon_orani REAL    NOT NULL DEFAULT 0,
    kdv_orani      REAL    NOT NULL DEFAULT 0,
    UNIQUE(gun_id, yontem_id)
);
CREATE TABLE IF NOT EXISTS gider (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tarih       TEXT    NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES kategori(id),
    tutar       REAL    NOT NULL,
    kdv_orani   REAL    NOT NULL DEFAULT 0,
    odeme       TEXT    NOT NULL DEFAULT 'nakit',
    aciklama    TEXT    NOT NULL DEFAULT '',
    olusturma   TEXT    NOT NULL,
    guncelleme  TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS sabit_gider (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ad          TEXT    NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES kategori(id),
    tutar       REAL    NOT NULL DEFAULT 0,
    odeme       TEXT    NOT NULL DEFAULT 'banka',
    gun         INTEGER NOT NULL DEFAULT 1,
    kdv_orani   REAL    NOT NULL DEFAULT 0,
    aciklama    TEXT    NOT NULL DEFAULT '',
    sira        INTEGER NOT NULL DEFAULT 0,
    aktif       INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS personel (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ad        TEXT    NOT NULL,
    gorev     TEXT    NOT NULL DEFAULT '',
    maas      REAL    NOT NULL DEFAULT 0,
    baslangic TEXT    NOT NULL DEFAULT '',
    notlar    TEXT    NOT NULL DEFAULT '',
    sira      INTEGER NOT NULL DEFAULT 0,
    aktif     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_gider_tarih ON gider(tarih);
CREATE INDEX IF NOT EXISTS idx_gelir_tarih ON gelir_gun(tarih);
"""

VARSAYILAN_AYAR = {
    "isletme_adi": "Sirkeci Kebap",
    "kdv_orani": "10",
    "para_birimi": "TRY",
    "tema": "sistem",
    "sifre_hash": "",
    "personel_kategori_id": "",
}

# (ad, tur, komisyon %, renk slotu)
VARSAYILAN_YONTEMLER = [
    ("Nakit", "nakit", 0.0, 3),
    ("Kredi Kartı", "kredi_karti", 2.0, 5),
    ("Yemek Kartı", "yemek_karti", 6.0, 4),
]

# grup adı -> (renk slotu, [(kategori adı, varsayılan kdv %)])
VARSAYILAN_GRUPLAR = [
    ("Hammadde", 2, [("Et & Tavuk", 1), ("Manav", 1), ("Gıda & Market", 10),
                     ("Ekmek & Lavaş", 1), ("İçecek", 10)]),
    ("Personel", 5, [("Maaş", 0), ("SGK & Vergi (Personel)", 0), ("Personel Yemek & Yol", 0)]),
    ("İşletme", 7, [("Kira", 20), ("Elektrik", 20), ("Su", 10), ("Doğalgaz & Tüp", 20),
                    ("İnternet & Telefon", 20), ("Temizlik", 20), ("Ambalaj & Paketleme", 20),
                    ("Bakım & Onarım", 20), ("Demirbaş", 20)]),
    ("Finans", 4, [("Vergi & Resmi Ödemeler", 0), ("Muhasebe", 20), ("Banka Masrafı", 0)]),
    ("Diğer", 0, [("Reklam & Pazarlama", 20), ("Diğer", 0)]),
]


def baglan() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


@contextmanager
def db():
    con = baglan()
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def simdi() -> str:
    return datetime.now().isoformat(timespec="seconds")


def ayar_oku(con: sqlite3.Connection, anahtar: str, varsayilan: str = "") -> str:
    r = con.execute("SELECT deger FROM ayar WHERE anahtar=?", (anahtar,)).fetchone()
    return r["deger"] if r else varsayilan


def ayar_yaz(con: sqlite3.Connection, anahtar: str, deger: str) -> None:
    con.execute(
        "INSERT INTO ayar(anahtar, deger) VALUES(?,?) "
        "ON CONFLICT(anahtar) DO UPDATE SET deger=excluded.deger",
        (anahtar, deger),
    )


def sutun_ekle(con: sqlite3.Connection, tablo: str, sutun: str, tanim: str) -> None:
    """Eski veritabanlarına yeni sütun ekler (basit göç)."""
    mevcut = [r["name"] for r in con.execute(f"PRAGMA table_info({tablo})")]
    if sutun not in mevcut:
        con.execute(f"ALTER TABLE {tablo} ADD COLUMN {sutun} {tanim}")


def veritabani_hazirla() -> None:
    with db() as con:
        con.executescript("PRAGMA journal_mode = WAL;" + SEMA)
        sutun_ekle(con, "gider", "sabit_id", "INTEGER")
        sutun_ekle(con, "gider", "personel_id", "INTEGER")
        for k, v in VARSAYILAN_AYAR.items():
            if con.execute("SELECT 1 FROM ayar WHERE anahtar=?", (k,)).fetchone() is None:
                ayar_yaz(con, k, v)
        if ayar_oku(con, "gizli_anahtar") == "":
            ayar_yaz(con, "gizli_anahtar", secrets.token_hex(32))
        if con.execute("SELECT COUNT(*) c FROM odeme_yontemi").fetchone()["c"] == 0:
            for i, (ad, tur, kom, renk) in enumerate(VARSAYILAN_YONTEMLER):
                con.execute(
                    "INSERT INTO odeme_yontemi(ad, tur, komisyon_orani, renk, sira) VALUES(?,?,?,?,?)",
                    (ad, tur, kom, renk, i),
                )
        if con.execute("SELECT COUNT(*) c FROM grup").fetchone()["c"] == 0:
            ks = 0
            for gi, (gad, renk, kats) in enumerate(VARSAYILAN_GRUPLAR):
                cur = con.execute("INSERT INTO grup(ad, renk, sira) VALUES(?,?,?)", (gad, renk, gi))
                gid = cur.lastrowid
                for kad, kdv in kats:
                    con.execute(
                        "INSERT INTO kategori(ad, grup_id, kdv_orani, sira) VALUES(?,?,?,?)",
                        (kad, gid, kdv, ks),
                    )
                    ks += 1
        if ayar_oku(con, "personel_kategori_id") == "":
            r = con.execute("SELECT id FROM kategori WHERE ad='Maaş' ORDER BY id LIMIT 1").fetchone()
            if r:
                ayar_yaz(con, "personel_kategori_id", str(r["id"]))
    kimlik_yenile()


# --------------------------------------------------------------------------- #
# Kimlik / oturum
# --------------------------------------------------------------------------- #

_kimlik = {"hash": "", "gizli": ""}


def kimlik_yenile() -> None:
    with db() as con:
        _kimlik["hash"] = ayar_oku(con, "sifre_hash")
        _kimlik["gizli"] = ayar_oku(con, "gizli_anahtar")


def sifre_hashle(sifre: str) -> str:
    tuz = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", sifre.encode(), bytes.fromhex(tuz), 200_000).hex()
    return f"{tuz}${h}"


def sifre_dogru_mu(sifre: str, kayit: str) -> bool:
    if not kayit or "$" not in kayit:
        return False
    tuz, h = kayit.split("$", 1)
    h2 = hashlib.pbkdf2_hmac("sha256", sifre.encode(), bytes.fromhex(tuz), 200_000).hex()
    return hmac.compare_digest(h, h2)


def oturum_tokeni() -> str:
    return hmac.new(_kimlik["gizli"].encode(), b"sirkeci-oturum-v1", hashlib.sha256).hexdigest()


def giris_gerekli() -> bool:
    return bool(_kimlik["hash"])


def girisli_mi(request: Request) -> bool:
    if not giris_gerekli():
        return True
    t = request.cookies.get(COOKIE, "")
    return bool(t) and hmac.compare_digest(t, oturum_tokeni())


def guvenli_mi(request: Request) -> bool:
    """HTTPS üzerinden mi geldi? (doğrudan ya da ters vekil arkasında)"""
    proto = request.headers.get("x-forwarded-proto", "").split(",")[0].strip().lower()
    return request.url.scheme == "https" or proto == "https"


def oturum_cerezi_yaz(response: Response, request: Request) -> None:
    response.set_cookie(COOKIE, oturum_tokeni(), httponly=True, samesite="lax", secure=guvenli_mi(request),
                        max_age=60 * 60 * 24 * 180, path="/")


# --------------------------------------------------------------------------- #
# Uygulama
# --------------------------------------------------------------------------- #

@asynccontextmanager
async def lifespan(app: FastAPI):
    veritabani_hazirla()
    yield


app = FastAPI(title="Sirkeci Kebap Portal", version=SURUM, lifespan=lifespan, docs_url=None, redoc_url=None)

ACIK_YOLLAR = {"/api/giris", "/api/bootstrap"}


@app.middleware("http")
async def kimlik_kontrol(request: Request, call_next):
    yol = request.url.path
    if yol.startswith("/api/") and yol not in ACIK_YOLLAR and not girisli_mi(request):
        return JSONResponse({"hata": "Giriş gerekli"}, status_code=401)
    yanit = await call_next(request)
    if yol == "/" or yol.startswith("/api/"):
        yanit.headers["Cache-Control"] = "no-store"
    return yanit


@app.get("/", include_in_schema=False)
def ana_sayfa():
    return FileResponse(STATIC / "index.html")


@app.get("/manifest.webmanifest", include_in_schema=False)
def manifest():
    return FileResponse(STATIC / "manifest.webmanifest", media_type="application/manifest+json")


# ---------------------------- yardımcılar ----------------------------------- #

def tarih_dogrula(t: str) -> str:
    try:
        return date.fromisoformat(t).isoformat()
    except ValueError:
        raise HTTPException(400, f"Geçersiz tarih: {t}")


def r2(x: float) -> float:
    return round(float(x or 0), 2)


def yontemleri_oku(con) -> list[dict]:
    return [dict(r) for r in con.execute("SELECT * FROM odeme_yontemi ORDER BY sira, id")]


def gruplari_oku(con) -> list[dict]:
    return [dict(r) for r in con.execute("SELECT * FROM grup ORDER BY sira, id")]


def kategorileri_oku(con) -> list[dict]:
    return [dict(r) for r in con.execute(
        "SELECT k.*, g.ad AS grup_ad, g.renk AS grup_renk FROM kategori k "
        "JOIN grup g ON g.id = k.grup_id ORDER BY g.sira, k.sira, k.id")]


def ayarlari_oku(con) -> dict:
    rows = con.execute("SELECT anahtar, deger FROM ayar").fetchall()
    a = {r["anahtar"]: r["deger"] for r in rows if r["anahtar"] not in ("sifre_hash", "gizli_anahtar")}
    a["kdv_orani"] = float(a.get("kdv_orani", "10"))
    pk = str(a.get("personel_kategori_id", ""))
    a["personel_kategori_id"] = int(pk) if pk.isdigit() else None
    return a


def sabitleri_oku(con) -> list[dict]:
    return [dict(r) for r in con.execute("SELECT * FROM sabit_gider ORDER BY sira, id")]


def personelleri_oku(con) -> list[dict]:
    return [dict(r) for r in con.execute("SELECT * FROM personel ORDER BY sira, id")]


def gelir_oku(con, bas: Optional[str] = None, bit: Optional[str] = None, tarih: Optional[str] = None) -> list[dict]:
    sql = ("SELECT g.id, g.tarih, g.aciklama, g.guncelleme, k.yontem_id, k.tutar, k.komisyon_orani, k.kdv_orani "
           "FROM gelir_gun g LEFT JOIN gelir_kalem k ON k.gun_id = g.id")
    kosul, prm = [], []
    if tarih:
        kosul.append("g.tarih = ?"); prm.append(tarih)
    if bas:
        kosul.append("g.tarih >= ?"); prm.append(bas)
    if bit:
        kosul.append("g.tarih <= ?"); prm.append(bit)
    if kosul:
        sql += " WHERE " + " AND ".join(kosul)
    sql += " ORDER BY g.tarih DESC, k.id"
    gunler: dict[int, dict] = {}
    for r in con.execute(sql, prm):
        g = gunler.get(r["id"])
        if g is None:
            g = gunler[r["id"]] = {"id": r["id"], "tarih": r["tarih"], "aciklama": r["aciklama"],
                                   "guncelleme": r["guncelleme"], "kalemler": []}
        if r["yontem_id"] is not None:
            g["kalemler"].append({"yontem_id": r["yontem_id"], "tutar": r["tutar"],
                                  "komisyon_orani": r["komisyon_orani"], "kdv_orani": r["kdv_orani"]})
    return list(gunler.values())


def gider_oku(con, bas=None, bit=None, gid=None) -> list[dict]:
    sql = "SELECT * FROM gider"
    kosul, prm = [], []
    if gid is not None:
        kosul.append("id = ?"); prm.append(gid)
    if bas:
        kosul.append("tarih >= ?"); prm.append(bas)
    if bit:
        kosul.append("tarih <= ?"); prm.append(bit)
    if kosul:
        sql += " WHERE " + " AND ".join(kosul)
    sql += " ORDER BY tarih DESC, id DESC"
    return [dict(r) for r in con.execute(sql, prm)]


# ---------------------------- modeller -------------------------------------- #

class GirisBody(BaseModel):
    sifre: str = ""


class SifreBody(BaseModel):
    yeni_sifre: str = ""
    mevcut_sifre: str = ""


class AyarBody(BaseModel):
    isletme_adi: Optional[str] = None
    kdv_orani: Optional[float] = None
    tema: Optional[str] = None
    para_birimi: Optional[str] = None
    personel_kategori_id: Optional[int] = None


class SabitBody(BaseModel):
    ad: str
    kategori_id: int
    tutar: float = 0
    odeme: str = "banka"
    gun: int = 1
    kdv_orani: float = 0
    aciklama: str = ""
    sira: int = 0
    aktif: bool = True


class SabitOlusturBody(BaseModel):
    ay: str


class PersonelBody(BaseModel):
    ad: str
    gorev: str = ""
    maas: float = 0
    baslangic: str = ""
    notlar: str = ""
    sira: int = 0
    aktif: bool = True


class YontemBody(BaseModel):
    ad: str
    tur: str = "diger"
    komisyon_orani: float = 0
    renk: int = 1
    sira: int = 0
    aktif: bool = True


class GrupBody(BaseModel):
    ad: str
    renk: int = 1
    sira: int = 0


class KategoriBody(BaseModel):
    ad: str
    grup_id: int
    kdv_orani: float = 0
    sira: int = 0
    aktif: bool = True


class GelirKalemBody(BaseModel):
    yontem_id: int
    tutar: float = 0
    komisyon_orani: Optional[float] = None
    kdv_orani: Optional[float] = None


class GelirBody(BaseModel):
    aciklama: str = ""
    kalemler: list[GelirKalemBody] = []


class GiderBody(BaseModel):
    tarih: str
    kategori_id: int
    tutar: float
    kdv_orani: float = 0
    odeme: str = "nakit"
    aciklama: str = ""
    sabit_id: Optional[int] = None
    personel_id: Optional[int] = None


class YedekBody(BaseModel):
    surum: int = 1
    ayar: dict = {}
    yontemler: list[dict] = []
    gruplar: list[dict] = []
    kategoriler: list[dict] = []
    sabitler: list[dict] = []
    personeller: list[dict] = []
    gelir: list[dict] = []
    gider: list[dict] = []


# ---------------------------- bootstrap / giriş ----------------------------- #

@app.get("/api/bootstrap")
def bootstrap(request: Request):
    girisli = girisli_mi(request)
    out = {"surum": SURUM, "giris_gerekli": giris_gerekli(), "girisli": girisli}
    with db() as con:
        out["isletme_adi"] = ayar_oku(con, "isletme_adi", "Sirkeci Kebap")
        if girisli:
            out["ayar"] = ayarlari_oku(con)
            out["yontemler"] = yontemleri_oku(con)
            out["gruplar"] = gruplari_oku(con)
            out["kategoriler"] = kategorileri_oku(con)
            out["sabitler"] = sabitleri_oku(con)
            out["personeller"] = personelleri_oku(con)
    return out


@app.post("/api/giris")
def giris(body: GirisBody, request: Request, response: Response):
    if not giris_gerekli():
        return {"tamam": True}
    if not sifre_dogru_mu(body.sifre, _kimlik["hash"]):
        time.sleep(0.6)
        raise HTTPException(401, "Şifre hatalı")
    oturum_cerezi_yaz(response, request)
    return {"tamam": True}


@app.post("/api/cikis")
def cikis(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return {"tamam": True}


@app.put("/api/sifre")
def sifre_degistir(body: SifreBody, request: Request, response: Response):
    if giris_gerekli() and not sifre_dogru_mu(body.mevcut_sifre, _kimlik["hash"]):
        raise HTTPException(400, "Mevcut şifre hatalı")
    yeni = body.yeni_sifre.strip()
    if yeni and len(yeni) < 4:
        raise HTTPException(400, "Şifre en az 4 karakter olmalı")
    with db() as con:
        ayar_yaz(con, "sifre_hash", sifre_hashle(yeni) if yeni else "")
        ayar_yaz(con, "gizli_anahtar", secrets.token_hex(32))
    kimlik_yenile()
    if yeni:
        oturum_cerezi_yaz(response, request)
    else:
        response.delete_cookie(COOKIE, path="/")
    return {"tamam": True, "giris_gerekli": bool(yeni)}


# ---------------------------- ayarlar --------------------------------------- #

@app.get("/api/ayar")
def ayar_getir():
    with db() as con:
        return ayarlari_oku(con)


@app.put("/api/ayar")
def ayar_guncelle(body: AyarBody):
    with db() as con:
        if body.isletme_adi is not None:
            ayar_yaz(con, "isletme_adi", body.isletme_adi.strip() or "Sirkeci Kebap")
        if body.kdv_orani is not None:
            ayar_yaz(con, "kdv_orani", str(r2(body.kdv_orani)))
        if body.tema is not None and body.tema in ("sistem", "acik", "koyu"):
            ayar_yaz(con, "tema", body.tema)
        if body.para_birimi is not None:
            ayar_yaz(con, "para_birimi", body.para_birimi.strip() or "TRY")
        if body.personel_kategori_id is not None:
            if con.execute("SELECT 1 FROM kategori WHERE id=?", (body.personel_kategori_id,)).fetchone() is None:
                raise HTTPException(400, "Kategori bulunamadı")
            ayar_yaz(con, "personel_kategori_id", str(body.personel_kategori_id))
        return ayarlari_oku(con)


# ---------------------------- ödeme yöntemleri ------------------------------ #

@app.get("/api/yontem")
def yontem_liste():
    with db() as con:
        return yontemleri_oku(con)


@app.post("/api/yontem")
def yontem_ekle(body: YontemBody):
    with db() as con:
        cur = con.execute(
            "INSERT INTO odeme_yontemi(ad, tur, komisyon_orani, renk, sira, aktif) VALUES(?,?,?,?,?,?)",
            (body.ad.strip(), body.tur, r2(body.komisyon_orani), body.renk, body.sira, int(body.aktif)))
        return dict(con.execute("SELECT * FROM odeme_yontemi WHERE id=?", (cur.lastrowid,)).fetchone())


@app.put("/api/yontem/{yid}")
def yontem_guncelle(yid: int, body: YontemBody):
    with db() as con:
        cur = con.execute(
            "UPDATE odeme_yontemi SET ad=?, tur=?, komisyon_orani=?, renk=?, sira=?, aktif=? WHERE id=?",
            (body.ad.strip(), body.tur, r2(body.komisyon_orani), body.renk, body.sira, int(body.aktif), yid))
        if cur.rowcount == 0:
            raise HTTPException(404, "Ödeme yöntemi bulunamadı")
        return dict(con.execute("SELECT * FROM odeme_yontemi WHERE id=?", (yid,)).fetchone())


@app.delete("/api/yontem/{yid}")
def yontem_sil(yid: int):
    with db() as con:
        n = con.execute("SELECT COUNT(*) c FROM gelir_kalem WHERE yontem_id=?", (yid,)).fetchone()["c"]
        if n:
            raise HTTPException(409, f"Bu yöntemle {n} gelir kaydı var. Silmek yerine pasif yapın.")
        con.execute("DELETE FROM odeme_yontemi WHERE id=?", (yid,))
        return {"tamam": True}


# ---------------------------- gruplar / kategoriler ------------------------- #

@app.get("/api/grup")
def grup_liste():
    with db() as con:
        return gruplari_oku(con)


@app.post("/api/grup")
def grup_ekle(body: GrupBody):
    with db() as con:
        try:
            cur = con.execute("INSERT INTO grup(ad, renk, sira) VALUES(?,?,?)",
                              (body.ad.strip(), body.renk, body.sira))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Bu isimde bir grup zaten var")
        return dict(con.execute("SELECT * FROM grup WHERE id=?", (cur.lastrowid,)).fetchone())


@app.put("/api/grup/{gid}")
def grup_guncelle(gid: int, body: GrupBody):
    with db() as con:
        try:
            cur = con.execute("UPDATE grup SET ad=?, renk=?, sira=? WHERE id=?",
                              (body.ad.strip(), body.renk, body.sira, gid))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Bu isimde bir grup zaten var")
        if cur.rowcount == 0:
            raise HTTPException(404, "Grup bulunamadı")
        return dict(con.execute("SELECT * FROM grup WHERE id=?", (gid,)).fetchone())


@app.delete("/api/grup/{gid}")
def grup_sil(gid: int):
    with db() as con:
        n = con.execute("SELECT COUNT(*) c FROM kategori WHERE grup_id=?", (gid,)).fetchone()["c"]
        if n:
            raise HTTPException(409, f"Bu grupta {n} kategori var. Önce kategorileri taşıyın.")
        con.execute("DELETE FROM grup WHERE id=?", (gid,))
        return {"tamam": True}


@app.get("/api/kategori")
def kategori_liste():
    with db() as con:
        return kategorileri_oku(con)


@app.post("/api/kategori")
def kategori_ekle(body: KategoriBody):
    with db() as con:
        if con.execute("SELECT 1 FROM grup WHERE id=?", (body.grup_id,)).fetchone() is None:
            raise HTTPException(400, "Grup bulunamadı")
        cur = con.execute(
            "INSERT INTO kategori(ad, grup_id, kdv_orani, sira, aktif) VALUES(?,?,?,?,?)",
            (body.ad.strip(), body.grup_id, r2(body.kdv_orani), body.sira, int(body.aktif)))
        kid = cur.lastrowid
        return next(k for k in kategorileri_oku(con) if k["id"] == kid)


@app.put("/api/kategori/{kid}")
def kategori_guncelle(kid: int, body: KategoriBody):
    with db() as con:
        if con.execute("SELECT 1 FROM grup WHERE id=?", (body.grup_id,)).fetchone() is None:
            raise HTTPException(400, "Grup bulunamadı")
        cur = con.execute(
            "UPDATE kategori SET ad=?, grup_id=?, kdv_orani=?, sira=?, aktif=? WHERE id=?",
            (body.ad.strip(), body.grup_id, r2(body.kdv_orani), body.sira, int(body.aktif), kid))
        if cur.rowcount == 0:
            raise HTTPException(404, "Kategori bulunamadı")
        return next(k for k in kategorileri_oku(con) if k["id"] == kid)


@app.delete("/api/kategori/{kid}")
def kategori_sil(kid: int):
    with db() as con:
        n = con.execute("SELECT COUNT(*) c FROM gider WHERE kategori_id=?", (kid,)).fetchone()["c"]
        if n:
            raise HTTPException(409, f"Bu kategoride {n} gider kaydı var. Silmek yerine pasif yapın.")
        con.execute("DELETE FROM kategori WHERE id=?", (kid,))
        return {"tamam": True}


# ---------------------------- gelir ----------------------------------------- #

@app.get("/api/gelir")
def gelir_liste(bas: Optional[str] = None, bit: Optional[str] = None):
    with db() as con:
        return gelir_oku(con, tarih_dogrula(bas) if bas else None, tarih_dogrula(bit) if bit else None)


@app.get("/api/gelir/{tarih}")
def gelir_gun(tarih: str):
    tarih = tarih_dogrula(tarih)
    with db() as con:
        rows = gelir_oku(con, tarih=tarih)
        return rows[0] if rows else {"tarih": tarih, "aciklama": "", "kalemler": []}


@app.put("/api/gelir/{tarih}")
def gelir_kaydet(tarih: str, body: GelirBody):
    tarih = tarih_dogrula(tarih)
    with db() as con:
        kdv_vars = float(ayar_oku(con, "kdv_orani", "10"))
        yontemler = {y["id"]: y for y in yontemleri_oku(con)}
        gun = con.execute("SELECT id FROM gelir_gun WHERE tarih=?", (tarih,)).fetchone()
        now = simdi()
        if gun:
            gun_id = gun["id"]
            con.execute("UPDATE gelir_gun SET aciklama=?, guncelleme=? WHERE id=?",
                        (body.aciklama.strip(), now, gun_id))
        else:
            gun_id = con.execute("INSERT INTO gelir_gun(tarih, aciklama, olusturma, guncelleme) VALUES(?,?,?,?)",
                                 (tarih, body.aciklama.strip(), now, now)).lastrowid
        con.execute("DELETE FROM gelir_kalem WHERE gun_id=?", (gun_id,))
        eklenen = 0
        for k in body.kalemler:
            y = yontemler.get(k.yontem_id)
            if y is None:
                raise HTTPException(400, f"Ödeme yöntemi bulunamadı: {k.yontem_id}")
            if not k.tutar:
                continue
            kom = y["komisyon_orani"] if k.komisyon_orani is None else k.komisyon_orani
            kdv = kdv_vars if k.kdv_orani is None else k.kdv_orani
            con.execute(
                "INSERT INTO gelir_kalem(gun_id, yontem_id, tutar, komisyon_orani, kdv_orani) VALUES(?,?,?,?,?)",
                (gun_id, k.yontem_id, r2(k.tutar), r2(kom), r2(kdv)))
            eklenen += 1
        if eklenen == 0 and not body.aciklama.strip():
            con.execute("DELETE FROM gelir_gun WHERE id=?", (gun_id,))
            return {"tarih": tarih, "silindi": True}
        return gelir_oku(con, tarih=tarih)[0]


@app.delete("/api/gelir/{tarih}")
def gelir_sil(tarih: str):
    tarih = tarih_dogrula(tarih)
    with db() as con:
        con.execute("DELETE FROM gelir_gun WHERE tarih=?", (tarih,))
        return {"tamam": True}


# ---------------------------- gider ----------------------------------------- #

def gider_dogrula(con, body: GiderBody) -> tuple:
    tarih = tarih_dogrula(body.tarih)
    if con.execute("SELECT 1 FROM kategori WHERE id=?", (body.kategori_id,)).fetchone() is None:
        raise HTTPException(400, "Kategori bulunamadı")
    if body.tutar is None or body.tutar <= 0:
        raise HTTPException(400, "Tutar sıfırdan büyük olmalı")
    if body.personel_id is not None and con.execute("SELECT 1 FROM personel WHERE id=?", (body.personel_id,)).fetchone() is None:
        raise HTTPException(400, "Personel bulunamadı")
    if body.sabit_id is not None and con.execute("SELECT 1 FROM sabit_gider WHERE id=?", (body.sabit_id,)).fetchone() is None:
        raise HTTPException(400, "Sabit gider tanımı bulunamadı")
    odeme = body.odeme if body.odeme in ("nakit", "banka", "kart") else "nakit"
    return tarih, odeme


@app.get("/api/gider")
def gider_liste(bas: Optional[str] = None, bit: Optional[str] = None):
    with db() as con:
        return gider_oku(con, tarih_dogrula(bas) if bas else None, tarih_dogrula(bit) if bit else None)


@app.post("/api/gider")
def gider_ekle(body: GiderBody):
    with db() as con:
        tarih, odeme = gider_dogrula(con, body)
        now = simdi()
        cur = con.execute(
            "INSERT INTO gider(tarih, kategori_id, tutar, kdv_orani, odeme, aciklama, olusturma, guncelleme, sabit_id, personel_id) "
            "VALUES(?,?,?,?,?,?,?,?,?,?)",
            (tarih, body.kategori_id, r2(body.tutar), r2(body.kdv_orani), odeme, body.aciklama.strip(), now, now,
             body.sabit_id, body.personel_id))
        return gider_oku(con, gid=cur.lastrowid)[0]


@app.put("/api/gider/{gid}")
def gider_guncelle(gid: int, body: GiderBody):
    with db() as con:
        tarih, odeme = gider_dogrula(con, body)
        cur = con.execute(
            "UPDATE gider SET tarih=?, kategori_id=?, tutar=?, kdv_orani=?, odeme=?, aciklama=?, guncelleme=?, "
            "sabit_id=?, personel_id=? WHERE id=?",
            (tarih, body.kategori_id, r2(body.tutar), r2(body.kdv_orani), odeme, body.aciklama.strip(), simdi(),
             body.sabit_id, body.personel_id, gid))
        if cur.rowcount == 0:
            raise HTTPException(404, "Gider kaydı bulunamadı")
        return gider_oku(con, gid=gid)[0]


@app.delete("/api/gider/{gid}")
def gider_sil(gid: int):
    with db() as con:
        con.execute("DELETE FROM gider WHERE id=?", (gid,))
        return {"tamam": True}


# ---------------------------- sabit giderler -------------------------------- #

def ay_dogrula(ay: str) -> str:
    try:
        d = date.fromisoformat(f"{ay}-01")
    except ValueError:
        raise HTTPException(400, f"Geçersiz ay: {ay}")
    return d.strftime("%Y-%m")


def sabit_dogrula(con, body: SabitBody) -> str:
    if not body.ad.strip():
        raise HTTPException(400, "Ad gerekli")
    if con.execute("SELECT 1 FROM kategori WHERE id=?", (body.kategori_id,)).fetchone() is None:
        raise HTTPException(400, "Kategori bulunamadı")
    if body.tutar <= 0:
        raise HTTPException(400, "Tutar sıfırdan büyük olmalı")
    if not 1 <= body.gun <= 31:
        raise HTTPException(400, "Gün 1 ile 31 arasında olmalı")
    return body.odeme if body.odeme in ("nakit", "banka", "kart") else "banka"


@app.get("/api/sabit")
def sabit_liste():
    with db() as con:
        return sabitleri_oku(con)


@app.post("/api/sabit")
def sabit_ekle(body: SabitBody):
    with db() as con:
        odeme = sabit_dogrula(con, body)
        cur = con.execute(
            "INSERT INTO sabit_gider(ad, kategori_id, tutar, odeme, gun, kdv_orani, aciklama, sira, aktif) "
            "VALUES(?,?,?,?,?,?,?,?,?)",
            (body.ad.strip(), body.kategori_id, r2(body.tutar), odeme, body.gun, r2(body.kdv_orani),
             body.aciklama.strip(), body.sira, int(body.aktif)))
        return dict(con.execute("SELECT * FROM sabit_gider WHERE id=?", (cur.lastrowid,)).fetchone())


@app.put("/api/sabit/{sid}")
def sabit_guncelle(sid: int, body: SabitBody):
    with db() as con:
        odeme = sabit_dogrula(con, body)
        cur = con.execute(
            "UPDATE sabit_gider SET ad=?, kategori_id=?, tutar=?, odeme=?, gun=?, kdv_orani=?, aciklama=?, sira=?, aktif=? "
            "WHERE id=?",
            (body.ad.strip(), body.kategori_id, r2(body.tutar), odeme, body.gun, r2(body.kdv_orani),
             body.aciklama.strip(), body.sira, int(body.aktif), sid))
        if cur.rowcount == 0:
            raise HTTPException(404, "Sabit gider bulunamadı")
        return dict(con.execute("SELECT * FROM sabit_gider WHERE id=?", (sid,)).fetchone())


@app.delete("/api/sabit/{sid}")
def sabit_sil(sid: int):
    with db() as con:
        n = con.execute("SELECT COUNT(*) c FROM gider WHERE sabit_id=?", (sid,)).fetchone()["c"]
        if n:
            raise HTTPException(409, f"Bu tanımdan oluşturulmuş {n} gider kaydı var. Silmek yerine pasif yapın.")
        con.execute("DELETE FROM sabit_gider WHERE id=?", (sid,))
        return {"tamam": True}


@app.post("/api/sabit/olustur")
def sabit_olustur(body: SabitOlusturBody):
    """Seçilen ay için henüz oluşturulmamış sabit giderleri gider kaydı olarak açar."""
    ay = ay_dogrula(body.ay)
    son_gun = calendar.monthrange(int(ay[:4]), int(ay[5:7]))[1]
    with db() as con:
        now = simdi()
        olusan = []
        for s in sabitleri_oku(con):
            if not s["aktif"]:
                continue
            if con.execute("SELECT 1 FROM gider WHERE sabit_id=? AND tarih LIKE ?", (s["id"], f"{ay}-%")).fetchone():
                continue
            tarih = f"{ay}-{min(int(s['gun']), son_gun):02d}"
            aciklama = s["ad"] + (f" · {s['aciklama']}" if s["aciklama"] else "")
            cur = con.execute(
                "INSERT INTO gider(tarih, kategori_id, tutar, kdv_orani, odeme, aciklama, olusturma, guncelleme, sabit_id) "
                "VALUES(?,?,?,?,?,?,?,?,?)",
                (tarih, s["kategori_id"], s["tutar"], s["kdv_orani"], s["odeme"], aciklama, now, now, s["id"]))
            olusan.append(gider_oku(con, gid=cur.lastrowid)[0])
        return {"olusturulan": len(olusan), "kayitlar": olusan}


# ---------------------------- personel -------------------------------------- #

@app.get("/api/personel")
def personel_liste():
    with db() as con:
        return personelleri_oku(con)


def personel_dogrula(body: PersonelBody) -> str:
    if not body.ad.strip():
        raise HTTPException(400, "Ad gerekli")
    if body.maas < 0:
        raise HTTPException(400, "Maaş negatif olamaz")
    return tarih_dogrula(body.baslangic) if body.baslangic.strip() else ""


@app.post("/api/personel")
def personel_ekle(body: PersonelBody):
    baslangic = personel_dogrula(body)
    with db() as con:
        cur = con.execute(
            "INSERT INTO personel(ad, gorev, maas, baslangic, notlar, sira, aktif) VALUES(?,?,?,?,?,?,?)",
            (body.ad.strip(), body.gorev.strip(), r2(body.maas), baslangic, body.notlar.strip(), body.sira, int(body.aktif)))
        return dict(con.execute("SELECT * FROM personel WHERE id=?", (cur.lastrowid,)).fetchone())


@app.put("/api/personel/{pid}")
def personel_guncelle(pid: int, body: PersonelBody):
    baslangic = personel_dogrula(body)
    with db() as con:
        cur = con.execute(
            "UPDATE personel SET ad=?, gorev=?, maas=?, baslangic=?, notlar=?, sira=?, aktif=? WHERE id=?",
            (body.ad.strip(), body.gorev.strip(), r2(body.maas), baslangic, body.notlar.strip(), body.sira, int(body.aktif), pid))
        if cur.rowcount == 0:
            raise HTTPException(404, "Personel bulunamadı")
        return dict(con.execute("SELECT * FROM personel WHERE id=?", (pid,)).fetchone())


@app.delete("/api/personel/{pid}")
def personel_sil(pid: int):
    with db() as con:
        n = con.execute("SELECT COUNT(*) c FROM gider WHERE personel_id=?", (pid,)).fetchone()["c"]
        if n:
            raise HTTPException(409, f"Bu personele ait {n} ödeme kaydı var. Silmek yerine 'ayrıldı' olarak işaretleyin.")
        con.execute("DELETE FROM personel WHERE id=?", (pid,))
        return {"tamam": True}


# ---------------------------- dışa aktarma / yedek -------------------------- #

def _csv_yanit(satirlar: list[list], dosya: str) -> Response:
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";", lineterminator="\r\n")
    for s in satirlar:
        w.writerow([str(x).replace(".", ",") if isinstance(x, float) else x for x in s])
    veri = "﻿" + buf.getvalue()  # BOM: Excel Türkçe karakterleri doğru açsın
    return Response(veri.encode("utf-8"), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{dosya}"'})


@app.get("/api/disa-aktar/gelir.csv")
def gelir_csv(bas: Optional[str] = None, bit: Optional[str] = None):
    with db() as con:
        yontemler = yontemleri_oku(con)
        gunler = gelir_oku(con, tarih_dogrula(bas) if bas else None, tarih_dogrula(bit) if bit else None)
    baslik = ["Tarih"] + [y["ad"] for y in yontemler] + ["Toplam", "Komisyon", "KDV", "Net", "Açıklama"]
    satirlar = [baslik]
    for g in sorted(gunler, key=lambda x: x["tarih"]):
        tut = {k["yontem_id"]: k for k in g["kalemler"]}
        toplam = sum(k["tutar"] for k in g["kalemler"])
        kom = sum(k["tutar"] * k["komisyon_orani"] / 100 for k in g["kalemler"])
        kdv = sum(k["tutar"] * k["kdv_orani"] / (100 + k["kdv_orani"]) for k in g["kalemler"] if k["kdv_orani"])
        satir = [g["tarih"]] + [r2(tut[y["id"]]["tutar"]) if y["id"] in tut else 0.0 for y in yontemler]
        satir += [r2(toplam), r2(kom), r2(kdv), r2(toplam - kom), g["aciklama"]]
        satirlar.append(satir)
    return _csv_yanit(satirlar, "gelir.csv")


@app.get("/api/disa-aktar/gider.csv")
def gider_csv(bas: Optional[str] = None, bit: Optional[str] = None):
    with db() as con:
        kats = {k["id"]: k for k in kategorileri_oku(con)}
        pers = {p["id"]: p["ad"] for p in personelleri_oku(con)}
        giderler = gider_oku(con, tarih_dogrula(bas) if bas else None, tarih_dogrula(bit) if bit else None)
    odeme_ad = {"nakit": "Nakit", "banka": "Banka", "kart": "Kart"}
    satirlar = [["Tarih", "Grup", "Kategori", "Tutar", "KDV %", "KDV Tutarı", "Ödeme", "Personel", "Açıklama"]]
    for g in sorted(giderler, key=lambda x: (x["tarih"], x["id"])):
        k = kats.get(g["kategori_id"], {"ad": "?", "grup_ad": "?"})
        kdv_t = g["tutar"] * g["kdv_orani"] / (100 + g["kdv_orani"]) if g["kdv_orani"] else 0.0
        satirlar.append([g["tarih"], k["grup_ad"], k["ad"], r2(g["tutar"]), r2(g["kdv_orani"]), r2(kdv_t),
                         odeme_ad.get(g["odeme"], g["odeme"]), pers.get(g.get("personel_id"), ""), g["aciklama"]])
    return _csv_yanit(satirlar, "gider.csv")


@app.get("/api/yedek")
def yedek_al():
    with db() as con:
        veri = {
            "surum": 2,
            "uygulama": "sirkeci-kebap-portal",
            "tarih": simdi(),
            "ayar": ayarlari_oku(con),
            "yontemler": yontemleri_oku(con),
            "gruplar": gruplari_oku(con),
            "kategoriler": [{k: v for k, v in kat.items() if k not in ("grup_ad", "grup_renk")}
                            for kat in kategorileri_oku(con)],
            "sabitler": sabitleri_oku(con),
            "personeller": personelleri_oku(con),
            "gelir": gelir_oku(con),
            "gider": gider_oku(con),
        }
    adi = f"sirkeci-yedek-{date.today().isoformat()}.json"
    return JSONResponse(veri, headers={"Content-Disposition": f'attachment; filename="{adi}"'})


@app.post("/api/yedek/geri-yukle")
def yedek_yukle(body: YedekBody):
    if body.surum not in (1, 2):
        raise HTTPException(400, "Desteklenmeyen yedek sürümü")
    with db() as con:
        con.execute("PRAGMA foreign_keys = OFF")
        for t in ("gelir_kalem", "gelir_gun", "gider", "kategori", "grup", "odeme_yontemi", "sabit_gider", "personel"):
            con.execute(f"DELETE FROM {t}")
        for a in ("isletme_adi", "kdv_orani", "para_birimi", "tema", "personel_kategori_id"):
            if a in body.ayar and body.ayar[a] is not None:
                ayar_yaz(con, a, str(body.ayar[a]))
        for y in body.yontemler:
            con.execute("INSERT INTO odeme_yontemi(id, ad, tur, komisyon_orani, renk, sira, aktif) VALUES(?,?,?,?,?,?,?)",
                        (y["id"], y["ad"], y.get("tur", "diger"), y.get("komisyon_orani", 0), y.get("renk", 1),
                         y.get("sira", 0), int(y.get("aktif", 1))))
        for g in body.gruplar:
            con.execute("INSERT INTO grup(id, ad, renk, sira) VALUES(?,?,?,?)",
                        (g["id"], g["ad"], g.get("renk", 1), g.get("sira", 0)))
        for k in body.kategoriler:
            con.execute("INSERT INTO kategori(id, ad, grup_id, kdv_orani, sira, aktif) VALUES(?,?,?,?,?,?)",
                        (k["id"], k["ad"], k["grup_id"], k.get("kdv_orani", 0), k.get("sira", 0), int(k.get("aktif", 1))))
        for s in body.sabitler:
            con.execute("INSERT INTO sabit_gider(id, ad, kategori_id, tutar, odeme, gun, kdv_orani, aciklama, sira, aktif) "
                        "VALUES(?,?,?,?,?,?,?,?,?,?)",
                        (s["id"], s["ad"], s["kategori_id"], s.get("tutar", 0), s.get("odeme", "banka"), s.get("gun", 1),
                         s.get("kdv_orani", 0), s.get("aciklama", ""), s.get("sira", 0), int(s.get("aktif", 1))))
        for p in body.personeller:
            con.execute("INSERT INTO personel(id, ad, gorev, maas, baslangic, notlar, sira, aktif) VALUES(?,?,?,?,?,?,?,?)",
                        (p["id"], p["ad"], p.get("gorev", ""), p.get("maas", 0), p.get("baslangic", ""), p.get("notlar", ""),
                         p.get("sira", 0), int(p.get("aktif", 1))))
        now = simdi()
        for g in body.gelir:
            gid = con.execute("INSERT INTO gelir_gun(tarih, aciklama, olusturma, guncelleme) VALUES(?,?,?,?)",
                              (tarih_dogrula(g["tarih"]), g.get("aciklama", ""), now, g.get("guncelleme") or now)).lastrowid
            for k in g.get("kalemler", []):
                con.execute("INSERT INTO gelir_kalem(gun_id, yontem_id, tutar, komisyon_orani, kdv_orani) VALUES(?,?,?,?,?)",
                            (gid, k["yontem_id"], k.get("tutar", 0), k.get("komisyon_orani", 0), k.get("kdv_orani", 0)))
        for g in body.gider:
            con.execute("INSERT INTO gider(tarih, kategori_id, tutar, kdv_orani, odeme, aciklama, olusturma, guncelleme, "
                        "sabit_id, personel_id) VALUES(?,?,?,?,?,?,?,?,?,?)",
                        (tarih_dogrula(g["tarih"]), g["kategori_id"], g["tutar"], g.get("kdv_orani", 0),
                         g.get("odeme", "nakit"), g.get("aciklama", ""), g.get("olusturma") or now, g.get("guncelleme") or now,
                         g.get("sabit_id"), g.get("personel_id")))
        # tutarlılık kontrolü
        hata = con.execute("PRAGMA foreign_key_check").fetchall()
        if hata:
            raise HTTPException(400, "Yedek dosyası tutarsız (eksik kategori/yöntem referansı)")
        con.execute("PRAGMA foreign_keys = ON")
    return {"tamam": True, "gelir": len(body.gelir), "gider": len(body.gider)}


app.mount("/static", StaticFiles(directory=STATIC), name="static")
