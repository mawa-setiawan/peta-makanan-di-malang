# Peta Kuliner Malang - Static GitHub Pages

Ini adalah aplikasi web HTML statis untuk membuat peta kontribusi makanan khusus Kota Malang.

Versi ini **tidak memakai Google Login**. Pengunjung cukup mengisi:

- Nama
- Alamat email

Setelah itu mereka bisa:

- Melihat peta Kota Malang
- Menambah titik kuliner dengan klik lokasi di peta
- Mengisi nama tempat, makanan populer, area, kategori, kisaran harga, catatan, dan foto
- Memberi komentar di titik kuliner
- Melihat makanan populer per area berdasarkan jumlah kontribusi

## Penting: dua mode aplikasi

### 1. Mode demo lokal

Jika `firebase-config.js` belum diisi, aplikasi tetap bisa dibuka.

Tetapi data hanya tersimpan di browser pengunjung masing-masing. Artinya:

- Data tidak terlihat oleh orang lain
- Foto tidak tersimpan online
- Cocok hanya untuk mencoba tampilan

### 2. Mode publik online

Agar kontribusi orang lain terlihat bersama-sama, kamu perlu menyambungkan Firebase.

Firebase dipakai untuk:

- Firestore Database: menyimpan titik kuliner dan komentar
- Storage: menyimpan foto makanan/tempat
- Private Contributors: menyimpan nama dan email lengkap kontributor untuk pemilik project

Pengunjung tetap **tidak login**. Mereka hanya mengisi nama dan email.

## Cara paling mudah setup Firebase tanpa coding

1. Buka Firebase Console.
2. Buat project baru, misalnya `malang-food-map`.
3. Tambahkan Web App dari ikon `</>`.
4. Salin `firebaseConfig` yang diberikan Firebase.
5. Buka file `setup-wizard.html` di browser.
6. Tempel config Firebase.
7. Klik **Buat file firebase-config.js**.
8. Download file `firebase-config.js` hasil wizard.
9. Ganti file `firebase-config.js` lama dengan file hasil download.
10. Di Firebase, aktifkan Firestore Database.
11. Di Firebase, aktifkan Storage.
12. Buka tab Rules di Firestore, tempel isi `firestore.rules`, lalu Publish.
13. Buka tab Rules di Storage, tempel isi `storage.rules`, lalu Publish.
14. Upload semua file ke GitHub repository.
15. Aktifkan GitHub Pages.

## Upload ke GitHub Pages

Struktur file di repository:

```text
index.html
styles.css
app.js
firebase-config.js
setup-wizard.html
firestore.rules
storage.rules
README.md
```

Lalu di GitHub:

1. Buka repository.
2. Masuk ke Settings.
3. Masuk ke Pages.
4. Source: Deploy from branch.
5. Branch: main.
6. Folder: /root.
7. Save.

Nanti GitHub akan memberi link seperti:

```text
https://username.github.io/nama-repository/
```

## Catatan integritas

Karena versi ini tidak memakai login Google, email bisa saja diisi palsu oleh pengunjung. Jadi tingkat integritasnya lebih rendah daripada Google Login.

Agar tetap lebih rapi:

- Nama kontributor tampil di halaman publik.
- Email di halaman publik ditampilkan tersamarkan, misalnya `ma***@gmail.com`.
- Email lengkap disimpan di koleksi `privateContributors` dan hanya bisa dilihat oleh pemilik project lewat Firebase Console.

## Catatan keamanan

Rules yang disediakan dibuat agar aplikasi bisa menerima kontribusi publik tanpa login.

Konsekuensinya:

- Siapa pun yang membuka web bisa menambah data.
- Foto publik bisa diupload sampai 5 MB per file.
- Disarankan cek Firebase Usage secara berkala.
- Kalau website mulai ramai, pertimbangkan aktifkan Google Login lagi atau tambahkan moderasi admin.

## File utama

- `index.html` → halaman utama aplikasi
- `styles.css` → tampilan aplikasi
- `app.js` → logika peta, form, komentar, foto, dan Firebase
- `firebase-config.js` → koneksi ke Firebase
- `setup-wizard.html` → alat bantu membuat config tanpa coding
- `firestore.rules` → aturan database
- `storage.rules` → aturan upload foto
