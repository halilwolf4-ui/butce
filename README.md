# 🔍 Büyüteç Bütçe (Magnifier Budget)

Modern, stilize ve yüksek performanslı kişisel bütçe, harcama ve birikim yönetim mobil web uygulaması.

---

## 📱 Özellikler (Features)

### 1. 📊 Genel Bakış (Overview)
- **Dokunmatik Kaydırılabilir Tampon & Harcama Kartı:** Parmağınızla sağa-sola kaydırabileceğiniz (touch-snap) "Toplam Birikmiş Tampon" ve "En Çok Harcananlar (Top 5)" paneli.
- **Kombine Tampon Analizi:** Aylık bütçe nakit fazlaları ile yatırım portföyünü birleştirip aralarındaki oranı canlı olarak gösterir.
- **Yıllık Denge (Tug of War):** Yıllık gelir ve gider oranını interaktif, animasyonlu denge çubuğunda görselleştirir.
- **Toplam Kalan Borç Takibi:** Kredi kartı ve tüketici kredisi taksitlerinin anlık toplamı.
- **12 Aylık Takvim Matrisi:** Maaş döngü gününüze göre (ör. 15'i - 14'ü) her ayın net nakit durumunu renk kodlarıyla gösterir.

### 2. 🪙 Bu Ay (Bütçe & Harcama Düzenleyici)
- **En Üste Kategori Ekleme:** Eklenen yeni harcama kategorileri hemen en üste yerleşir.
- **Kategori Sıralama:** Kategorileri yukarı/aşağı butonlarıyla dilediğiniz gibi sıralayabilir ve kaydedebilirsiniz.
- **Otomatik Tamamlama & Öneri Listesi (Autocomplete):** Geçmiş aylardaki harcama ve kategori isimlerini otomatik önererek yazım hatalarından doğan kategori bölünmelerini engeller.
- **İnteraktif Grafikler:** Günlük kümülatif harcama eğrisi ve kategori dağılım donut grafiği.
- **Hızlı Ödeme:** Kalıcı gelir ve giderleri (Maaş, Kira, Aidat vb.) tek tuşla ödeme ("💰 Al" / "💸 Öde").
- **Kilitlenebilir Canlı Sürgü:** 0–50.000 ₺ aralığında harcama limitini dokunarak hızlıca ayarlama.
- **Borç Ödeme & İade Mekanizması:** Taksit ödemesi yapıldığında genel borçtan düşer; işlem silinirse tutar borca otomatik iade edilir.

### 3. 🐷 Birikim & Yatırım Portföyü (Savings & Portfolio)
- **Varlık Sınıfları:** 
  - 📊 Yatırım Fonları (TEFAS)
  - ✨ Altın & Değerli Madenler
  - 📈 Borsa & Hisse Senetleri
  - ⚡ Kripto Varlıklar
  - ⏳ Vadeli Mevduat & Faiz
  - 💵 Döviz & Yabancı Para
- **Tampon Entegrasyonu:** Birikimlerin toplam tampon içindeki yüzdesini hesaplar.
- **Hızlı Güncelleme:** Varlık değerlerini tek dokunuşla düzenleme ve hedef/not ekleme.

### 4. ⚙️ Ayarlar & Güvenlik (Settings)
- **Maaş Döngüsü:** Ay başı kesim gününü (1–31) dilediğiniz güne ayarlama.
- **Yedekleme:** Tüm verileri tek tıkla `.json` formatında indirme ve geri yükleme.
- **Çoklu Kullanıcı Desteği:** Şifreli yerel kullanıcı hesapları ve oturum yönetimi.
- **Tema:** Gece (Dark) ve Gündüz (Light) modları arasında anında geçiş.

---

## 🛠️ Teknolojiler (Tech Stack)

- **Frontend:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Derleyici / Build:** [Vite](https://vite.dev/)
- **Stil / Tasarım:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animasyonlar:** [Motion (Framer Motion)](https://motion.dev/)
- **İkon Seti:** [Lucide React](https://lucide.dev/)
- **Veri Depolama:** LocalStorage (Offline-First, İstemci Tarafında Güvenli)

---

## 🚀 Kurulum ve Çalıştırma (Installation & Running)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri önerilir)

### Adımlar

1. Depoyu klonlayın veya indirin:
   ```bash
   git clone https://github.com/kullaniciadi/buyutec-butce.git
   cd buyutec-butce
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   # veya
   bun install
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda açın:
   ```
   http://localhost:3000
   ```

### Yayına Alma / Build

Canlı ortam için optimize edilmiş statik dosyaları üretmek için:
```bash
npm run build
```
Oluşan `dist/` klasörünü Vercel, Netlify, Cloudflare Pages veya GitHub Pages üzerine doğrudan yükleyebilirsiniz.

---

## 📁 Proje Yapısı (Project Structure)

```
buyutec-butce/
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx          # Giriş & Çoklu Kullanıcı Modalı
│   │   ├── BottomNav.tsx          # 4 Sekmeli Alt Navigasyon (Bu Ay, Birikim...)
│   │   ├── BrandLogo.tsx          # Optimize Vektör Büyüteç Logosu
│   │   ├── Modals.tsx             # Borç, Taksit ve İşlem Modalları
│   │   ├── MonthEditorTab.tsx     # Bu Ay / Bütçe ve Harcama Düzenleyici
│   │   ├── MonthlyChart.tsx       # Harcama Eğrisi ve Kategori Halka Grafiği
│   │   ├── OverviewTab.tsx        # Genel Bakış & Dokunmatik Slayt Paneli
│   │   ├── SavingsTab.tsx         # Birikim & Yatırım Varlıkları Portföyü
│   │   ├── SettingsTab.tsx        # Ayarlar & JSON Yedekleme
│   │   ├── ThemeToggle.tsx        # Koyu/Açık Tema Anahtarı
│   │   └── TugOfWarBar.tsx        # Yıllık Denge Karşılaştırma Çubuğu
│   ├── utils/
│   │   └── storage.ts             # Veri Saklama ve Kalıcı İşlem Senkronu
│   ├── App.tsx                    # Ana Uygulama Kabuğu
│   ├── index.css                  # Tailwind ve Mobil Scrollbar Kuralları
│   ├── main.tsx                   # React Başlangıç Noktası
│   └── types.ts                   # TypeScript Veri Modelleri
├── index.html                     # HTML Şablonu
├── metadata.json                  # Proje Bilgileri
├── package.json                   # Bağımlılıklar ve Komutlar
├── tsconfig.json                  # TypeScript Yapılandırması
├── vite.config.ts                 # Vite Yapılandırması
└── README.md                      # Proje Dokümantasyonu
```

---

## 📄 Lisans (License)

Apache-2.0 © 2026 Büyüteç Bütçe.
