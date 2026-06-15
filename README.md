# Peta Kuliner Malang - Static GitHub Pages

Aplikasi ini dibuat sebagai **static web app**. Kamu cukup upload file ke GitHub Pages. Tidak perlu Visual Studio, Node.js, npm, server pribadi, atau build step.

Fitur utama:

- Login Google via Firebase Authentication.
- Peta Kota Malang via Leaflet + OpenStreetMap.
- Tambah titik kuliner dengan klik lokasi peta.
- Isi nama tempat, makanan populer, area, kategori, harga, catatan, dan foto.
- Komentar di setiap titik kuliner.
- Statistik makanan paling sering dikontribusikan per area.
- Filter area, kategori, dan pencarian.

## Kenapa perlu Firebase?

GitHub Pages hanya menyajikan file statis seperti HTML, CSS, dan JavaScript. Supaya aplikasi bisa punya login Google, database komentar, dan upload gambar, kita butuh layanan backend. Di paket ini backend-nya memakai Firebase.

Firebase yang dipakai:

1. **Authentication** untuk login Google.
2. **Cloud Firestore** untuk menyimpan titik kuliner dan komentar.
3. **Firebase Storage** untuk menyimpan foto.

## Konfigurasi tanpa coding

Paket ini punya file:

```text
setup-wizard.html
```

Fungsinya membuat file `firebase-config.js` secara otomatis dari konfigurasi Firebase yang kamu salin.

Langkah singkat:

1. Buka Firebase Console.
2. Buat project baru, misalnya `malang-food-map`.
3. Tambahkan Web App dari ikon `</>`.
4. Salin konfigurasi yang bentuknya seperti:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

5. Buka `setup-wizard.html` di browser.
6. Tempel konfigurasi itu.
7. Klik **Buat file firebase-config.js**.
8. Download hasilnya.
9. Upload file hasil download untuk mengganti `firebase-config.js` lama di repository GitHub.

## Checklist Firebase

### 1. Aktifkan Google Login

Firebase Console → Authentication → Sign-in method → Google → Enable → Save.

### 2. Tambahkan domain GitHub Pages

Firebase Console → Authentication → Settings → Authorized domains.

Tambahkan domain GitHub Pages kamu, contoh:

```text
username.github.io
```

Kalau kamu pakai custom domain, tambahkan juga domain itu.

### 3. Aktifkan Firestore

Firebase Console → Firestore Database → Create database.

Lalu buka tab Rules, tempel isi file:

```text
firestore.rules
```

Klik Publish.

### 4. Aktifkan Storage

Firebase Console → Storage → Get started.

Lalu buka tab Rules, tempel isi file:

```text
storage.rules
```

Klik Publish.

## Upload ke GitHub Pages

1. Buat repository GitHub baru.
2. Upload semua file dari folder ini ke root repository.
3. Masuk ke Settings → Pages.
4. Source: Deploy from a branch.
5. Branch: `main`.
6. Folder: `/root`.
7. Save.
8. Buka link GitHub Pages yang diberikan GitHub.

## File penting

```text
index.html              Halaman utama aplikasi
styles.css              Tampilan aplikasi
app.js                  Logika peta, login, komentar, foto
firebase-config.js      File koneksi Firebase
setup-wizard.html       Pembuat firebase-config.js tanpa coding
firestore.rules         Aturan keamanan database
storage.rules           Aturan keamanan upload foto
README.md               Panduan ini
```

## Catatan keamanan

`firebase-config.js` memang akan terlihat publik di browser. Itu normal untuk Firebase Web App. Keamanan data tetap diatur lewat `firestore.rules`, `storage.rules`, dan Authorized domains.

## Jika login error

- Error `auth/unauthorized-domain`: tambahkan domain GitHub Pages ke Authorized domains di Firebase Authentication.
- Error `permission-denied`: rules Firestore belum dipublish atau belum sesuai.
- Error `storage/unauthorized`: rules Storage belum dipublish atau user belum login.

## Batas area peta

Peta dikunci ke area Kota Malang memakai koordinat batas kasar:

```js
[
  [-8.075, 112.505],
  [-7.865, 112.755]
]
```

Kalau nanti kamu ingin peta melebar sampai Kabupaten Malang atau Batu, nilai batas ini bisa disesuaikan di `app.js` pada bagian `MALANG_BOUNDS`.
