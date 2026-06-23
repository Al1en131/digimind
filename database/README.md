# Dokumentasi Database Digimind

Repositori ini menyimpan rancangan basis data untuk aplikasi **Digimind** dalam penamaan Bahasa Inggris yang konsisten (*Fully English*).

---

## 🛠️ Cara Menjalankan Script Database

### 1. Menggunakan MySQL
Untuk membuat database `digimind` beserta seluruh tabelnya di MySQL:
```bash
mysql -u [username_anda] -p < database/mysql_schema.sql
```
*Atau buka klien database Anda (seperti phpMyAdmin, DBeaver, MySQL Workbench) lalu jalankan isi file [mysql_schema.sql](file:///d:/PROJECT/Project%20Dosen/digimind/database/mysql_schema.sql).*

### 2. Menggunakan PostgreSQL
Di terminal PostgreSQL (psql):
```sql
CREATE DATABASE digimind;
\c digimind
-- Jalankan kode dari postgres_schema.sql
\i database/postgres_schema.sql
```
*Atau jalankan melalui klien seperti pgAdmin / DBeaver dengan mengimpor [postgres_schema.sql](file:///d:/PROJECT/Project%20Dosen/digimind/database/postgres_schema.sql).*

---

## 📐 Arsitektur Skema Database (Normalized)
Skema ini menggunakan pendekatan **Normalized** dengan standardisasi Bahasa Inggris. Primary Key di semua tabel seragam menggunakan nama `id` dan relasi menggunakan format `[nama_tabel]_id`.

---

## 📊 Detail Kamus Data (Data Dictionary)

### 1. Tabel Utama: `users`
Menampung kredensial autentikasi login untuk semua user.

| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` (PK) | INT | Kunci Utama |
| `username` | VARCHAR(255) | Username unik untuk login |
| `email` | VARCHAR(255) | Email unik untuk login |
| `password` | VARCHAR(255) | Password yang di-hash |
| `role` | ENUM | Pilihan hak akses: `'student'`, `'teacher'`, `'admin'` |
| `created_at` | TIMESTAMP | Waktu akun dibuat |
| `updated_at` | TIMESTAMP | Waktu akun diperbarui |

---

### 2. Tabel Detil Profil: `students`, `teachers`, `admins`
Menghubungkan data profil spesifik 1-to-1 dengan tabel `users` via `user_id`.

* **`students`**: Menyimpan Nomor Induk Siswa (`nis`), progres pembelajaran (`module_progress`), status literasi/mental, flag risiko (`risk_flag`), dan terhubung ke kelas (`class_id`).
* **`teachers`**: Menyimpan Nomor Induk Pegawai (`nip`), nama, spesialisasi (`specialization`), jabatan (`position`), dan nomor telepon.
* **`admins`**: Menyimpan nama, divisi admin (`division`), dan unit (`unit`).

---

### 3. Tabel Kelas: `classes`
Menampung data kelas di sekolah.

| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` (PK) | INT | Kunci Utama |
| `name` | VARCHAR(100) | Nama kelas (contoh: "X IPA 1") |
| `major` | VARCHAR(100) | Jurusan kelas (contoh: "Science", "Social Studies") |
| `created_at` | TIMESTAMP | Waktu kelas dibuat |
| `updated_at` | TIMESTAMP | Waktu kelas diperbarui |

---

### 4. Tabel Modul & Klasifikasi: `categories`, `levels`, `modules`
* **`categories`**: Menyimpan kategori modul (misal: "Literasi", "Mental Health").
* **`levels`**: Menyimpan tingkat kesulitan modul (misal: "Beginner", "Intermediate", "Advanced").
* **`modules`**: Mengikat modul dengan Kategori (`category_id`) dan Level (`level_id`).

---

### 5. Tabel Kuis & Soal: `quizzes`, `questions`, `options`
* **`quizzes`**: Kuis bertipe `'pretest'` atau `'posttest'` yang terhubung ke modul (`module_id`).
* **`questions`**: Soal-soal kuis yang terhubung ke Kuis (`quiz_id`).
* **`options`**: Pilihan jawaban ganda yang terikat ke Soal (`question_id`). Kunci jawaban ditandai dengan `is_correct = TRUE`.

---

### 6. Tabel Hasil & Jawaban Siswa: `quiz_attempts`, `answers`
Mendukung tracking riwayat percobaan kuis siswa yang berulang.
* **`quiz_attempts`**: Mencatat sesi pengerjaan kuis siswa (`student_id`, `quiz_id`) beserta perolehan nilainya (`score`).
* **`answers`**: Mencatat jawaban detail pilihan siswa (`option_id`) untuk setiap soal kuis (`question_id`) pada sesi pengerjaan tertentu (`attempt_id`).

---

### 7. Tabel Jurnal & Kesehatan Mental: `mental_journals`, `mental_insights`, `mental_interventions`, `ai_feedbacks`
* **`mental_journals`**: Jurnal harian siswa untuk mencatat skor mood (`mood_score`), aktivitas (`activities`), dan catatan pribadi (`notes`) yang terikat ke siswa (`student_id`).
* **`mental_insights`**: Analisis periodik (`period`) kesehatan mental siswa yang dihitung sistem/AI, memuat `mental_level` dan saran rekomendasi (`recommendations`).
* **`mental_interventions`**: Program/tindakan intervensi (seperti bimbingan konseling) bagi siswa yang membutuhkan, memuat status program (`status`) dan guru/admin yang menugaskan (`assigned_by`).
* **`ai_feedbacks`**: Feedback/umpan balik dari AI kepada siswa baik secara umum maupun khusus per modul (`module_id`).

---

### 8. Tabel Penghargaan: `badges`, `student_badges`
* **`badges`**: Daftar lencana/badge penghargaan beserta deskripsi dan file gambar visualnya (`image_url`).
* **`student_badges`**: Mencatat kapan siswa (`student_id`) menerima badge tertentu (`badge_id`).
