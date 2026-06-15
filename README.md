# Peta Kuliner Malang - Static GitHub Pages

Aplikasi web statis untuk peta makanan khusus Kota Malang. Bisa diupload langsung ke GitHub Pages tanpa Node.js, tanpa npm, tanpa build step, dan tanpa Visual Studio.

## Fitur

- Login Google via Firebase Authentication.
- Peta Leaflet + OpenStreetMap dengan area dibatasi sekitar Kota Malang.
- Kontribusi titik kuliner: nama tempat, makanan populer, area, kategori, harga, catatan, dan foto.
- Komentar per titik kuliner.
- Daftar makanan populer berdasarkan jumlah kontribusi per area.
- Filter area, kategori, dan pencarian makanan/tempat.
- Identitas kontributor tersimpan dari akun Google: UID, nama, email, dan foto profil.

## Struktur file

```text
index.html          # Halaman utama
styles.css          # Tampilan UI
app.js              # Logika aplikasi, Firebase, peta, komentar, upload foto
firebase-config.js  # Tempat menaruh konfigurasi Firebase kamu
firestore.rules     # Rules Firestore yang disarankan
storage.rules       # Rules Storage yang disarankan
README.md           # Panduan ini
```

## 1. Buat Firebase project

1. Buka Firebase Console.
2. Buat project baru, misalnya `peta-kuliner-malang`.
3. Tambahkan app Web.
4. Salin konfigurasi `firebaseConfig`.
5. Buka file `firebase-config.js`, lalu ganti semua nilai `ISI_...` dengan konfigurasi dari Firebase.

Contoh bentuknya:

```js
window.MALANG_FOOD_MAP_FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "nama-project.firebaseapp.com",
  projectId: "nama-project",
  storageBucket: "nama-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:xxxx"
};
```

Catatan: konfigurasi Firebase Web memang akan terlihat di browser. Keamanan utama tetap harus lewat Firebase Security Rules dan pembatasan domain.

## 2. Aktifkan Google Login

1. Firebase Console > Authentication > Sign-in method.
2. Aktifkan provider Google.
3. Setelah web GitHub Pages aktif, buka Authentication > Settings > Authorized domains.
4. Tambahkan domain GitHub Pages kamu, misalnya:

```text
username.github.io
```

Kalau pakai custom domain, tambahkan juga domain custom tersebut.

## 3. Aktifkan Firestore

1. Firebase Console > Firestore Database.
2. Create database.
3. Pilih mode production.
4. Buka tab Rules.
5. Salin isi file `firestore.rules`, lalu Publish.

## 4. Aktifkan Storage

1. Firebase Console > Storage.
2. Create bucket.
3. Buka tab Rules.
4. Salin isi file `storage.rules`, lalu Publish.

Foto dibatasi dari sisi aplikasi dan rules maksimal 5 MB per file.

## 5. Upload ke GitHub Pages

Cara paling sederhana:

1. Buat repository baru di GitHub, misalnya `peta-kuliner-malang`.
2. Upload semua file di folder ini ke root repository.
3. Masuk ke repository > Settings > Pages.
4. Source: Deploy from a branch.
5. Branch: `main`, folder: `/root`.
6. Simpan.
7. Buka link yang diberikan GitHub Pages.

Biasanya linknya seperti ini:

```text
https://username.github.io/peta-kuliner-malang/
```

## 6. Uji cepat

1. Buka link GitHub Pages.
2. Login dengan Google.
3. Klik `Tambah titik kuliner`.
4. Klik lokasi di peta Malang.
5. Isi data makanan dan upload foto.
6. Buka marker yang muncul, lalu coba komentar.

## 7. Penyesuaian batas Kota Malang

Batas saat ini memakai bounding box kasar sekitar Kota Malang agar peta tidak bisa digeser jauh keluar kota. Kalau ingin lebih presisi memakai batas administratif polygon, edit bagian ini di `app.js`:

```js
const MALANG_BOUNDS = [
  [-8.075, 112.505],
  [-7.865, 112.755]
];
```

## 8. Catatan penting produksi

- Rules bawaan sudah cukup untuk prototipe publik kecil, tapi tetap pantau penggunaan Firebase.
- Aktifkan Firebase App Check jika trafik mulai besar atau rawan spam.
- Untuk moderasi serius, idealnya tambahkan halaman admin atau Cloud Functions.
- Karena ini static app, semua validasi berat tidak boleh hanya mengandalkan JavaScript; rules tetap wajib.
