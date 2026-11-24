# 🏠 Tenant Website Management System

A full-stack, multi-tenant web application designed to simplify tenant, property, and website administration. The system provides an interface for managing site content, administrator profiles, media assets, secure content previews, and dynamically provisioned per-site databases.

Built using **React 19, Vite, Material UI, Node.js, Express 5, and MySQL**.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Architecture & Data Flow](#-architecture--data-flow)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Database Configuration](#-database-configuration)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Project Overview

Tenant Website Management System is a full-stack application split into a separate frontend and backend. It supports a **multi-tenant architecture**: a master database stores tenant/site metadata, and each provisioned site gets its own isolated MySQL database (created dynamically at purchase time) populated from vertical-specific packs (e-commerce, school, medical, restaurant, hotel, etc.).

The frontend provides a modern, responsive interface using React and Material UI, while the backend handles application logic, authentication, database communication, file uploads, email functionality, PDF generation, and per-site data provisioning.

### Architecture

```text
                       TENANT WEBSITE
                             |
              +--------------+--------------+
              |                             |
           FRONTEND                       BACKEND
              |                             |
         React 19 + Vite             Node.js + Express 5
              |                             |
         Material UI                   REST APIs
              |                             |
           Axios                          |
              |                             |
              +--------------+--------------+
                             |
                          MySQL
                  (master + per-site DBs)
```

---

## ✨ Features

- **Multi-Tenant Site Provisioning**
  - Dynamic per-site database creation at purchase time.
  - Vertical-specific table packs (e-commerce, school, medical, restaurant, hotel, real estate, gym, blog, portfolio, events, NGO, salon, news, finance, agriculture, consulting, pet care, daycare, dental, mobile apps, interior design, and more).
  - Site admin users provisioned alongside each site.

- **Site Administration**
  - Administrator profile management.
  - Secure password handling (bcryptjs).
  - Protected administrator routes (JWT).
  - Read-only / status-only table enforcement for site admins.

- **Dynamic Content Management**
  - Website content management via CKEditor 4.
  - Dynamic content hydration and sanitization.
  - Iframe-based live website preview with automatic sizing.
  - Pages stored per-site with source-page mapping.

- **CKEditor Form Submissions**
  - Forms embedded in CKEditor page content submit via `postMessage` to the React host.
  - Public submissions routed to `/sites/:siteId/public/:resource`.
  - Honeypot spam protection, rate limiting, and field validation.

- **Media Management**
  - File upload handling via Multer.
  - CKEditor image upload endpoint.
  - Static file serving from `/uploads`.

- **Document Generation**
  - PDF generation using PDFKit.

- **Email Functionality**
  - Email integration using Nodemailer (SMTP).
  - Admin ownership verification emails.

- **Modern User Interface**
  - React 19 + Vite.
  - Material UI components + MUI Icons.
  - MUI X Charts for data visualization.
  - Emotion + Styled Components.

---

## 🛠 Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | Frontend library |
| Vite | Development server and build tool |
| Material UI | UI components |
| MUI Icons | Material Design icons |
| MUI X Charts | Charts and data visualization |
| Emotion | CSS-in-JS styling |
| Styled Components | Component styling |
| React Router DOM | Client-side routing |
| Axios | HTTP requests |
| CKEditor 4 | Rich text editor |
| CKEditor4 React | React integration for CKEditor |
| Dotenv | Environment configuration |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express 5 | Backend framework |
| MySQL2 | MySQL database connection |
| bcryptjs | Password hashing |
| JSON Web Token | Authentication |
| CORS | Cross-origin resource sharing |
| Multer | File uploads |
| Nodemailer | Email functionality |
| PDFKit | PDF generation |
| Dotenv | Environment variables |
| Nodemon | Development server monitoring |

### Development Tools

- Visual Studio Code
- Git / GitHub
- npm
- MySQL Server / MySQL Workbench
- Jest (testing)

---

## 📂 Project Structure

```text
TenatWebsite/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── Pages/          # Route-level pages (Client, Admin, Site)
│   │   ├── Mycomponent/    # Reusable components (MySiteView, etc.)
│   │   ├── utils/          # siteForms, helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── backend/
│   ├── config/             # db, packs, permissions, provisionSite, readOnlyTables
│   ├── controller/         # Route controllers
│   ├── middleware/         # auth, siteAccess, themeservice
│   ├── route/              # Express route definitions
│   ├── uploads/            # Uploaded media (sites/, ckeditor/)
│   ├── utils/              # mailer, pricing, provision, migrate scripts
│   ├── server.js
│   ├── schema.sql
│   ├── package.json
│   └── .env
│
├── .claude/                # Claude Code skills & settings
├── CLAUDE.md
└── README.md
```

---

## 🔄 Architecture & Data Flow

### 1. Master Database (`tenant`)
Stores global metadata: sites, site admins, templates, themes, headers, pages, categories, FAQs, stats, bug reports.

### 2. Per-Site Databases (`site_<id>`)
Created dynamically by `backend/config/provisionSite.js` when a site is purchased. Each database is seeded from a vertical pack defined in `backend/config/packs.js`.

### 3. Request Flow (Site Data)
```
Browser (iframe) → React host (postMessage) → Axios → Express /sites/:siteId/public/:resource → MySQL (per-site DB)
```

### 4. Authentication Flows
- **Super admin / site admin**: JWT via `/auth` routes, middleware in `backend/middleware/authenticate.js` and `authenticateSiteAdmin.js`.
- **Public site visitors**: No auth; submissions go through `publicSubmit` with honeypot + rate limiting.

### 5. Table Permissions
`backend/config/readOnlyTables.js` defines per-vertical table modes:
- `full` — admin can CRUD.
- `status` — admin can only update the status field.
- `view` — read-only in admin, but public form submissions allowed (except blocked tables).
- `hidden` — never exposed.

---

## 📋 Prerequisites

| Software | Purpose |
|---|---|
| Node.js (LTS) | Run frontend and backend |
| npm | Install dependencies |
| MySQL Server | Database |
| MySQL Workbench | Database management (optional) |
| Visual Studio Code | Code editor |
| Git | Version control |

Check your installations:

```bash
node -v
npm -v
git --version
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AmanPatil2002/TenatWebsite.git
cd TenatWebsite
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install --legacy-peer-deps
```

The legacy peer dependency option is required because of CKEditor 4 / React 19 peer conflicts. If a normal `npm install` works with your installed versions, you can use that instead.

---

## 🔐 Environment Configuration

### Backend Environment

Create `backend/.env`:

```env
# Database (master)
db_host=localhost
db_user=root
db_password=1234
db_name=tenant

# Auth
SECRET_KEY=mysecretkey

# SMTP (admin verification emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM="Multitenant <your_email@gmail.com>"

# Frontend URL (for CORS + email links)
FRONTEND_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173

# Server
PORT=5000
```

### Frontend Environment

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

**Important:**
- Never commit `.env` files with real credentials.
- Vite only exposes variables prefixed with `VITE_` to the browser. Never put private secrets in frontend env vars.

---

## 🗄 Database Configuration

### Step 1: Create the Master Database

```sql
CREATE DATABASE tenant;
```

### Step 2: Import the Schema

```bash
mysql -u root -p tenant < backend/schema.sql
```

### Step 3: Verify Connection

Start the backend; you should see `Connection to Database Successful`.

### Step 4: Per-Site Databases

These are created automatically by `backend/config/provisionSite.js` when a site is purchased. No manual setup required. Each gets a name like `site_<id>` and is seeded from the chosen vertical pack.

---

## ▶️ Running the Application

The frontend and backend must run in separate terminals.

### 1. Start the Backend

```bash
cd backend
npm run dev
```

Backend URL: `http://localhost:5000`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend URL (Vite default): `http://localhost:5173`

### 3. Open the Application

Navigate to `http://localhost:5173` in your browser.

---

## 🔌 API Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/*` | Authentication (login, register, verify) |
| GET/POST | `/categories/*` | Category management |
| GET/POST | `/templates/*` | Template management |
| GET/POST | `/payments/*` | Payment handling |
| GET/POST | `/sites/*` | Site CRUD, purchase, provisioning |
| GET/POST | `/sites/:siteId/public/:resource` | Public form submissions (CKEditor forms) |
| GET/POST | `/sites/:siteId/...` | Site data, content, media |
| GET/POST | `/pages/*` | Page management |
| GET/POST | `/theme/*` | Theme management |
| GET/POST | `/faq/*` | FAQ management |
| GET/POST | `/contact/*` | Contact form submissions |
| GET/POST | `/stats/*` | Statistics |
| GET/POST | `/bugreports/*` | Bug report submissions |
| POST | `/uploads` | File uploads (Multer + CKEditor) |

For full endpoint details, refer to the route files in `backend/route/`.

---

## 🛡 Security

- **bcryptjs** for password hashing.
- **JWT** for authentication (super admin + site admin).
- Protected routes and authentication middleware.
- **CORS** configuration driven by `CLIENT_URL`.
- Input sanitization for secure content previews.
- Environment variables for sensitive configuration.
- MySQL connection pooling with `mysql2`.
- Honeypot spam protection on public forms.
- Rate limiting (`publicSubmissionLimit`) on public submissions.
- Table-level permission enforcement (`readOnlyTables.js`).

**Recommendations:**
- Validate all incoming API data.
- Never store plain-text passwords.
- Never commit `.env` files.
- Validate uploaded file types and sizes.
- Use HTTPS in production.
- Review CKEditor 4 security and licensing requirements before production deployment.

---

## 🐛 Troubleshooting

### 1. Vite Command Not Found

```bash
cd frontend
npm install
npm run dev
```

### 2. MySQL Connection Error

Check:
- MySQL Server is running.
- `db_host`, `db_user`, `db_password`, `db_name` in `backend/.env` are correct.
- The `tenant` database exists.

### 3. CORS Error

Ensure `CLIENT_URL` in `backend/.env` matches your frontend origin (`http://localhost:5173`).

### 4. Module Not Found

```bash
npm install
```

For frontend peer dependency conflicts:

```bash
npm install --legacy-peer-deps
```

### 5. Backend Start Script Missing

`backend/package.json` already includes:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest"
}
```

### 6. Per-Site Database Not Created

Ensure the master DB is connected and `provisionSite.js` runs without errors. Check backend logs during site purchase.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/new-feature
```

3. Commit your changes:

```bash
git add .
git commit -m "Add new feature"
```

4. Push your branch:

```bash
git push origin feature/new-feature
```

5. Create a Pull Request.

---

## 📄 License

This project currently does not specify a confirmed open-source license. Add an appropriate `LICENSE` file before granting permissions for reuse or redistribution.

---

## 👨‍💻 Author

**Aman Patil**

- GitHub: [AmanPatil2002](https://github.com/AmanPatil2002)
- Repository: [TenatWebsite](https://github.com/AmanPatil2002/TenatWebsite)

---

⭐ If you find this project useful, consider giving the repository a star.

**Built with ❤️ using React, Node.js, Express, and MySQL.**