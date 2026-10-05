# Analisis Kebutuhan Fitur: BPBD Kabupaten Tanah Bumbu vs Chatwoot

Dokumen ini memetakan ketersediaan fitur di **Chatwoot** terhadap surat permohonan resmi dari **Badan Penanggulangan Bencana Daerah (BPBD) Kabupaten Tanah Bumbu**.

---

## 1. Rujukan Dokumen Permohonan

- **Nomor Surat**: `B/500.12.16.3/573/BPBD-KL/IX/2026`
- **Tanggal**: Batulicin, 24 September 2026
- **Pengirim**: Kepala Pelaksana BPBD Kabupaten Tanah Bumbu
- **Penerima**: Kepala Dinas Komunikasi dan Informatika (Diskominfo) Kabupaten Tanah Bumbu
- **Perihal**: Permohonan Pembuatan/Pengembangan Aplikasi WhatsApp Bot (WA Bot)
- **Nama Inovasi**: *"Akselerasi Penanganan Bencana Secara Real Time (SINGABANA ON TIME) Melalui Pemanfaatan Teknologi Digital Pada Bidang Kedaruratan dan Logistik Badan Penanggulangan Bencana Daerah Kabupaten Tanah Bumbu"*
- **Inisiator/Aksi Perubahan**: Nurman, S.Kom, M.M (Kepala Bidang Kedaruratan dan Logistik BPBD Kab. Tanah Bumbu)

---

## 2. Ringkasan Eksekutif Kesiapan Chatwoot

| Kategori | Persentase | Status |
|---|---|---|
| **Fitur Tersedia (Native)** | **~50%** | Penerimaan pesan WhatsApp, lampiran media/foto/lokasi, notifikasi petugas, penugasan tim, lifecycle status tiket penanganan. |
| **Fitur Tersedia Sebagian (Perlu Konfigurasi/Integrasi Bot)** | **~25%** | Alur tanya-jawab terstruktur (chatbot), custom fields kebencanaan, ekspor/rekapitulasi data laporan. |
| **Fitur Tidak Tersedia (Gap / Di Luar Ruang Lingkup Chatwoot)** | **~25%** | Manajemen inventori/stok logistik gudang bencana, dashboard visualisasi spasial/GIS, visual bot flow builder native. |

**Kesimpulan Arsitektur:**
Chatwoot adalah platform **Customer Engagement & Omnichannel Helpdesk** (berorientasi pada petugas/agen manusia). Chatwoot **sangat ideal menjadi sistem backend pusat operasional penanganan laporan (ticketing & dispatch center)**, namun untuk memenuhi fungsi *"WhatsApp Bot Interaktif yang memandu warga secara otomatis"*, Chatwoot harus dikombinasikan dengan **middleware chatbot** (misal: *n8n*, *Typebot*, atau bot webhook) melalui fitur bawaan Chatwoot yaitu **Agent Bot**.

---

## 3. Matriks 8 Poin Kebutuhan BPBD vs Fitur Chatwoot

| No | Poin Permintaan BPBD | Status di Chatwoot | Komponen / Fitur Chatwoot | Catatan Teknis & Kebutuhan Penyesuaian |
|:---:|---|:---:|---|---|
| **1** | **Penerimaan laporan kejadian bencana** dari masyarakat, aparatur desa/kelurahan, relawan, maupun pihak terkait via WhatsApp | **TERSEDIA (Native)** | • WhatsApp Inbox Channel (Meta Cloud API / Twilio)<br>• Webhook / API Inbox | Siap menerima pesan teks & kontak masuk secara real-time dari nomor WhatsApp manapun. |
| **2** | **Pengiriman data kejadian secara real-time** (jenis kejadian, lokasi, waktu kejadian, tingkat kedaruratan, kebutuhan penanganan) | **TERSEDIA SEBAGIAN** | • Timestamp percakapan (Native)<br>• Location attachment (Native)<br>• Custom Attributes (Configurable)<br>• Agent Bot Webhook | • Waktu & koordinat GPS diterima secara native.<br>• Alur pengumpulan data beruntun (form tanya-jawab) butuh **Agent Bot Middleware**.<br>• Data tersimpan rapi di *Conversation Custom Attributes*. |
| **3** | **Pengiriman dokumentasi kejadian** berupa foto dan/atau informasi pendukung lainnya | **TERSEDIA (Native)** | • Attachment Handler (Images, Videos, Documents, Audio) | Mendukung file foto JPG/PNG, dokumen PDF, video, dan rekaman suara langsung di panel chat. |
| **4** | **Pencatatan dan pengelolaan data laporan secara terintegrasi** sebagai bahan kajian dan pengambilan keputusan | **TERSEDIA SEBAGIAN** | • Conversation History<br>• Contact Profiles<br>• Conversation Labels & Tags<br>• Export Reports (CSV) | • Semua riwayat pesan dan identitas pelapor terdokumentasi permanen.<br>• Belum memiliki dashboard rekapitulasi statistik kebencanaan khusus (standar BNPB). |
| **5** | **Penyampaian informasi dan notifikasi kepada petugas** Bidang Kedaruratan dan Logistik BPBD | **TERSEDIA (Native)** | • Web Browser Push & Sound Alert<br>• Mobile App (Android & iOS)<br>• Email Notifications<br>• Teams & Auto-Assignment<br>• Automation Rules | Petugas BPBD/TRC dapat menerima notifikasi instan di HP atau laptop saat laporan masuk, serta dapat dikelompokkan ke Tim Kedaruratan atau Tim Logistik. |
| **6** | **Mendukung pemantauan status penanganan kejadian bencana** (dari diterima sampai tindak lanjut) | **TERSEDIA (Native)** | • Conversation Status (`Open`, `Pending`, `Resolved`, `Snoozed`)<br>• Assignee (Penugasan ke Petugas)<br>• Private Notes (Catatan internal petugas)<br>• Activity Timeline / Audit Log | Alur kerja penanganan tiket sudah lengkap. Petugas dapat mencatat perkembangan penanganan lapangan di *Private Notes* tanpa terbaca oleh pelapor. |
| **7** | **Mendukung pendataan kebutuhan logistik dan sumber daya** dalam penanganan kedaruratan | **TIDAK TERSEDIA** | • Custom Attributes (Hanya pencatatan teks/angka kebutuhan) | Chatwoot **bukan sistem inventori (WMS)**. Tidak dapat mengelola stok fisik gudang logistik, keluar-masuk sembako/tenda/perahu, atau tracking distribusi logistik. |
| **8** | **Menjadi bagian dari sistem informasi penanganan bencana** yang cepat, tepat, terintegrasi dan terdokumentasi | **TERSEDIA (Siap Integrasi)** | • REST API Chatwoot<br>• Webhook Integrations<br>• Platform Apps | Chatwoot memiliki API lengkap untuk terhubung dengan aplikasi web portal SINGABANA ON TIME atau Satu Data Pemkab Tanah Bumbu. |

