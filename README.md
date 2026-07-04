# 🛒 Online Shop - UTS + UAS Pemrograman Web 2

Aplikasi e-commerce fullstack menggunakan **Node.js + Express + MySQL + JWT Authentication** untuk backend, dan **HTML + JavaScript + Tailwind CSS** untuk frontend.

---

## 🚀 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | HTML5, JavaScript ES6+, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (JSON Web Token) + bcrypt |
| Storage | LocalStorage (UTS fallback) |

---

## 📁 Struktur Project

```
UAS BU ANDITA/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT middleware (verifyToken, isAdmin)
│   ├── index.js             # Main API server
│   ├── db.js                # Koneksi MySQL
│   ├── .env                 # Environment variables (jangan di-commit!)
│   ├── .env.example         # Template env untuk deployment
│   ├── package.json
│   └── postman_collection.json  # Dokumentasi API
├── frontend/
│   ├── index.html           # Halaman utama / produk
│   ├── login.html           # Login & Register
│   ├── cart.html            # Keranjang belanja
│   ├── orders.html          # Riwayat pesanan
│   ├── admin.html           # Dashboard admin
│   ├── api.js               # API client dengan JWT auto-attach
│   ├── main.js              # Logic utama
│   ├── cart.js              # Logic keranjang
│   ├── admin.js             # Logic admin
│   └── style.css            # Custom styles
├── database.sql             # Script inisialisasi database
└── README.md
```

---

## ⚙️ Cara Menjalankan (Lokal)

### 1. Setup Database MySQL

```sql
-- Buat database
CREATE DATABASE onlineshop_db;

-- Import schema
mysql -u root -p onlineshop_db < database.sql
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Salin .env.example ke .env dan isi nilainya
cp .env.example .env

# Jalankan server
npm start
```

Server berjalan di: `http://localhost:3000`

### 3. Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di: `http://localhost:5173` (atau port Vite lainnya)

---

## 🔐 Authentication

### Akun Admin Default
| Email | Password |
|---|---|
| admin@admin.com | admin123 |

### Flow Login
1. User melakukan **POST /api/auth/login** dengan email & password
2. Server mengembalikan **JWT Token** (berlaku 7 hari)
3. Frontend menyimpan token di `localStorage`
4. Setiap request yang memerlukan auth menyertakan header: `Authorization: Bearer <token>`

### Kategori Endpoint
| Akses | Endpoint |
|---|---|
| Public | GET /api/products, GET /api/products/:id, GET /api/settings, POST /api/checkout |
| Auth Required | GET /api/orders/user/:email, GET /api/auth/me |
| Admin Only | POST/PUT/DELETE /api/products, GET /api/orders, PUT /api/orders/:id/status, semua /api/users, PUT /api/settings |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | /api/auth/register | Daftar akun baru |
| POST | /api/auth/login | Login & dapat token |
| GET | /api/auth/me | Cek data user dari token |

### Produk
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | /api/products | Semua produk | Public |
| GET | /api/products/:id | Detail produk | Public |
| POST | /api/products | Tambah produk | Admin |
| PUT | /api/products/:id | Update produk | Admin |
| DELETE | /api/products/:id | Hapus produk | Admin |

### Pesanan
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | /api/checkout | Buat pesanan baru | Public |
| GET | /api/orders | Semua pesanan | Admin |
| GET | /api/orders/user/:email | Pesanan per user | Auth |
| PUT | /api/orders/:id/status | Update status | Admin |

### Status Pesanan
`pending` → `processing` → `shipped` → `completed` / `cancelled`

---

## 🚢 Deployment ke Railway (Backend)

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit - Online Shop UAS"
git remote add origin https://github.com/username/onlineshop-uas.git
git push -u origin main
```

### 2. Deploy Backend ke Railway
1. Buka [railway.app](https://railway.app) → Login dengan GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Pilih repo project ini → set **Root Directory** ke `/backend`
4. Railway akan otomatis detect Node.js dan jalankan `npm start`
5. Set **Environment Variables** di Railway:
   ```
   DB_HOST=<host MySQL Railway>
   DB_USER=<user MySQL>
   DB_PASSWORD=<password MySQL>
   DB_NAME=onlineshop_db
   JWT_SECRET=<random string panjang>
   PORT=3000
   ```
6. Tambahkan **MySQL Plugin** di Railway → copy credentials ke env vars
7. Import `database.sql` ke MySQL Railway

### 3. Deploy Frontend ke GitHub Pages
1. Update `BASE_URL` di `frontend/api.js`:
   ```js
   const BASE_URL = 'https://nama-project.railway.app/api';
   ```
2. Push frontend ke branch `gh-pages` atau gunakan GitHub Actions
3. Enable GitHub Pages di Settings → Pages

---

## 🧪 Testing dengan Postman

Import file `backend/postman_collection.json` ke Postman:
1. Buka Postman → **Import** → pilih file `postman_collection.json`
2. Set Collection Variable `base_url` ke URL backend
3. Jalankan **Login (Admin)** terlebih dahulu → token tersimpan otomatis
4. Test semua endpoint

---

## 👨‍💻 Fitur Aplikasi

### Customer (User)
- ✅ Register & Login
- ✅ Lihat produk & detail produk
- ✅ Filter produk per kategori
- ✅ Keranjang belanja
- ✅ Checkout dengan notif WhatsApp
- ✅ Riwayat pesanan (auto-update tiap 5 detik)
- ✅ Wishlist produk
- ✅ Dark/Light mode

### Admin
- ✅ Dashboard dengan statistik & grafik pendapatan
- ✅ Kelola produk (CRUD)
- ✅ Kelola pesanan & update status
- ✅ Kelola pengguna
- ✅ Pengaturan toko
- ✅ Hanya hitung pendapatan dari order "selesai"

---

## 📝 Catatan

- Password di-hash menggunakan **bcrypt** (salt rounds: 10)
- JWT token berlaku **7 hari**
- Backward compatible: password lama (plaintext) otomatis di-upgrade ke bcrypt saat login
- Frontend auto-redirect ke login jika token expired (401/403)
- Mendukung **dual mode**: bisa jalan tanpa backend (LocalStorage mode untuk demo UTS)
