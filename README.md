# 🍽️ RIT Canteen — Cashless Canteen Management System

> A full-stack, real-time cashless canteen system built for Rajarambapu Institute of Technology.  
> Students order food, pay via digital wallet, and track orders live. Kitchen staff manage orders in real-time. Admin controls everything.

---

## 🚀 Live Demo

| Panel | URL | Credentials |
|---|---|---|
| Student | `http://localhost:5173` | Register with college email |
| Kitchen | `http://localhost:5173/kitchen` | Created by Admin |
| Admin | `http://localhost:5173/admin` | Created manually (see setup) |

---

## ✨ Features

- 🔐 JWT Authentication with role-based access (Student / Kitchen / Admin)
- 📱 Mobile-first Student Panel — browse menu, cart, orders, wallet
- 💳 Razorpay wallet top-up with live payment verification
- 📦 Real-time order tracking with Socket.io (Placed → Accepted → Cooking → Ready)
- 📲 QR Code generated per order for counter pickup
- 👨‍🍳 Kitchen Kanban board with live new-order sound alerts
- 📊 Admin analytics dashboard — revenue charts, top items, CSV export
- 🌐 Public landing page with bestsellers, reviews, footer

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.io |
| Auth | JWT + Bcrypt |
| Payments | Razorpay (Test Mode) |
| Images | Cloudinary |
| Fonts | DM Sans + Outfit (Google Fonts) |

---

## 📁 Project Structure

```
cashless-canteen/
├── client/                  → React Frontend
│   ├── public/
│   │   └── rit-logo.png     → Add your RIT logo here
│   └── src/
│       ├── components/
│       │   └── layouts/     → StudentLayout, AdminLayout, KitchenLayout
│       ├── context/         → AuthContext, CartContext
│       ├── pages/
│       │   ├── admin/       → Dashboard, Orders, Menu, Users, Staff
│       │   ├── kitchen/     → KitchenQueue
│       │   └── user/        → Login, Register, Menu, Cart, Orders, Wallet, Profile
│       └── utils/
│           ├── api.js       → All Axios API calls
│           └── helpers.js   → Utility functions
│
└── server/                  → Node.js Backend
    ├── config/              → db.js, env.js
    ├── controllers/         → Auth, Menu, Cart, Order, Wallet, Kitchen, Admin
    ├── middleware/          → auth.js, errorHandler.js, upload.js
    ├── models/              → User, Wallet, WalletTransaction, MenuItem, Category, Order, Cart, Review, Notification
    ├── routes/              → All route files
    └── utils/               → razorpay.js, socket.js, seeder.js, email.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (free tier works)
- Razorpay account (test mode, free)
- Cloudinary account (free tier)
- Gmail account (for email verification)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cashless-canteen.git
cd cashless-canteen
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Fill in `server/.env`:

```env
NODE_ENV=development
PORT=5000

# MongoDB Atlas — get from Atlas Dashboard → Connect → Drivers
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/cashless-canteen?retryWrites=true&w=majority

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_secret_here
JWT_EXPIRES_IN=7d

# College email domain — only this domain can register
COLLEGE_EMAIL_DOMAIN=rit.edu.in

# Frontend URL
CLIENT_URL=http://localhost:5173

# Razorpay — from dashboard.razorpay.com (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Cloudinary — from cloudinary.com Dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail) — use App Password, not your real password
EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=RIT Canteen <your.gmail@gmail.com>
```

Start backend:

```bash
npm run dev
```

You should see:
```
✅ Environment variables validated
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 Server running in development mode on port 5000
```

Seed sample menu data:

```bash
npm run seed
```

---

### 3. Create First Admin Account

Since admin accounts can't self-register, create one directly in MongoDB Atlas:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Open your cluster → Browse Collections → `cashless-canteen` → `users`
3. Insert document:

```json
{
  "name": "Admin User",
  "email": "admin@rit.edu.in",
  "password": "$2a$12$YourHashedPasswordHere",
  "role": "admin",
  "isActive": true,
  "isEmailVerified": true,
  "createdAt": { "$date": "2024-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2024-01-01T00:00:00.000Z" }
}
```

**To get a hashed password**, run this in your server folder:

```bash
node -e "const b=require('bcryptjs'); b.hash('Admin@123', 12).then(h => console.log(h))"
```

Copy the output hash into the `password` field above.

---

### 4. Frontend Setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Add your RIT logo:
```
client/public/rit-logo.png   ← paste your logo here
```

Start frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Test Credentials (Razorpay Test Mode)

| Field | Value |
|---|---|
| Card Number | 4111 1111 1111 1111 |
| Expiry | Any future date |
| CVV | Any 3 digits |
| OTP | 1234 |

---

## 📡 API Reference

Full API docs are in `server/API_REFERENCE.md`

Quick reference:

```
POST   /api/auth/register          → Student registration
POST   /api/auth/login             → All roles login
GET    /api/auth/me                → Get current user
GET    /api/menu                   → Browse menu (public)
POST   /api/cart/add               → Add to cart (student)
POST   /api/orders                 → Place order (student)
POST   /api/wallet/topup/initiate  → Start Razorpay top-up
PATCH  /api/orders/:id/status      → Update order status (kitchen)
GET    /api/admin/analytics/overview → Admin dashboard
```

---

## 🐙 Push to GitHub — Step by Step

### Step 1 — Create repository on GitHub

1. Go to [github.com](https://github.com) → Sign in
2. Click the **+** button → **New repository**
3. Repository name: `cashless-canteen` (or any name)
4. Set to **Private** (recommended — contains .env.example with structure)
5. **Do NOT** tick "Add README" or "Add .gitignore" — we'll add our own
6. Click **Create repository**
7. Copy the repository URL shown (e.g. `https://github.com/yourusername/cashless-canteen.git`)

---

### Step 2 — Create .gitignore files

In your **project root** (`cashless-canteen/`), create a file called `.gitignore`:

```
# Dependencies
node_modules/
*/node_modules/

# Environment files — NEVER commit these
.env
server/.env
client/.env

# Build output
client/dist/
client/build/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# Vite cache
client/.vite/
```

---

### Step 3 — Initialize Git and push

Open terminal in your **project root folder** (`cashless-canteen/`) and run these commands **one by one**:

```bash
# Initialize git repo
git init

# Add all files (gitignore will exclude .env automatically)
git add .

# Check what's being added — make sure .env is NOT listed
git status

# Create first commit
git commit -m "Initial commit — RIT Canteen Cashless System"

# Set main branch
git branch -M main

# Connect to your GitHub repo (paste YOUR repo URL here)
git remote add origin https://github.com/YOUR_USERNAME/cashless-canteen.git

# Push to GitHub
git push -u origin main
```

You'll be asked for your GitHub username and password/token.  
**Use a Personal Access Token (not your password):**
1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Click "Generate new token" → Select `repo` scope → Generate
3. Copy and paste that token as the password

---

### Step 4 — Verify on GitHub

1. Refresh your GitHub repository page
2. You should see all your files
3. Confirm `server/.env` is **NOT** visible (if it is, see note below)

> ⚠️ **If .env was accidentally pushed:**
> ```bash
> git rm --cached server/.env
> git rm --cached client/.env
> git commit -m "Remove .env files from tracking"
> git push
> ```
> Then immediately rotate all your secrets (MongoDB password, JWT secret, Razorpay keys).

---

### Step 5 — Future updates

Every time you make changes:

```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## 👥 Team

Built by students at Rajarambapu Institute of Technology, Islampur.

---

## 📄 License

MIT — Free to use for educational purposes.
