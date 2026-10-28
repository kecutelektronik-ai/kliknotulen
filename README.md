# 🎙️ KlikNotulen - Konversi Lisan Instan ke Kertas Notulen Resmi A4

**KlikNotulen** adalah aplikasi web modern (*client-side*) untuk merekam suara rapat, mengubah percakapan lisan menjadi teks secara *real-time* (Speech-to-Text Bahasa Indonesia), merapikan naskah notulen otomatis menggunakan kecerdasan buatan (**Google Gemini AI**), dan menghasilkan dokumen dinas berstandar **A4** yang siap cetak atau diekspor ke format PDF / Word.

---

## ✨ Fitur Utama

- 🎙️ **Perekaman Mikrofon & Live Transkripsi:** Menggunakan Web Audio API dan Web Speech API bawaan peramban untuk mendeteksi pembicaraan bahasa Indonesia secara akurat dan gratis.
- 🤖 **Integrasi AI Google Gemini:** Merapikan transkrip mentah menjadi format notulen resmi secara otomatis (Pembuka, Agenda Pembahasan, Kesimpulan, dan Tindak Lanjut).
- 🏛️ **Kop Surat & Tanda Tangan Resmi:** Template kop surat instansi resmi (standar dinas/pengadilan) lengkap dengan logo, nomor surat, tanggal, serta kolom tanda tangan pimpinan rapat dan notulis.
- 📄 **Format Cetak Presisi A4:** Tata letak dokumen dioptimalkan khusus ukuran A4 standar (210mm x 297mm) dengan margin dinas yang rapi saat dicetak (`Ctrl + P` / Cetak PDF).
- 📱 **Responsif & Mobile-Friendly:** Dapat diakses lancar di laptop, tablet, maupun smartphone Android lengkap dengan navigasi bilah bawah (*Mobile Navigation Bar*).
- 🔒 **Aman & Privasi Terjaga:** Kunci API Google Gemini disimpan secara privat di `localStorage` peramban masing-masing pengguna (tidak pernah dikirim ke server pihak ketiga).
- 🗄️ **Arsip & Riwayat Lokal:** Notulen tersimpan aman di penyimpanan lokal peramban sehingga dapat dibuka, diedit, dan dicetak kembali kapan saja.

---

## 🚀 Cara Menjalankan Secara Lokal

Karena KlikNotulen adalah aplikasi berbasis web tanpa backend, Anda bisa menjalankannya langsung:

### Opsi 1: Buka Langsung di Peramban
Cukup klik ganda berkas `index.html` menggunakan peramban **Google Chrome** atau **Microsoft Edge**.

### Opsi 2: Menggunakan Local Server (Direkomendasikan untuk uji coba mikrofon & HP)
Jika ingin menguji coba dari HP Android dalam jaringan Wi-Fi yang sama:
```powershell
# Menggunakan Python
python -m http.server 8080

# Atau menggunakan Node.js
npx serve .
```
Buka `http://localhost:8080` pada laptop, atau `http://<IP-LAPTOP>:8080` dari peramban HP Anda.

---

## 🌐 Cara Menerapkan ke GitHub Pages (Hosting Gratis)

Aplikasi ini sudah siap 100% untuk diunggah ke GitHub Pages:

1. **Inisialisasi Git dan Commit:**
   ```powershell
   git init
   git add .
   git commit -m "Inisialisasi rilis KlikNotulen"
   git branch -M main
   ```

2. **Hubungkan ke Repositori GitHub:**
   Buat repositori baru di GitHub (misal: `kliknotulen`), lalu jalankan:
   ```powershell
   git remote add origin https://github.com/<username-anda>/kliknotulen.git
   git push -u origin main
   ```

3. **Aktifkan GitHub Pages:**
   - Masuk ke repositori di GitHub $\rightarrow$ Klik tab **Settings**.
   - Pilih menu **Pages** di sebelah kiri.
   - Di bagian **Branch**, pilih `main` dan folder `/(root)`, lalu klik **Save**.
   - Link website aplikasi Anda akan aktif dalam 1-2 menit (contoh: `https://<username-anda>.github.io/kliknotulen/`).

---

## 🔑 Konfigurasi Google Gemini API

Untuk mengaktifkan fitur ringkasan & notulen otomatis berbasis AI:
1. Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Di dalam aplikasi KlikNotulen, klik tombol **AI Gemini** pada bilah atas.
3. Masukkan API Key Anda lalu klik **Simpan Kunci**.

---

## 🛠️ Teknologi yang Digunakan

- **HTML5 & Vanilla JavaScript** (ES6+)
- **Tailwind CSS** (via CDN)
- **Font Awesome 6** (Icons)
- **Google Fonts** (*Plus Jakarta Sans* & *Tinos*)
- **Web Speech API & MediaRecorder API**
- **Google Gemini 2.5 Flash / 1.5 Flash API**
