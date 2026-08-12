# 🎓 LMS Untirta

> **A full-stack Learning Management & Academic Information System built for Universitas Sultan Ageng Tirtayasa (Untirta).**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![gRPC](https://img.shields.io/badge/gRPC-Enabled-244c5a?logo=grpc&logoColor=white)](https://grpc.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📸 Preview

<details>
  <summary><b>🔍 Click to expand / view application screenshots</b></summary>
  <br>

  <p align="center">
    <img src="./Home.png" alt="LMS Untirta Home Dashboard" width="800" />
    <br>
    <em>Figure 1: Main Academic Dashboard</em>
  </p>

  <br>

  <p align="center">
    <img src="./Login.png" alt="LMS Untirta Login Page" width="800" />
    <br>
    <em>Figure 2: Multi-Role Authentication Portal</em>
  </p>
</details>

---

## 📌 About The Project

**LMS Untirta** is an end-to-end academic platform designed to manage higher-education coursework, student enrollments, grading, and classroom collaboration. 

### 🌟 Core Capabilities
- **Role-Based Access Control (RBAC)**: Dedicated interfaces and permissions for **Admin**, **Lecturer (*Dosen / DPA*)**, and **Student (*Mahasiswa*)**.
- **KRS (Study Plan) Registration & Approval**: Credit limit enforcement (up to 24 SKS), approval workflows by Academic Advisors (*DPA*), and revision logs.
- **Academic Semester Management**: Semester lifecycle management (`DRAFT` ➔ `OPEN` ➔ `CLOSED`) with automated course offering schedules.
- **Coursework & Materials**: PDF & video distribution with secure, token-authenticated file downloads.
- **Assignments & Submissions**: Deadline management, file upload validations (up to 5 MB), and integrated lecturer grading with feedback.
- **Automated Grading & Transcripts**: Numeric score conversion to standard Letter Grades (`A`–`E`), Grade Points, Semester GPA (*IPS*), and Cumulative GPA (*IPK*).
- **Class Discussion Forums**: Nested Q&A threads and pinned announcements per class.
- **AI Academic Assistant**: Built-in chatbot powered by Google Gemini to assist students and instructors.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Radix UI, TanStack Query v5, Axios, React Hook Form, Zod |
| **Backend** | Node.js (ESM), Express 5, Prisma ORM 6, gRPC (`@grpc/grpc-js`), Zod, Multer, Pino Logger |
| **Database & Cache** | PostgreSQL 16, Redis 7 (caching & rate-limiting) |
| **Integrations** | Google Gemini AI (`@google/generative-ai`), Resend (Transactional Emails) |
| **DevOps & Proxy** | Docker, Docker Compose, Nginx (Reverse Proxy & SSL Termination) |

---

## 🚀 How to Run

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) (Recommended), OR
- [Node.js](https://nodejs.org/) (v20+), [PostgreSQL](https://www.postgresql.org/) (v16), and [Redis](https://redis.io/) (v7)

---

### Method 1: Using Docker Compose (Quickest)

1. **Clone repository:**
   ```bash
   git clone https://github.com/hasibashari/lms-untirta.git
   cd lms-untirta
   ```

2. **Setup backend environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   ```
   *(Optionally update secrets, Gemini API key, or Resend credentials in `backend/.env`)*

3. **Start all services:**
   ```bash
   docker compose up --build -d
   ```

4. **Initialize database schema & default seed accounts:**
   ```bash
   docker compose exec backend npx prisma migrate deploy
   docker compose exec backend npx prisma db seed
   ```

5. **Access the application:**
   - **Frontend App**: [http://localhost](http://localhost) (port 80 / 443)
   - **Backend REST API**: [http://localhost:3000](http://localhost:3000)
   - **API Docs (Swagger UI)**: [http://localhost:3000/docs](http://localhost:3000/docs)
   - **gRPC Server**: `localhost:50051`

---

### Method 2: Manual Local Development

#### 1. Backend

```bash
cd backend

# Install dependencies
npm install

# Setup environment file
cp .env.example .env

# Run migrations and seed data
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Start development server
npm run dev
```
*Backend runs on `http://localhost:3000` (gRPC on port `50051`).*

#### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment file
cp .env.example .env

# Start Vite dev server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🔑 Default Test Credentials

Running `npx prisma db seed` creates these initial accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@untirta.ac.id` | `password123` | Full system administration |
| **Lecturer** | `budi.santoso@untirta.ac.id` | `password123` | Course Instructor & Academic Advisor (*DPA*) |
| **Student** | `budi@untirta.ac.id` | `password123` | NIM: `230000001` (Advised by Budi Santoso) |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```ini
DATABASE_URL="postgresql://dev_user:admin@localhost:5432/lms_db?schema=public"
JWT_SECRET="your_jwt_secret_key_here"
REDIS_URL="redis://localhost:6379"
GEMINI_API="your_gemini_api_key_here"
PORT=3000
FRONTEND_URL="http://localhost:3000"
RESEND_API="your_resend_api_key_here"
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL="http://localhost:3000/api"
```

---

## 📖 API Documentation

Interactive Swagger documentation is available once the backend is running:
- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI 3.0 Spec**: `http://localhost:3000/docs.json`

---

## 📄 License

Distributed under the [ISC License](LICENSE).