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

---

## Day 4 — Product Catalog API
Implemented a robust product catalog REST API, configured database seeding, and verified the endpoints with high unit test coverage.

### Key Architecture Decisions
1. **Public Catalog, Protected Admin Actions**:
   - Access to viewing the catalog (`GET /products` and `GET /products/:id`) is made public via the `@Public()` decorator to bypass global route checks.
   - Access to modify the catalog (`POST`, `PATCH`, `DELETE`) is guarded globally and requires the user to have the `'ADMIN'` role, checked by `RolesGuard` and `@Roles('ADMIN')`.
2. **Unified Filtering & Pagination**:
   - The query interface integrates optional search, category filters, price ranges (minimum and maximum), and standard page/limit offset calculations.
3. **Database Seeding via Driver Adapter**:
   - Handled seeding using `better-sqlite3` adapter inside `prisma.config.ts` and `seed.ts` to ensure compatibility with SQLite.

### Detailed Implementation Steps

#### 1. Request Validation DTOs (`product/dto/`)
* `CreateProductDto`: Defines and validates product catalog parameters (`title`, `description`, `price`, `image`, `category`, `stock`) using `class-validator` rules.
* `UpdateProductDto`: Optional-mapped matching parameters for patch actions.

#### 2. Product Service & Database Actions (`product/product.service.ts`)
* Implemented paginated queries:
  * Computes search matches inside title and description.
  * Filters categories exactly.
  * Bounds floats within min/max price range parameters.
* Validates product existence prior to updates or removals, returning standard HTTP 404 responses if a request references an invalid key.

#### 3. Seed Configuration (`prisma/seed.ts` & `prisma.config.ts`)
* Wrote `seed.ts` inserting 8 initial high-quality product assets (accessories, electronics, clothing, and kitchen items).
* Modified `prisma.config.ts` to register the new database seeding script.

#### 4. Service Tests (`product/product.service.spec.ts`)
* Added unit tests asserting creation, search filters, pagination offsets, missing product exceptions, modifications, and deletions.

### Verification Run Output
All tests compiled and ran cleanly:
```bash
PASS src/product/product.service.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/app.controller.spec.ts

Test Suites: 3 passed, 3 total
Tests:       9 passed, 9 total
Snapshots:   0 total
```

---

## Day 5 — Product Catalog UI
Implemented a complete, premium client-side product catalog, state management, search filters, and detail view pages using React, Zustand, Lucide Icons, and custom CSS styling.

### Key Architecture Decisions
1. **Zustand Product Store**:
   - Centralized product catalog state (loading, error, list, detail views, pagination metadata).
   - Dynamically constructs query parameters (`search`, `category`, `minPrice`, `maxPrice`, `page`, `limit`) and fetches results from backend endpoints.
2. **Interactive Catalog Dashboard**:
   - Implemented real-time sidebar filtering: categories chip selector, search keyword, and custom price range bounding.
   - Smooth transitions and paginated grid layout to ensure responsive structure on mobile and desktop viewports.
3. **Dedicated Product Detail Page**:
   - Implemented direct URL routing (`/products/:id`) fetching single item specs.
   - Cleans up active product state on component unmount to prevent visual layout flashing next time.

### Detailed Implementation Steps

#### 1. Zustand Products Store (`store/products.ts`)
* Defined interfaces for `Product`, `ProductFilters`, and `ProductState`.
* Handled API async actions:
  - `fetchProducts(filters)`: Formulates search queries and queries `/products`.
  - `fetchProductById(id)`: Queries `/products/:id` with fallback errors.
  - `clearCurrentProduct()`: Resets the state.

#### 2. Catalog Listing Dashboard (`pages/Catalog.tsx`)
* Implemented filter inputs (search, category tags, min/max price sliders) updating queries.
* Included interactive loading indicator spinner, empty results warnings, and next/prev page controllers.

#### 3. Product Detail View (`pages/ProductDetail.tsx`)
* Extracted routing params (`id`) on mount and triggered fetch routines.
* Added stylized layout grid containing big-ratio product image, title headers, category badges, descriptions, and stock status indicators.

#### 4. Navigation & Layout Routing (`App.tsx` & `Navbar.tsx`)
* Registered `/shop` and `/products/:id` routes.
* Appended a direct "Shop" link in the header navigation panel.
* Added custom responsive CSS layouts in `index.css` for grid display cards, scaling images, badges, pagination, and stock trackers.

### Verification Run Output
* Successfully validated the React codebase using `npx tsc --noEmit`. No errors were found.

---

## Day 6 — Cart & Wishlist

Implemented client-side Cart & Wishlist features using React, Zustand persistent store state, and custom CSS layouts.

