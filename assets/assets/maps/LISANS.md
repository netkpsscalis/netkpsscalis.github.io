# Harita dosyalarının kaynağı ve lisansı

## `turkiye.svg`

| | |
|---|---|
| **Özgün ad** | `Turkey adm location map.svg` |
| **Yapan** | NordNordWest |
| **Kaynak** | https://commons.wikimedia.org/wiki/File:Turkey_adm_location_map.svg |
| **Lisans** | Creative Commons Attribution-ShareAlike 3.0 Germany (CC BY-SA 3.0 DE) |
| **Lisans metni** | https://creativecommons.org/licenses/by-sa/3.0/de/deed.tr |
| **Veri kaynağı** | United States National Imagery and Mapping Agency + World Data Base II |
| **İndirilme** | 14 Ağustos 2026 |
| **Boyut / viewBox** | 747,6 KB · `0 0 1577.906 721.302` |

### Bu lisans bizden ne istiyor

1. **Atıf:** uygulamada haritanın yapanı ve lisansı görünmeli. Bunu
   Haritalar ekranındaki bilgi satırı karşılıyor:
   *"Harita: NordNordWest · CC BY-SA 3.0 DE"*
2. **Aynı lisansla paylaşma:** bu SVG dosyası ve üzerinde yaptığımız
   değişiklikler CC BY-SA 3.0 DE olarak kalır. **Uygulamanın kendi kaynak
   kodunu bağlamaz** — harita ayrı bir varlık, uygulamanın türevi değil.
3. **Değişiklik belirtme:** dosyada değişiklik yaparsak burada yazılmalı.

### Yaptığımız değişiklikler

- (henüz yok — dosya indirildiği gibi duruyor)

---

## ⚠️ BU DOSYAYI DEĞİŞTİRME

Haritadaki öğelerin (sınır kapıları, dağlar, göller…) konumu veritabanında
**bu dosyanın `viewBox`una göre 0..1 arası normalize** saklanıyor.

`viewBox` değişirse **bütün iğneler kayar.** Aynı dosya hem uygulamada hem
yönetim panelinde kullanılıyor; ikisi birbirinin aynısı olmak zorunda.

Harita değiştirilmesi gerekiyorsa: yeni dosya **yeni bir `base_map` adıyla**
eklenir, eskisi yerinde bırakılır. `map_layers.base_map` hangi katmanın
hangi haritayı kullandığını tutar.

---

## Bu haritanın yapısı (neyi yapar, neyi yapmaz)

| | |
|---|---|
| Türkiye | 26 dolgu yolu — **tek parça**, iller ayrı şekiller değil |
| Komşu ülkeler | 60 dolgu yolu, gri (`#E0E0E0`) |
| Deniz ve göller | 27 dolgu yolu (`#C6ECFF`) |
| Sınırlar ve kıyılar | 237 çizgi yolu (dolgusuz) |

**YAPAR:** harita üzerinde nokta göstermek (sınır kapıları, dağlar, göller,
barajlar, havaalanları). Komşu ülkeler göründüğü için sınır kapıları
konusunda özellikle iyi.

**YAPMAZ:** "hangi ile dokunuldu" sorusunu yanıtlamak. İl sınırları burada
çizgi olarak çizilmiş, dokunulabilecek kapalı bir il şekli yok. İl/bölge
seçtiren konular geldiğinde **illeri ayrı ayrı kapalı yol olarak içeren
ikinci bir harita** eklenmeli (`base_map = 'turkiye_iller'`).

---

## `tr_iller.json` — 81 il sınırı (Faz 34, 30 Ağustos 2026)

| | |
|---|---|
| **Kaynak** | https://github.com/alpers/Turkey-Maps-GeoJSON (`tr-cities.json`) |
| **Lisans** | **Apache-2.0** |
| **Biçim** | GeoJSON, gerçek enlem/boylam (WGS 84) |
| **İçerik** | 81 il · `{"name": "Adana", "number": 1}` — ad ve **plaka kodu** |
| **Boyut** | 241 KB → **116 KB** |

### Yaptığımız değişiklikler

1. **Koordinat basamağı 4'e indirildi.** Kaynak dosya 15 basamak
   taşıyordu (`35.279026031494084` — nanometre hassasiyeti). Ülke
   ölçeğinde 4 basamak ≈ 11 metre; fazlası boşuna yer kaplıyordu.
   Dosya yarıya indi, görüntüde hiçbir fark yok.
2. **`Afyon` → `Afyonkarahisar`.** İlin 2004'ten beri resmî adı bu;
   KPSS'de resmî ad sorulur.

### Bu lisans bizden ne istiyor

Apache-2.0 atıf ister, **aynı lisansla paylaşmayı istemez**. Yani bu
dosya uygulamanın kaynak kodunu hiçbir şekilde bağlamıyor —
`turkiye.svg`'nin CC BY-SA'sından bu yönüyle daha rahat.

---

## `tr_komsular.json` — komşu ülkeler (Faz 34)

| | |
|---|---|
| **Kaynak** | Natural Earth 1:50m · `ne_50m_admin_0_countries` |
| **Lisans** | **Kamu malı** — atıf bile zorunlu değil |
| **İçerik** | Suriye, Irak, İran, Yunanistan, Gürcistan, Kıbrıs, Bulgaristan, Azerbaycan, Ermenistan |
| **Boyut** | 3,0 MB → **47 KB** |

### Yaptığımız değişiklikler

1. **Dokuz ülke ayıklandı**, kalan dünya atıldı.
2. **Türkiye çevresine kırpıldı** (24–48° D, 33–45° K). İran'ın doğusu
   ve uzak adalar gibi ekranda hiç görünmeyecek parçalar düştü.
3. **Adlar Natural Earth'ün kendi `NAME_TR` alanından** alındı —
   çevrilmedi, kaynağın Türkçesi kullanıldı.
4. Koordinat basamağı 4'e indirildi (yukarıdaki gerekçe).

> Komşular her katmanda çizilmez. `map_layers.show_neighbours` alanı
> hangi katmanın komşuları göstereceğini tutar — sınır kapıları için
> açılır, iç coğrafya konularında kapalı kalır.

---

## Hangi dosya nerede kullanılıyor

| Dosya | Kullanan | Durum |
|---|---|---|
| `tr_iller.json` | `flutter_map` · `PolygonLayer` | **Etkin** |
| `tr_komsular.json` | `flutter_map` · `PolygonLayer` | **Etkin** (katman isterse) |
| `turkiye.svg` | `lib/core/turkiye_map.dart` | **Emekliye ayrılıyor** — sınır kapıları katmanı yeniden üretilince silinecek |
