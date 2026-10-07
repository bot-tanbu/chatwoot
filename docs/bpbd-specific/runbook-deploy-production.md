# Runbook: Update Chatwoot BPBD di Production

Runbook ini dipakai untuk **setiap** update production. Langkahnya sama baik rilis membawa migrasi database maupun tidak: bila tidak ada migrasi tertunda, langkah migrasi selesai tanpa mengubah apa pun.

Semua perintah dijalankan di direktori compose production di server (yang berisi `docker-compose.yaml`, `.env`, `HANDOFF.md`).

## Kenapa `docker compose build` saja tidak cukup

| Perintah | Yang terjadi | Yang **tidak** terjadi |
|---|---|---|
| `docker compose build` | Mengambil kode terbaru dari `git@github.com:bot-tanbu/chatwoot.git#develop`, compile aset, dan menghasilkan image baru `chatwoot-bpbd:latest` | Container yang sedang jalan **tetap memakai image lama** sampai di-recreate |
| `docker compose up -d` | Me-recreate container dengan image baru | **Tidak menjalankan migrasi database**. `docker/entrypoints/rails.sh` hanya menunggu Postgres, menjalankan `bundle install`, lalu menyalakan server. |

Jadi urutan minimal setiap update adalah: **build → migrasi → up**. Migrasi wajib mulai rilis modul Laporan Kejadian, karena itu rilis fork pertama yang menambah tabel. Menjalankannya di setiap update membuat prosedur selalu sama dan tidak ada yang terlewat.

Kode hanya diambil dari branch **`develop`**. Perubahan di branch lain baru ikut setelah di-merge ke `develop`.

---

## Langkah Update

### 1. Persiapan

```sh
cd /path/ke/direktori-compose   # direktori berisi docker-compose.yaml dan .env

# SSH agent harus punya key yang boleh membaca repo bot-tanbu/chatwoot
ssh-add -l
ssh -T git@github.com            # harus menyapa akun yang punya akses ke repo

# Pastikan semua container sehat sebelum mulai
docker compose ps
```

### 2. Cek penyimpanan sementara host (aturan ephemeral-storage)

```sh
sudo -n ephemeral-storage prepare; echo "exit=$?"
```

- **`exit=0`**: host memakai ephemeral storage. Ikuti varian **[E]** di langkah 5 dan 7, lalu jalankan langkah 9.
- **Exit selain 0**: cek `ls -l /etc/ephemeral-storage.json`.
  - File **tidak ada**: host bukan target ephemeral. Lewati varian [E] dan langkah 9.
  - File **ada**, berupa symlink rusak, atau tidak bisa dicek: **hentikan update** dan laporkan output error `prepare`. Jangan lanjut build.

### 3. Simpan image yang sedang jalan (titik rollback)

```sh
ROLLBACK_TAG="rollback-$(date +%Y%m%d-%H%M)"
# Pakai image ID container yang sedang jalan, bukan nama tag. Tag "latest" bisa saja sudah
# menunjuk ke build lain yang belum pernah di-up.
docker tag "$(docker inspect --format '{{.Image}}' chatwoot-bpbd-rails)" "chatwoot-bpbd:${ROLLBACK_TAG}"
echo "Rollback tag: ${ROLLBACK_TAG}"   # catat nilai ini
```

### 4. Backup database

Postgres berada di luar compose. Backup memakai `pg_dump` dari image yang sedang jalan (sudah berisi `postgresql-client`) dan koneksi dari `.env`:

```sh
mkdir -p backup
docker compose run --rm -T --no-deps --entrypoint sh rails -c '
  if [ -n "$DATABASE_URL" ]; then exec pg_dump -Fc "$DATABASE_URL"; fi
  PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump -Fc \
    -h "$POSTGRES_HOST" -p "${POSTGRES_PORT:-5432}" -U "$POSTGRES_USERNAME" \
    "${POSTGRES_DATABASE:-chatwoot_production}"
' > "backup/chatwoot-$(date +%Y%m%d-%H%M).dump"

# Cek file backup valid (harus menampilkan daftar isi, bukan error)
ls -lh backup/ | tail -3
docker compose run --rm -T --no-deps --entrypoint pg_restore rails -l < "$(ls -t backup/*.dump | head -1)" | head -5
```

Bila `pg_dump` gagal karena versi server lebih baru dari client, pakai prosedur backup di host Postgres. **Jangan lanjut tanpa backup yang valid.**

### 5. Build image baru

Cukup build service `rails`. `sidekiq` (dan service `base`) memakai image yang sama, `chatwoot-bpbd:latest`.

```sh
# Biasa
docker compose build rails

# [E] Host ephemeral
docker buildx inspect ephemeral        # harus sukses; bila gagal, STOP dan laporkan
docker compose build --builder ephemeral rails
```

Pastikan image berisi commit `develop` terbaru:

```sh
docker compose run --rm --no-deps --entrypoint cat rails /app/.git_sha
git ls-remote git@github.com:bot-tanbu/chatwoot.git refs/heads/develop
# dua hash harus sama
```

### 6. Jalankan migrasi (dengan image baru)

Container lama masih melayani selama langkah ini.

```sh
docker compose run --rm --no-deps -e POSTGRES_STATEMENT_TIMEOUT=600s rails \
  bundle exec rails db:chatwoot_prepare
```