### Key Architecture Decisions
1. **Persistent Zustand State**:
   - Developed `useCartStore` in `store/cart.ts` using Zustand's `persist` middleware.
   - Saves the cart items and wishlist state automatically to `localStorage`.
   - Prevents UI states (drawer/modal open/closed states) from being persisted.
2. **Slide-Out Cart Drawer UI**:
   - Built a sleek slide-out panel from the right displaying items, quantity adjusters, subtotal/tax/total pricing breakdown, and checking stock limitations.
3. **Wishlist Modal Overlay**:
   - Built a custom modal showcasing all saved wishlist products.
   - Allows users to add items directly to the cart (with automatic stock verification) or clear wishlist products.
4. **Unified App Overlays Integration**:
   - Mounted the `CartDrawer` and `WishlistModal` at the root level (`App.tsx`) for global access from any page without routing overrides.

### Detailed Implementation Steps

#### 1. Cart & Wishlist Zustand Store (`store/cart.ts`)
* Configured CRUD operations for cart: `addToCart` (clamped to product stock), `removeFromCart`, `updateQuantity` (bounded to 1-stock), and `clearCart`.
* Configured wishlist actions: `toggleWishlist` and `removeFromWishlist`.

#### 2. Navbar Badges (`components/Navbar.tsx`)
* Appended shopping bag and heart icons with absolute notification badges.
* Integrated click actions triggering global overlay visibility states.

#### 3. Wishlist UI & Toggle Buttons (`components/WishlistModal.tsx`, `pages/Catalog.tsx`, `pages/ProductDetail.tsx`)
* Added floating wishlist toggle heart icon on Catalog page item cards.
* Appended wishlist selector on Product Details page, along with quantity increment/decrement controls.

#### 4. Cart UI Drawer (`components/CartDrawer.tsx`)
* Created side-sliding layout panel with subtotal, 10% tax, and total pricing calculators.
* Bound drawer backdrop dismiss hooks.

#### 5. Verification & Styling (`App.tsx`, `pages/Home.tsx`, `index.css`)
* Appended dynamic animations (`slideLeft`, `slideUp`, `fadeIn`) and transparent glassmorphic variables to `index.css`.
* Updated the Roadmap progress on the Home page (Day 6 completed, Day 7 in-progress).

### Verification Run Output
* Verified that the React project compiles cleanly with zero warnings or errors:
```bash
$ npx tsc --noEmit
# Completed successfully (exit status 0)
```

---

## Day 7 — Orders API
Implemented a secure, transactional backend Orders REST API featuring automatic stock verification, backend-sourced price calculations, and role-based access control (RBAC).

### Key Architecture Decisions
1. **Database Transactions (`$transaction`)**:
   * Uses Prisma's atomic transaction utility. If any item is out of stock, validation fails, or database insertion errors out, the entire sequence (stock updates and order insertions) rolls back to prevent inconsistencies.
2. **Backend Price Snapshotting**:
   * Order prices and totals are calculated entirely on the server using database product records, preventing clients from injecting manipulated prices in POST payloads.
   * Storing a snapshot of the unit price on the `OrderItem` preserves historical order invoice data even if catalog product pricing changes in the future.
3. **Role-Based Access Control (RBAC)**:
   * Normal users can place orders and list/view only their own orders (enforced by matching authenticated token `sub` ID).
   * Admins can fetch all system orders and transition order statuses (e.g. `PENDING`, `SHIPPED`, `DELIVERED`), secured with `@Roles('ADMIN')` and `RolesGuard`.

### Detailed Implementation Steps

#### 1. DTO Request Validation (`order/dto/create-order.dto.ts`)
* Defined `CreateOrderDto` containing an array of order items.
* Enabled nested validations via `class-validator`'s `@ValidateNested` and `class-transformer`'s `@Type`.

#### 2. Order Service & Transaction Flow (`order/order.service.ts`)
* `createOrder()`: Checks product availability, verifies enough stock exists, decrements stock, calculates sum total, and inserts the `Order` and `OrderItem` records.
* `getOrders()`: Fetches orders list filtered dynamically by requesting user role.
* `getOrderById()`: Prevents non-admin users from accessing other accounts' orders.
* `updateOrderStatus()`: Sanitizes status updates to standard enum values.

#### 3. Controller Actions (`order/order.controller.ts`)
* Mapped `POST /orders`, `GET /orders`, `GET /orders/:id`, and `PATCH /orders/:id/status`.

#### 4. Unit Testing (`order/order.service.spec.ts`)
* Added 9 detailed unit tests verifying success paths, out-of-stock validation failures, unauthorized query intercepts, and status update transitions.

### Verification Run Output
* Tested NestJS backend unit tests:
```bash
PASS src/app.controller.spec.ts
PASS src/product/product.service.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/order/order.service.spec.ts

Test Suites: 4 passed, 4 total
Tests:       22 passed, 22 total
```





