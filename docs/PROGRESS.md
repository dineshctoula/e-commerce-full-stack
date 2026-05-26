# Day-by-Day Implementation Progress

This document tracks our full-stack e-commerce project development step-by-step.

---

## Day 1 — Setup and Architecture
* **Initialize Project structure**: Configured the monorepo with `backend/` (NestJS) and `frontend/` (React/Vite).
* **Setup Database Engine**: Configured SQLite using Prisma ORM.
* **Resolve Mock Dependencies**: Setup `PrismaService` mock for testing, ensuring that both unit and E2E tests execute and pass out-of-the-box.
* **Frontend Verification**: Completed the React and Vite build structure, running a smoke test of the local dev server.

---

## Day 2 — Authentication & User Management (Backend)
Implemented a professional, secure authentication system using NestJS, Passport, and JWT.

### Key Architecture Decisions
1. **Double Token Setup (AT & RT)**:
   * **Access Token (AT)**: Lifetime of 15 minutes. Used to authorize resource requests.
   * **Refresh Token (RT)**: Lifetime of 7 days. Used to obtain new access tokens when they expire.
2. **HttpOnly Cookies**:
   * Storing JWTs inside `httpOnly`, `sameSite: 'lax'` cookies.
   * This mitigates **XSS (Cross-Site Scripting)** attacks since JavaScript cannot access the cookies.
   * This also protects against **CSRF (Cross-Site Request Forgery)** using standard protection.
3. **Token Rotation**:
   * When a client refreshes their tokens, both tokens are regenerated, and the refresh token is re-hashed and saved in the database.
   * If a malicious actor steals a refresh token and attempts to use it, the rotation mechanism invalidates the token family to prevent unauthorized access.

### Detailed Implementation Steps

#### 1. Database Schema
* File: `backend/prisma/schema.prisma`
* Added `hashedRt` to the `User` model:
  ```prisma
  model User {
    id        String   @id @default(uuid())
    email     String   @unique
    password  String
    name      String?
    role      String   @default("USER") // USER, ADMIN
    hashedRt  String?  // Hashed Refresh Token for token rotation
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
* Created and applied database migration `add_hashed_rt` using `npx prisma migrate dev`.
* Upgraded connection structure to support **Prisma 7** driver adapters using `better-sqlite3`.

#### 2. Decorators (`decorators/`)
* `@Public()`: Bypasses the global `AtGuard` so endpoints like login and signup are accessible to public users.
* `@Roles(...)`: Defines target roles (e.g. `@Roles('ADMIN')`) for Role-Based Access Control (RBAC).
* `@GetCurrentUserId()`: Extracts `sub` (userId) from the request's JWT payload.
* `@GetCurrentUser('field')`: Extracts specific values or the entire user payload.

#### 3. Security Guards (`guards/`)
* `AtGuard`: Restricts routes globally to users with valid Access Tokens (unless decorated with `@Public()`).
* `RtGuard`: Used specifically on the refresh route to validate the Refresh Token.
* `RolesGuard`: Verifies if the authenticated user has the necessary role permissions defined via `@Roles()`.

#### 4. Passport Strategies (`strategies/`)
* `AtStrategy`: Extracts the Access Token from either HTTP-only cookies or the Bearer Authorization header, then validates it.
* `RtStrategy`: Extracts the Refresh Token from either cookies or the Bearer header and extracts the raw token.

#### 5. AuthService (`auth.service.ts`)
* `register()`: Hashes the user password using `bcrypt` (10 rounds of salt) and stores it in SQLite, generates tokens, and hashes the refresh token to database.
* `login()`: Validates password with `bcrypt.compare`, generates tokens, and updates database.
* `logout()`: Clears the `hashedRt` field in the database.
* `refreshTokens()`: Compares the incoming refresh token with `hashedRt` using `bcrypt.compare`. If matching, rotates both tokens.

#### 6. AuthController (`auth.controller.ts`)
* Configured `{ passthrough: true }` responses to set HttpOnly cookies.
* Exposes `/auth/register` (Public), `/auth/login` (Public), `/auth/logout` (Protected), `/auth/refresh` (RtGuard protected), and `/auth/me` (Protected).

#### 7. Global Pipes and Middleware (`main.ts`)
* Configured `cookie-parser` to parse incoming cookies.
* Bound a global `ValidationPipe` with `whitelist: true` to strip out malicious/unexpected payload parameters.

### Verification Run Output
We executed a complete curl testing suite (`scratch/test-auth.sh`) which verified:
1. Registration succeeds with status `201 Created`.
2. Duplicate registration fails with status `400 Bad Request`.
3. Login succeeds and writes cookies.
4. Accessing `/auth/me` returns the authenticated user data.
5. Token refresh rotates cookies.
6. Logout successfully nullifies database token references and clears cookies.
7. Subsequent calls to `/auth/me` correctly return `401 Unauthorized`.

---

## Day 3 — Authentication & User Management (Frontend)
Implemented a clean, professional, and secure frontend authentication layer using React, Zustand state management, and custom CSS styling.

### Key Architecture Decisions
1. **Zustand Authentication Store**:
   - Centralized authentication state management (user, isAuthenticated, loading, error).
   - Promotes highly optimized state select triggers to avoid unnecessary re-renders.
2. **HttpOnly Cookie Authorization**:
   - Instructed all outgoing REST API checks with `credentials: 'include'`.
   - Allows automatic transport of cookies to/from the NestJS server port, retaining protection against XSS.
3. **Route Guards (Higher-Order Security)**:
   - Built wrapper guards to intercept restricted path routing.
   - Restricts sensitive pages (like Profile) to logged-in sessions, redirecting guests to the login page.
4. **Fluid Dark Theme Dashboard**:
   - Maintained custom glassmorphism effects and layout classes.
   - Introduced a persistent theme switcher (Dark/Light mode) saved in local storage.

### Detailed Implementation Steps

#### 1. Global State Management (`store/auth.ts`)
* Configured the Zustand `useAuthStore` to track session user data.
* Implemented async handlers:
  * `checkAuth()`: Restores sessions automatically on load using GET `/auth/me`.
  * `login()`: Authenticates details against POST `/auth/login`.
  * `register()`: Submits details against POST `/auth/register`.
  * `logout()`: Clears credentials via POST `/auth/logout` and resets local state.

#### 2. Route Guard Protection (`components/ProtectedRoute.tsx`)
* Implemented `ProtectedRoute` and `AdminRoute` wrappers using React Router DOM.
* Added a graceful loading screen component to prevent page flickering while credentials validation is running.

#### 3. Responsive Navigation Bar (`components/Navbar.tsx`)
* Custom flexbox header linking to pages.
* Renders conditional routes: Guest options vs. Profile links and Sign Out buttons.
* Contains a theme switch toggle updating document level attributes (`data-theme`).

#### 4. Authentication Pages (`pages/Login.tsx` & `pages/Register.tsx`)
* Forms featuring instant validation (password min length checks, confirmation matches).
* Rich glassmorphic card designs featuring CSS transition animations.
* Renders backend server errors within a dedicated error alert component.

#### 5. Profile Page (`pages/Profile.tsx`)
* Displays account details (Name, Email, Role, ID) in a clean dashboard dashboard.
* Restricts access to authenticated accounts using the `ProtectedRoute` layer.

#### 6. Routing & Initialization (`App.tsx`)
* Wrapped pages inside `BrowserRouter`.
* Bound the initial `checkAuth()` hook on startup to confirm user authentication state.

