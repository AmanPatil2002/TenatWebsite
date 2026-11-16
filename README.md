# 🏠 Tenant Website Management System

A full-stack web application designed to simplify tenant, property, and website administration. The system provides an interface for managing site content, administrator profiles, media assets, and secure content previews.

Built using **React, Material UI, Node.js, Express.js, and MySQL**.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Database Configuration](#-database-configuration)
- [Running the Application](#-running-the-application)
- [Available Libraries](#-available-libraries)
- [API Configuration](#-api-configuration)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Project Overview

Tenant Website Management System is a full-stack application with a separate frontend and backend.

The frontend provides a modern, responsive interface using React and Material UI, while the backend handles application logic, authentication, database communication, file uploads, email functionality, and document generation.

### Architecture

```text
             TENANT WEBSITE
                   |
          +--------+--------+
          |                 |
       FRONTEND           BACKEND
          |                 |
     React 19            Node.js
       Vite              Express 5
          |                 |
     Material UI       REST APIs
          |                 |
       Axios                |
          |                 |
          +--------+--------+
                   |
                MySQL
```

---

## ✨ Features

The following features are documented in the existing project README:

- **Site Administration**
  - Administrator profile management.
  - Secure password handling.
  - Protected administrator routes.

- **Dynamic Content Management**
  - Website content management.
  - Dynamic content hydration.
  - Content preview functionality.

- **Secure Website Preview**
  - Iframe-based website preview.
  - Automatic preview sizing.
  - Content sanitization.

- **Media Management**
  - Property asset management.
  - File upload handling.
  - Media storage support.

- **Document Generation**
  - PDF generation using PDFKit.

- **Email Functionality**
  - Email integration using Nodemailer.

- **Modern User Interface**
  - React 19.
  - Material UI components.
  - Responsive layouts.
  - Data visualization using MUI X Charts.

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
| Dotenv | Environment configuration package |

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
- Git
- GitHub
- npm
- MySQL Server
- MySQL Workbench

---

## 📂 Project Structure

The repository separates frontend and backend code:

```text
TenatWebsite/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── .env
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── .gitignore
└── README.md
```

*Note: This is an illustrative structure. Adjust directory names to match the actual files in your repository.*

---

## 📋 Prerequisites

Install the following software before running the application.

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
```

Navigate into the project:

```bash
cd TenatWebsite
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

Open another terminal or navigate back to the frontend:

```bash
cd ../frontend
npm install --legacy-peer-deps
```

The legacy peer dependency option is included because the existing project README specifies it. If a normal `npm install` works with your installed package versions, you can use that instead.

---

## 🔐 Environment Configuration

Create environment files for the backend and frontend.

### Backend Environment

Create:

`backend/.env`

Example configuration (adjust variable names to match your backend source code):

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tenant_website

JWT_SECRET=your_secure_random_secret

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
```

### Frontend Environment

Create:

`frontend/.env`

Example:

```env
VITE_API_URL=http://localhost:5000
```

Use the API URL format expected by your Axios configuration.

**Important:**
- Never upload `.env` files containing real credentials to GitHub.
- Keep JWT secrets and email credentials private.
- Vite exposes variables prefixed with `VITE_` to frontend browser code. Never put private secrets in frontend environment variables.

---

## 🗄 Database Configuration

The project uses MySQL through the `mysql2` package.

### Step 1: Install MySQL

Install MySQL Server and optionally MySQL Workbench.

### Step 2: Create a Database

Open MySQL Workbench or the MySQL command line.

```sql
CREATE DATABASE tenant_website;
```

### Step 3: Configure Database Credentials

Update the backend `.env` file with your MySQL host, username, password, and database name.

### Step 4: Import Database Tables

If the repository includes a SQL file, import it into the newly created database.

Otherwise, create the required tables according to the SQL queries used in the backend controllers.

**Note:** The exact database schema and SQL import filename should be added here after verifying the backend source.

---

## ▶️ Running the Application

The frontend and backend must run separately.

### 1. Start the Backend

Open a terminal:

```bash
cd backend
```

For development:

```bash
npx nodemon server.js
```

Alternatively, add these scripts to `backend/package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Then run:

```bash
npm run dev
```

For production:

```bash
npm start
```

### 2. Start the Frontend

Open another terminal:

```bash
cd frontend
```

Start the Vite development server:

```bash
npm run dev
```

### 3. Open the Application

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

Backend URL (if using the example configuration):

```text
http://localhost:5000
```

---

## 📚 Available Libraries

The following are the dependencies declared in the project's package manifests.

### Frontend Libraries

Install all frontend dependencies:

```bash
cd frontend
npm install
```

| Package | Installation Command |
|---|---|
| React | `npm install react react-dom` |
| React Router | `npm install react-router-dom` |
| Material UI | `npm install @mui/material` |
| Material Icons | `npm install @mui/icons-material` |
| Emotion | `npm install @emotion/react @emotion/styled` |
| Styled Components | `npm install styled-components` |
| MUI X Charts | `npm install @mui/x-charts` |
| Axios | `npm install axios` |
| CKEditor 4 | `npm install ckeditor4 ckeditor4-react` |
| Dotenv | `npm install dotenv` |

### Backend Libraries

Install all backend dependencies:

```bash
cd backend
npm install
```

| Package | Installation Command |
|---|---|
| Express | `npm install express` |
| MySQL2 | `npm install mysql2` |
| bcryptjs | `npm install bcryptjs` |
| JWT | `npm install jsonwebtoken` |
| CORS | `npm install cors` |
| Multer | `npm install multer` |
| Nodemailer | `npm install nodemailer` |
| PDFKit | `npm install pdfkit` |
| Dotenv | `npm install dotenv` |
| Nodemon | `npm install -D nodemon` |

### Frontend Development Dependencies

```bash
npm install -D vite @vitejs/plugin-react oxlint
```

**Important:** These commands show how to install individual packages. You do not need to run them all if you have already run `npm install`. The project manifests are the source of truth for the existing dependency versions.

---

## 🔗 API Configuration

The frontend communicates with the backend through HTTP requests.

Example Axios configuration:

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default API;
```

Use this configuration if it matches the existing API implementation.

For actual API endpoints, refer to the backend routes and controllers.

---

## 🛡 Security

The application includes security-related libraries and practices:

- bcryptjs for password hashing.
- JSON Web Tokens for authentication.
- Protected routes and authentication middleware.
- CORS configuration.
- Input sanitization for secure content previews.
- Environment variables for sensitive configuration.
- MySQL database indexing and InnoDB support.

Additional recommendations:

- Validate all incoming API data.
- Never store plain-text passwords.
- Avoid exposing JWT secrets.
- Validate uploaded file types and sizes.
- Restrict access to administrative APIs.
- Use HTTPS in production.
- Review CKEditor 4 security and licensing requirements before production deployment.

---

## 🐛 Troubleshooting

### 1. Vite Command Not Found

Error:

```text
'vite' is not recognized as an internal or external command
```

Solution:

```bash
cd frontend
npm install
npm run dev
```

### 2. MySQL Connection Error

Check:

- MySQL Server is running.
- Database name is correct.
- Username and password are correct.
- Backend environment variables are configured correctly.

### 3. CORS Error

Ensure the backend CORS configuration allows requests from your frontend origin.

### 4. Module Not Found

Install the dependencies again:

```bash
npm install
```

For frontend peer dependency conflicts, try:

```bash
npm install --legacy-peer-deps
```

### 5. Backend Start Script Missing

If `npm start` fails because the script is missing, add:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## 🤝 Contributing

Contributions and suggestions are welcome!

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/new-feature
```

3. Commit your changes.

```bash
git add .
git commit -m "Add new feature"
```

4. Push your branch.

```bash
git push origin feature/new-feature
```

5. Create a Pull Request.

---

## 📄 License

This project currently does not specify a confirmed open-source license.

Add an appropriate `LICENSE` file before granting permissions for reuse or redistribution.

---

## 👨‍💻 Author

**Aman Patil**

- GitHub: [AmanPatil2002](https://github.com/AmanPatil2002)
- Repository: [TenatWebsite](https://github.com/AmanPatil2002/TenatWebsite)

---

⭐ If you find this project useful, consider giving the repository a star.

**Built with ❤️ using React, Node.js, Express, and MySQL.**