- Tanpa migrasi baru, perintah ini hanya memuat ulang konfigurasi instalasi lalu selesai.
- Di database yang sudah ada, `db:chatwoot_prepare` hanya menjalankan migrasi yang tertunda. Tidak ada load schema atau seed (`lib/tasks/db_enhancements.rake:20-24`).
- Bila migrasi **gagal**: jangan lanjut ke langkah 7. Container lama tetap berjalan dengan normal. Simpan output error dan laporkan.

### 7. Recreate `rails` dan `sidekiq`

Keduanya **harus** di-recreate bersamaan. Sidekiq yang tertinggal di image lama tidak mengenal job baru.

```sh
# Biasa
docker compose up -d --no-build rails sidekiq

# [E] Host ephemeral
docker compose up -d --no-build --wait rails sidekiq
```

Jangan pakai `docker compose up --build`.

### 8. Verifikasi

```sh
docker compose ps                                   # rails & sidekiq: running
docker compose logs --tail=100 rails sidekiq        # tanpa error saat boot

# Health check internal (rails tidak expose port ke host; NPM yang forward)
docker compose exec rails wget -qO- http://localhost:3000/api
# harus berisi "queue_services":"ok" dan "data_services":"ok"

# Status migrasi: semua harus "up"
docker compose exec rails bundle exec rails db:migrate:status | tail -5
```

Lalu buka aplikasi lewat domain production, login, dan pastikan dashboard serta chat terbuka normal.

### 9. [E] Snapshot (khusus host ephemeral)

Hanya bila langkah 2 berhasil dan langkah 5–8 sukses:

```sh
sudo -n ephemeral-storage snapshot; echo "exit=$?"
```

`exit` selain 0 berarti **checkpoint pemulihan gagal**. Laporkan, jangan dianggap selesai.

---

## Rollback

Bila langkah 7 atau 8 gagal, kembalikan container ke image langkah 3:

```sh
CHATWOOT_TAG="${ROLLBACK_TAG}" docker compose up -d --no-build rails sidekiq
```

- Variabel shell `CHATWOOT_TAG` menimpa nilai di `.env`, jadi compose memakai `chatwoot-bpbd:${ROLLBACK_TAG}`.
- **Jangan** menjalankan `db:rollback` di production. Migrasi modul ini hanya menambah tabel, trigger, dan sequence, jadi image lama tetap berjalan normal di atas skema baru.
- Restore dari backup langkah 4 hanya dilakukan bila data rusak, dan butuh keputusan eksplisit karena menimpa data sejak backup dibuat.

Setelah rollback, update berikutnya cukup mengulang runbook dari langkah 1. Perintah `up` biasa memakai tag `latest` lagi.

---

## Cek Tambahan: Rilis Modul Laporan Kejadian

Hanya untuk rilis pertama yang membawa modul Kejadian (detail teknis: `plan-modul-laporan-kejadian.md` §13).

**Sebelum langkah 6**, cek hak user database (read-only). User aplikasi harus pemilik tabel `accounts` dan punya hak `CREATE`, karena migrasi membuat trigger dan sequence:

```sh
docker compose run --rm -T --no-deps --entrypoint sh rails -c '
  if [ -n "$DATABASE_URL" ]; then CONN="$DATABASE_URL"; else
    export PGPASSWORD="$POSTGRES_PASSWORD"
    CONN="host=$POSTGRES_HOST port=${POSTGRES_PORT:-5432} user=$POSTGRES_USERNAME dbname=${POSTGRES_DATABASE:-chatwoot_production}"
  fi
  psql "$CONN" -Atc "SELECT current_user, (SELECT tableowner FROM pg_tables WHERE tablename = '\''accounts'\''), has_schema_privilege(current_user, '\''public'\'', '\''CREATE'\'')"
'
# Hasil yang diharapkan: <user>|<user yang sama>|t
```

Bila owner berbeda atau hasilnya `f`, hentikan dan minta DBA memberi hak tersebut sebelum migrasi.

**Setelah langkah 8**:

| Cek | Cara | Hasil |
|---|---|---|
| Sequence nomor kejadian untuk semua akun | jalankan blok `psql` di atas dengan query `SELECT count(*) FROM accounts a WHERE to_regclass('incident_dpid_seq_' \|\| a.id) IS NULL` | `0` |
| Menu | Login, sidebar menampilkan **Kejadian** | tampil |
| Alur | Di chat uji: Catat Kejadian → ubah status → (admin) hapus | pesan `[Pesan Otomatis]` muncul di chat, status kirim tidak `failed` |
| Sidekiq | `docker compose logs --since 10m sidekiq \| grep -i NotifyReporterJob` | tidak ada `NameError` / error |

---

## Ringkasan Cepat

```sh
cd /path/ke/direktori-compose
ssh-add -l && docker compose ps
sudo -n ephemeral-storage prepare; echo "exit=$?"                # lihat langkah 2
ROLLBACK_TAG="rollback-$(date +%Y%m%d-%H%M)"
docker tag "$(docker inspect --format '{{.Image}}' chatwoot-bpbd-rails)" "chatwoot-bpbd:${ROLLBACK_TAG}"
# backup database (langkah 4) dan cek valid
docker compose build rails                                       # [E]: --builder ephemeral
docker compose run --rm --no-deps -e POSTGRES_STATEMENT_TIMEOUT=600s rails bundle exec rails db:chatwoot_prepare
docker compose up -d --no-build rails sidekiq                    # [E]: tambah --wait
docker compose exec rails wget -qO- http://localhost:3000/api
# [E]: sudo -n ephemeral-storage snapshot
```
