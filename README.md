# Tenant Website Management System

A comprehensive web-based platform designed for efficient tenant management, property oversight, and administrative control. This system provides a streamlined interface for site administration, media management, and secure content delivery.

## 🚀 Features

*   **Site Administration**: Secure profile management and password security for site administrators.
*   **Dynamic Content Management**: Robust hydration system for managing and previewing site content.
*   **Secure Previews**: Safe, iframe-based site previewing with automatic sizing and content sanitization.
*   **Media & Asset Handling**: Structured media management for property assets.
*   **Modern Frontend**: Built with React 19 and Material UI for a responsive and intuitive user experience.

## 🛠 Tech Stack

### Backend
*   **Runtime**: Node.js & Express 5
*   **Database**: MySQL (via `mysql2`)
*   **Security**: `bcryptjs` (password hashing), `jsonwebtoken` (auth), `cors`
*   **Utilities**: `multer` (file uploads), `nodemailer` (notifications), `pdfkit` (document generation)

### Frontend
*   **Framework**: React 19 (Vite)
*   **UI Components**: Material UI (MUI), Styled Components
*   **Data Visualization**: MUI X Charts
*   **State/Routing**: React Router DOM, Axios

## 📦 Getting Started

### Prerequisites
*   Node.js (LTS version)
*   MySQL Server

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TenatWebsite
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   ```

4. Set up environment variables in `backend/.env` and `frontend/.env`.

5. Run the application:
   - Start backend: `npm run start` (inside `backend/`)
   - Start frontend: `npm run dev` (inside `frontend/`)

## 🛡 Security & Best Practices

*   **Authentication**: All admin routes are protected by robust `authenticateSiteAdmin` middleware.
*   **Input Handling**: Sanitized inputs and allowlist-based URL handling for secure content previewing.
*   **Data Integrity**: InnoDB database configuration with proper indexing to ensure reliable performance.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
