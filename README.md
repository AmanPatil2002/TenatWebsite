# TenatWebsite

A multi-tenant **website-template marketplace and site builder**. Platform admins publish templates, themes and page libraries; clients browse, customise and purchase a template, and receive a hosted site they can manage through their own dedicated site-admin panel.

> **Stack:** React 19 · Vite · Material UI · Express 5 · MySQL · JWT

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Scripts](#scripts)

---

## Overview

TenatWebsite has three kinds of users:

| Role | Description |
|------|-------------|
| **Platform Admin** | Manages categories, themes, page library, templates, users, reviews, payments, FAQs and contact details. Grants site-admin access per purchased site. |
| **Client** | Registers, browses templates, picks a theme and optional additional pages, pays, and gets a site with an expiry date. |
| **Site Admin** | A separate per-site login (issued by the platform admin) used to manage the site's pages, employees, news, slider and gallery. It never exposes purchased theme settings. |

## Features

**Clients**
- Registration, login, profile editing, password change
- Forgot-password flow with a 6-digit email code (10-minute expiry, cooldown and attempt limit)
- Template catalogue with category, description, photos and available themes
- Checkout: choose a theme, add optional paid pages, get a server-side price quote, pay
- Invoices (PDF generation via PDFKit) and payment history
- "My Site" area with live preview of purchased sites
- Reviews (1–5 rating) and public contact / FAQ pages

**Platform Admin**
- Dashboard with charts (MUI X Charts)
- CRUD for categories, themes, pages, templates and template-page ordering
- User management (edit profile, role and status)
- Payments and invoice overview, review moderation
- FAQ and contact-information management
- Issues per-site admin credentials, delivered by email

**Site Admin**
- Edit site-specific copies of purchased pages (rich text via CKEditor 4)
- Add custom pages without touching the shared library
- Manage employees, news, slider images and gallery
- Media upload (images and video) through the CKEditor upload endpoints

**Platform**
- Role-based access control and JWT authentication (HS256, 7-day tokens)
- Transactional order creation with price calculated on the server
- Automatic site provisioning (invoice + site + site pages) on a captured payment
- Email notifications (payment received, site-admin access, password reset) via Nodemailer

## Tech Stack

### Frontend (`/frontend`)

| Area | Library |
|------|---------|
| Framework | React 19 |
| Build tool | Vite 8 (`@vitejs/plugin-react`) |
| Routing | React Router DOM 7 |
| UI | Material UI 9 (`@mui/material`, `@mui/icons-material`), Emotion, styled-components |
| Charts | `@mui/x-charts` |
| Rich text | `ckeditor4`, `ckeditor4-react` |
| HTTP | Axios |
| Linting | Oxlint |

### Backend (`/backend`)

| Area | Library |
|------|---------|
| Runtime / framework | Node.js, Express 5 |
| Database | MySQL via `mysql2` (connection pool) |
| Auth | `jsonwebtoken`, `bcryptjs` |
| File uploads | `multer` |
| Email | `nodemailer` |
| PDF invoices | `pdfkit` |
| Config / CORS | `dotenv`, `cors` |
| Dev server | `nodemon` |

## Architecture

```
┌──────────────┐   HTTPS/JSON   ┌────────────────────┐    SQL    ┌─────────┐
│  React SPA   │ ─────────────► │  Express REST API  │ ────────► │  MySQL  │
│  (Vite)      │ ◄───────────── │  JWT + RBAC        │           │ tenant  │
└──────────────┘                └─────────┬──────────┘           └─────────┘
                                          │
                              ┌───────────┴───────────┐
                              │ /uploads (static)     │
                              │ SMTP (Nodemailer)     │
                              └───────────────────────┘
```

**Request flow for a purchase**

1. Client selects a template, a theme and optional extra pages.
2. `POST /payments/quote` returns a server-calculated total.
3. `POST /payments` runs in a DB transaction: creates the payment and payment-page snapshot, issues an invoice, provisions a site (with its expiry date based on the template's `validityDays`) and copies the purchased pages into editable site pages.
4. A confirmation email is sent.

**Authentication layers**

- `authenticate` – validates the user JWT and re-checks the account is `active` in the database.
- `requirePlatformAdmin` – restricts routes to `role = admin`.
- `authenticateSiteAdmin` – validates a separate `siteAdmin` JWT and confirms the site is active, unexpired and paid.

## Project Structure

```
TenatWebsite/
├── backend/
│   ├── server.js                # App entry point, route mounting, error handlers
│   ├── schema.sql               # Database schema, views and seed-safe migrations
│   ├── .env.example
│   ├── config/db.js             # MySQL connection pool
│   ├── middleware/              # authenticate, authenticateSiteAdmin, siteAccess
│   ├── route/                   # Express routers (auth, templates, payments, sites, ...)
│   ├── controller/              # Request handlers / business logic
│   ├── utils/                   # pricing, provision, mailer, tx (transactions)
│   └── uploads/                 # Uploaded media (served at /uploads)
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx              # Route table
        ├── Pages/
        │   ├── Login.jsx · Register.jsx · ResetPassword.jsx
        │   ├── Admin/           # Admin shell + profile dialog
        │   └── Client/          # Home, Template, Contact, Review, Myaccount, MySite, SiteAdminLogin
        ├── Mycomponent/         # Shared and feature components (Header, Footer, Layout,
        │                        #   Payment, AddTemplate, AddPages, SiteAdmin* panels, ...)
        └── utils/               # ProtectedRoutes, siteSlug
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- An SMTP account (e.g. Gmail app password) for emails

### 1. Clone

```bash
git clone https://github.com/AmanPatil2002/TenatWebsite.git
cd TenatWebsite
```

### 2. Set up the database

```bash
mysql -u root -p < backend/schema.sql
```

This creates the `tenant` database with all tables and views.

### 3. Run the backend

```bash
cd backend
npm install
cp .env.example .env        # then edit the values
npx nodemon server.js       # or: node server.js
```

The API listens on `http://localhost:5000` by default.

### 4. Run the frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:5000" > .env
npm run dev
```

The app is served at `http://localhost:5173`.

### 5. Create the first admin

Public registration always creates a `client`. Register an account in the UI, then promote it:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Log in again and open `/admin`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | `5000` |
| `db_host` | MySQL host | `localhost` |
| `db_user` | MySQL user | `root` |
| `db_password` | MySQL password | – |
| `db_name` | MySQL database | `tenant` |
| `SECRET_KEY` | JWT signing secret (**required**, server will not start without it) | – |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | SMTP server settings | `587`, `false` |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials | – |
| `MAIL_FROM` | "From" header for outgoing mail | – |
| `FRONTEND_URL` | Public frontend URL used in email links | `http://localhost:5173` |
| `CLIENT_URL` | Comma-separated CORS allow-list (all origins allowed if unset) | – |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the backend API |

## Database

The schema (`backend/schema.sql`) targets MySQL 8 with `utf8mb4` and foreign keys throughout.

| Group | Tables |
|-------|--------|
| Accounts | `users`, `passwordResets` |
| Catalogue | `categories`, `theme`, `pages`, `template`, `templatepages`, `templatetheme` |
| Commerce | `payments`, `paymentpages`, `invoices` |
| Tenant sites | `sites`, `admin` (site-admin logins), `sitepages`, `siteentries`, `siteemployees`, `sitenews`, `sitegalleries`, `siteslider` |
| Content | `review`, `faq`, `acontact` |
| Views | `templatefull` (public catalogue – page titles only), `sitepagesview` (post-purchase page content for active, paid sites) |

Design highlights:

- Composite foreign keys guarantee a chosen theme belongs to the purchased template and every ordered page belongs to that template.
- Page content is only exposed through `sitepagesview` after a captured payment.
- Each site has one payment (`UNIQUE paymentId`) and one site-admin login.

## API Reference

All routes return JSON. 🔒 = requires `Authorization: Bearer <token>`; 🛡️ = platform admin only; 🏢 = site-admin token.

| Prefix | Highlights |
|--------|-----------|
| `/auth` | `POST /register`, `POST /login`, `POST /forgot-password`, `GET /reset-password/status`, `POST /reset-password` · 🔒 `GET/PUT /me`, `PUT /me/password`, `GET/PUT /users/:userId`, `PATCH /users/:userId/status` |
| `/categories` | `GET /`, `GET /:categoryId` · 🔒 `POST`, `PUT`, `DELETE` |
| `/templates` | `GET /`, `GET /:templateId` · 🛡️ `GET /admin/all`, `GET /admin/:templateId`, `POST /`, `PUT /:templateId`, `DELETE /:templateId` |
| `/theme` | 🔒 `GET /` · 🛡️ `POST`, `PUT /:themeId`, `DELETE /:themeId` |
| `/pages` | 🔒 `GET /`, `GET /:id` · 🛡️ `POST`, `PUT /:id`, `DELETE /:id` |
| `/payments` | 🔒 `POST /quote`, `POST /`, `GET /my`, `GET /:id`, `GET /invoices/my`, `GET /invoices/:id` · 🛡️ `GET /admin/all` |
| `/sites` | `POST /admin/login` · 🔒 `GET /my`, `GET/POST /:siteId/pages`, `PUT /:siteId/pages/:pageId`, `GET /:siteId/media` · 🏢 `/client-admin/:siteId/{employees,entries,news,gallery,slider}` (CRUD) |
| `/review` | `GET /` · 🔒 `GET /myreview`, `POST`, `PUT /:reviewId`, `DELETE /:reviewId` |
| `/faq` | `GET /faq` · 🔒 `POST`, `PUT /faq/:faqId`, `DELETE /faq/:faqId` |
| `/contact` | `GET /acontact` · 🔒 `POST`, `PUT /acontact/:id`, `DELETE /acontact/:id` |
| `/stats` | 🛡️ `GET /` – dashboard statistics |
| `/uploads` | Static files · `POST /uploads/ckeditor` (image), `POST /uploads/ckeditor-video` (video) |

Error responses use the shape `{ "message": "..." }`.

## Frontend Routes

| Path | Access | Purpose |
|------|--------|---------|
| `/`, `/home` | Public | Landing page |
| `/login`, `/register`, `/reset-password` | Public | Authentication |
| `/templates`, `/payment`, `/mysite`, `/mysite/:siteSlug`, `/myaccount`, `/contact`, `/review` | Logged in | Client area |
| `/admin/*` | Admin | `theme`, `page`, `templates`, `templates/:id/edit`, `category`, `viewtemplates`, `template-pages`, `users`, `usereview`, `admindashboard`, `invoice`, `site-admins`, `faq`, `contact` |
| `/site-admin/:siteId/login` | Public | Site-admin sign-in |
| `/site-admin/:siteId/*` | Site admin | `panel`, `manage`, `employees`, `news`, `slider`, `gallery`, `preview` |

## Security Notes

- Passwords are hashed with bcrypt; reset codes are stored hashed, single-use and attempt-limited.
- JWTs are verified with a pinned algorithm (HS256); user status is re-validated against the database on every request.
- Prices are always calculated on the server from database values, never trusted from the client.
- Uploads are restricted by MIME type and size, and stored under random UUID filenames.
- **Never commit `.env` files.** Use `backend/.env.example` as a template and keep real credentials out of version control. Use a long, random `SECRET_KEY` in production.

## Known Limitations

- Payments are currently recorded as `manual` and marked `captured` immediately; no payment gateway is integrated yet.
- No automated tests are configured.
- The frontend stores the JWT in `localStorage`.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `frontend` | `npm run dev` | Start the Vite dev server |
| `frontend` | `npm run build` | Production build |
| `frontend` | `npm run preview` | Preview the production build |
| `frontend` | `npm run lint` | Lint with Oxlint |
| `backend` | `node server.js` | Start the API |
| `backend` | `npx nodemon server.js` | Start the API with auto-reload |
