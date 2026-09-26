# 💊 İlaç Takip Pro

Profesyonel çok dilli ilaç takip uygulaması — Web + iOS + Android

---

## Özellikler

- **11 Dil**: TR, EN, DE, FR, ES, PT, RU, ZH, JA, KO, AR (RTL dahil)
- **Karanlık Mod**: Açık / Koyu / Sistem teması
- **Çoklu Profil**: Aile üyeleri için ayrı profiller
- **Gerçek Alarm**: Expo ile telefon alarm sistemi entegrasyonu
- **PWA**: Web'de offline çalışma

---

## Web Kurulumu (Mevcut Proje)

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu
npm run dev

# Production build
npm run build
```

### Gerekli paketler (henüz yüklü değilse):
```bash
npm install react-i18next i18next i18next-browser-languagedetector
npm install zustand
npm install lucide-react
```

---

## Mobil Kurulum (Expo)

```bash
# Yeni Expo projesi
npx create-expo-app ilac-takip-mobile --template blank-typescript
cd ilac-takip-mobile

# Bağımlılıklar
npx expo install expo-notifications expo-device
npx expo install @react-native-async-storage/async-storage
npm install zustand react-i18next i18next
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# src/store/, src/types/, src/i18n/ klasörlerini kopyala

# Geliştirme
npx expo start --tunnel   # Expo Go ile test
npx expo build:android    # Play Store
npx expo build:ios        # App Store
```

---

## Klasör Yapısı

```
src/
├── i18n/
│   ├── index.ts              ← i18next yapılandırması
│   └── locales/
│       ├── tr.json, en.json, de.json, ar.json
│       ├── fr.json, es.json, pt.json, ru.json
│       └── zh.json, ja.json, ko.json
├── store/
│   ├── useMedStore.ts        ← İlaç & doz yönetimi
│   ├── useThemeStore.ts      ← Tema yönetimi
│   └── useProfileStore.ts   ← Profil yönetimi
├── services/
│   └── AlarmService.ts      ← Expo alarm sistemi
├── types/
│   └── index.ts
└── components/
    ├── Settings.tsx          ← Dil + Tema + Profil
    ├── Dashboard.tsx
    ├── MedicationList.tsx
    ├── History.tsx
    ├── Stats.tsx
    └── Notes.tsx
```

---

## Yol Haritası

- [x] i18n sistemi (11 dil)
- [x] Karanlık mod
- [x] Çoklu profil
- [x] Alarm servisi (Expo)
- [x] PWA manifest
- [ ] Expo projesine taşıma
- [ ] App Store / Play Store yayını