---

## 4. Rincian Fitur yang TERSEDIA di Chatwoot

### A. Kanal Komunikasi WhatsApp & Multimedia
- **Penerimaan Pesan Real-time**: Warga mengirim pesan WhatsApp dan langsung muncul di dashboard Chatwoot tanpa jeda.
- **Dukungan File Dokumentasi**: Mendukung pengiriman foto bukti kejadian bencana, video situasi, dokumen surat/laporan PDF, pesan suara, dan lokasi (*share location pin / latitude-longitude*).
- **Profil Pelapor (Contacts)**: Otomatis menyimpan nomor WhatsApp, nama akun, serta riwayat laporan sebelumnya dari warga yang bersangkutan.

### B. Notifikasi dan Kolaborasi Petugas
- **Manajemen Tim (Teams)**: Dapat dibuat tim khusus, misalnya:
  - `TRC (Tim Reaksi Cepat)`
  - `Bidang Kedaruratan`
  - `Bidang Logistik`
  - `PUSDALOPS BPBD`
- **Notifikasi Multikanal**: Notifikasi bunyi dan popup di browser web, aplikasi Android/iOS Chatwoot untuk petugas lapangan, dan email.
- **Catatan Internal (Private Notes)**: Petugas dapat berdiskusi dan mencatat arahan pimpinan atau status regu di dalam percakapan yang sama tanpa terlihat oleh warga pelapor.
- **Penugasan Mandiri / Otomatis**: Laporan dapat ditugaskan ke petugas tertentu (*assignee*) agar tidak terjadi tumpang tindih penanganan.

### C. Alur Status Penanganan (Ticket Lifecycle)
- **Status Laporan**:
  - `Open`: Laporan baru masuk / sedang dalam proses verifikasi dan penanganan.
  - `Pending`: Menunggu konfirmasi dari pelapor atau tim lapangan.
  - `Snoozed`: Ditunda sementara (misal: menunggu jadwal dropping logistik besok pagi).
  - `Resolved`: Penanganan bencana dinyatakan selesai.
- **Audit Trail**: Tercatat secara presisi siapa yang membuka laporan, membalas pesan, mengubah status, dan menyelesaikan laporan beserta stempel waktu (*timestamp*).

---

## 5. Rincian Fitur yang TIDAK TERSEDIA (Keterbatasan & Gap)

### A. Bot Interaktif Bawaan (No Built-in Visual Chatbot Builder)
- **Kondisi Chatwoot**: Chatwoot versi Open Source tidak menyediakan antarmuka visual (*drag-and-drop flow builder*) untuk merancang alur percakapan bot seperti:
  > *"Halo, selamat datang di WA BPBD Tanah Bumbu. Silakan pilih jenis bencana: 1. Banjir 2. Kebakaran Hutan 3. Tanah Longsor..."*
- **Solusi**: Memanfaatkan fitur **Agent Bot (Webhook)** di Chatwoot yang dihubungkan ke middleware bot builder gratis/open-source seperti **Typebot**, **n8n**, atau service webhook kustom.

