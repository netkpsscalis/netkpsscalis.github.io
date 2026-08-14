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
