# Hamro Pasal (हाम्रो पसल) — Full-Stack E-Commerce

**Hamro Pasal** (Nepali for "Our Shop") is a high-performance, full-stack e-commerce application designed to provide a secure, fast, and feature-rich shopping experience. The project has been fully developed, tested, and containerized.

This repository is now **completed and wrapped up**.

---

## 📄 Project Documentation

Detailed project architecture, timeline logs, and run instructions are compiled in the following formats:

* **[Downloadable PDF Documentation](docs/PROJECT_DOCUMENTATION.pdf)** — Richly formatted PDF covering all milestones from Day 1 to Day 19.
* **[HTML Documentation](docs/PROJECT_DOCUMENTATION.html)** — Web-friendly HTML source of the project documentation.
* **[Daily Progress Log (PROGRESS.md)](docs/PROGRESS.md)** — Day-by-day technical execution log mapping architecture decisions and commits.

---

## 🛠️ Tech Stack & Highlights

* **Backend:** NestJS (TypeScript), Passport.js (JWT Access/Refresh token rotation in secure HttpOnly cookies), Helmet headers, rate-limiting guards, and Prisma ORM.
* **Frontend:** React (Vite SPA), Zustand (with localStorage state persistence for Cart and Wishlist), custom CSS layout (Light/Dark themes), and lazy-loaded routes.
* **Database:** SQLite with concurrent transactional safety logic.
* **Integrations:** Stripe, eSewa Sandbox, and IME Pay Sandbox payment gateways.
* **DevOps:** Fully containerized multi-stage Docker environment orchestrating backend NestJS and frontend static Nginx services via Docker Compose.

---

## 🚀 Running the Application

### Option A: Using Docker Compose (Recommended)
Launch the entire system (database, backend API, and frontend server) with a single command:
```bash
docker compose up --build -d
```
The frontend is exposed on [http://localhost:5173](http://localhost:5173) and the backend API on [http://localhost:3000](http://localhost:3000).

### Option B: Local Development
To run services independently:
1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```
2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🧪 Running Tests
Verify the backend business logic and services:
```bash
cd backend
npm run test
```
All unit tests compile and pass cleanly, ensuring transactional order safety, sandbox gateway signature validations, and catalog filter correctness.