### B. Sistem Inventori dan Stok Logistik (Poin 7)
- **Kondisi Chatwoot**: Chatwoot adalah sistem komunikasi, bukan sistem logistik/pergudangan (WMS).
- **Keterbatasan**: Tidak ada tabel stok barang bantuan, pelacakan alokasi logistik per kecamatan/desa, sisa stok tenda, selimut, bahan pangan, atau perahu karet.
- **Solusi**:
  1. Di Chatwoot, kebutuhan logistik hanya dicatat sebagai teks permintaan darurat pada kolom atribut.
  2. Untuk manajemen stok, Diskominfo/BPBD dapat mengintegrasikan Webhook Chatwoot dengan sistem aplikasi logistik tersendiri atau Google Sheets/database logistik.

### C. Pemetaan Spasial / GIS Bencana
- **Kondisi Chatwoot**: Chatwoot hanya menampilkan titik koordinat yang dikirim pengguna sebagai tautan Google Maps di dalam obrolan.
- **Keterbatasan**: Tidak ada visualisasi peta sebaran bencana satu kabupaten (GIS Heatmap / Layer Peta Rawan Bencana).
- **Solusi**: Data koordinat dari Chatwoot dialirkan melalui Webhook/API ke dashboard GIS Web Pemkab Tanah Bumbu.

### D. Gateway WhatsApp Nomor Seluler Lokal (Non-Meta BSP)
- **Kondisi Chatwoot**: Kanal WhatsApp bawaan Chatwoot menggunakan Meta Cloud API (WhatsApp Business Platform resmi) yang membutuhkan pendaftaran Facebook Business Manager dan biaya per percakapan (conversation fee) ke Meta.
- **Kebutuhan Umum Pemda**: Seringkali instansi menginginkan nomor telepon seluler yang sudah ada (misal nomor seluler Pusdalops) langsung dihubungkan via scan QR Code tanpa biaya percakapan Meta.
- **Solusi**: Perlu memasang gateway WhatsApp mandiri (seperti **Evolution API** atau **WAHA**) yang disambungkan ke Chatwoot melalui tipe kanal *API Channel*.

---

## 6. Rekomendasi Arsitektur Solusi untuk Diskominfo Tanah Bumbu

```
[ Masyarakat / Relawan / Aparatur Desa ]
                   │  (Kirim WA: Teks, Foto, Lokasi)
                   ▼
     [ WhatsApp Gateway Engine ]
  (Evolution API / WAHA / Meta Cloud API)
                   │
                   ▼
       [ Chatwoot Omnichannel ]
  ┌──────────────────────────────────────────────┐
  │ 1. Agent Bot (n8n / Typebot Middleware):    │
  │    - Sambut pelapor                          │
  │    - Pandu pengisian data jenis bencana      │
  │    - Minta koordinat GPS & foto dokumentasi  │
  │    - Update Custom Attributes                │
  │    - Handover ke Agen Manusia                │
  │                                              │
  │ 2. Dashboard Petugas BPBD:                   │
  │    - Notifikasi Web & Mobile TRC             │
  │    - Tinjau foto & data laporan              │
  │    - Disposisi tim (Kedaruratan / Logistik)  │
  │    - Update status (Open -> Resolved)        │
  └──────────────────────────────────────────────┘
                   │  (Webhook Data Kejadian)
                   ▼
     [ Portal SINGABANA ON TIME / GIS BPBD ]
       (Peta Sebaran Bencana & Sistem Logistik)
```

---

## 7. Langkah Konfigurasi yang Perlu Dilakukan di Chatwoot

1. **Membuat Custom Attributes (Bidang Percakapan)**:
   - `jenis_bencana` (List: Banjir, Kebakaran Hutan & Lahan, Tanah Longsor, Puting Beliung, Gelombang Pasang, Gempa Bumi, Lainnya)
   - `tingkat_kedaruratan` (List: Siaga Darurat, Tanggap Darurat, Transisi Darurat)
   - `lokasi_kecamatan` (Text / List Kecamatan di Kab. Tanah Bumbu)
   - `lokasi_desa` (Text)
   - `estimasi_korban` (Number)
   - `kebutuhan_mendesak` (Text)
   - `kebutuhan_logistik` (Text)
2. **Membuat Teams (Kelompok Kerja BPBD)**:
   - `PUSDALOPS-PB` (Pusat Pengendalian Operasi Penanggulangan Bencana)
   - `Bidang Kedaruratan` (Tim Reaksi Cepat / Evakuasi)
   - `Bidang Logistik` (Penyaluran Bantuan & Peralatan)
3. **Membuat Labels (Tagging Cepat)**:
   - `#banjir`, `#karhutla`, `#longsor`, `#angin-puting-beliung`
   - `#prioritas-tinggi`, `#butuh-evakuasi`, `#butuh-logistik`
4. **Menghubungkan Agent Bot (Middleware)**:
   - Daftarkan `AgentBot` di Chatwoot yang mengarah ke endpoint webhook *n8n* atau *Typebot* untuk menangani percakapan awal warga secara otomatis sebelum diteruskan ke petugas manusia.
