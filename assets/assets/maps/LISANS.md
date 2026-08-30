# Harita dosyalarının kaynağı ve lisansı

Bu klasördeki üç dosya uygulamanın haritasını çiziyor. Hiçbiri internetten
çekilmiyor — harita tamamen çevrimdışı çalışıyor.

| Dosya | Ne çizer | Kaynak | Lisans |
|---|---|---|---|
| `tr_iller.json` | 81 il sınırı | OpenStreetMap + Natural Earth | **ODbL** |
| `tr_sinir.json` | Türkiye'nin dış hattı | (aynı, illerin birleşimi) | **ODbL** |
| `tr_komsular.json` | 9 komşu ülke | Natural Earth | Kamu malı |

---

## ⚠️ ATIF ZORUNLU

`tr_iller.json` ve `tr_sinir.json` OpenStreetMap verisinden türetildi.
**ODbL lisansı atfı ŞART koşuyor.** Uygulamada Haritalar ekranının
altındaki şu satır bu yükümlülüğü karşılıyor:

> © OpenStreetMap katkıcıları · Natural Earth

**Bu satırı kaldırma.** Kaldırmak lisans ihlalidir.

ODbL'in "aynı lisansla paylaş" koşulu türetilmiş **veritabanları** için
geçerlidir. Haritayı ekranda göstermek "Produced Work" sayılır ve
**uygulamanın kendi kaynak kodunu bağlamaz** — yalnızca atıf gerekir.
Bu klasördeki iki JSON dosyası ise ODbL olarak kalır.

---

## `tr_iller.json` — 81 il (Faz 39, 30 Ağustos 2026)

| | |
|---|---|
| **İç sınırlar** | https://github.com/izzetkalic/geojsons-of-turkey (`turkey-admin-level-4`, OSM'den Overpass ile) |
| **Kıyı** | Natural Earth 1:10m `ne_10m_land` + `ne_10m_minor_islands` |
| **İçerik** | `{"name": "Adana", "number": 1}` — ad ve **plaka kodu** |
| **Boyut** | 12,3 MB → **559 KB** |

### İKİ KAYNAK NEDEN BİRLEŞTİRİLDİ

Bu dosyanın en önemli özelliği bu; değiştirmeden önce oku.

OSM'nin idari sınırları **iç il sınırlarında** çok iyi: il başına 1866
nokta, gerçek sınır çizgileri. Ama **kıyıda yanlış** — idari sınır
karasularını içeriyor.

Ölçüldü: yalnızca OSM kullanılınca Türkiye'nin alanı **833.724 km²**
çıkıyor. Gerçek yüzölçümü 783.562 km². Yani **~50.000 km² deniz kara
sayılıyordu** ve harita Türkiye'yi denize taşmış gösteriyordu.

Natural Earth'ün kara poligonu bunun tam tersi: kıyı doğru, il sınırı yok.

Çözüm, OSM illerini Natural Earth karasıyla **kesiştirmek**. Sonuç:
alan **766.619 km²** (gerçeğe göre −2,2 %), iç sınırlar OSM'den, kıyı
Natural Earth'ten. Haritacılıkta standart yol budur.

### Yapılan diğer işlemler

1. **Douglas-Peucker ile sadeleştirme**, eşik 0,002° (~200 m). İl başına
   1866 → 352 nokta. Bir önceki veri 74 noktadaydı; Yunus "şehir
   sınırları çok kötü" dediğinde sorun buydu.
2. Koordinat basamağı 5'e indirildi (~1 m).
3. Adlar OSM'nin `name:tr` alanından — çevrilmedi.

---

## `tr_sinir.json` — Türkiye'nin dış hattı

İllerin **tam çözünürlükte** birleşimi, sonra 0,0015° ile sadeleştirildi.

### Neden ayrı bir dosya

İki işi birden yapıyor:

1. **Yarıkları kapatır.** Her il ayrı ayrı sadeleştirilince komşu illerin
   ortak sınırı birbirinden birkaç yüz metre ayrılır ve aralarında ince
   yarıklar oluşur. Bu dosya illerin ALTINA kara rengiyle çiziliyor;
   yarık olsa bile altından deniz değil kara çıkıyor.
2. **Ülkeye silüet verir.** İl sınırları ince, ülke sınırı kalın çiziliyor.
   Haritaya "harita havası" veren ayrım budur — tek tip çizgiyle çizilen
   harita şema gibi görünüyordu.

> Birleştirme **önce** yapılır, sadeleştirme **sonra**. Ters sırada iç
> sınırlarda sahte delikler kalırdı.

---

## `tr_komsular.json` — komşu ülkeler

| | |
|---|---|
| **Kaynak** | Natural Earth 1:50m `ne_50m_admin_0_countries` |
| **Lisans** | **Kamu malı** — atıf bile zorunlu değil |
| **İçerik** | Suriye, Irak, İran, Yunanistan, Gürcistan, Kıbrıs, Bulgaristan, Azerbaycan, Ermenistan |
| **Boyut** | 3,0 MB → **47 KB** |

Türkiye çevresine kırpıldı (24–48° D, 33–45° K), adlar Natural Earth'ün
kendi `NAME_TR` alanından alındı.

> Komşular her katmanda çizilmez. `map_layers.show_neighbours` hangi
> katmanın göstereceğini tutar — sınır kapıları için açılır, iç coğrafya
> konularında kapalı kalır.

---

## Kaldırılan: `turkiye.svg`

Faz 17A'da kullanılan NordNordWest SVG'si (765 KB, CC BY-SA 3.0 DE)
**Faz 39'da silindi.** Faz 34'te çizim GeoJSON'a geçmişti ve dosyayı
hiçbir uygulama kodu kullanmıyordu; yalnızca kendi testi ayakta
tutuyordu. Onunla birlikte `lib/core/turkiye_map.dart`, testi ve
`path_drawing` + `xml` paketleri de kaldırıldı.

O harita Türkiye'yi **tek şekil** olarak çiziyordu (bütün dosyada tek
kimlik: `id="Turkey"`), yani "hangi ile dokunuldu?" sorusunu
yanıtlayamıyordu. Bugünkü yapıya geçilmesinin sebebi buydu.
