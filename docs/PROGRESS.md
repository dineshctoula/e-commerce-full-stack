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

---

## Day 8 — Checkout Flow

Implemented a complete full-stack checkout flow, extending backend order models to persist shipping details, introducing a client-side Zustand order store, building a multi-step checkout form layout, and integrating a detailed order history dashboard.

### Key Architecture Decisions
1. **Shipping Fields Database Persistence**:
   - Extended the Prisma SQLite schema's `Order` model with four required fields (`shippingAddress`, `shippingCity`, `shippingPostalCode`, `shippingCountry`) to enforce shipping compliance at database level.
2. **Multi-Step Checkout State Management**:
   - Divided checkout processing into three linear steps: Shipping Details form, Order Summary Review with mock payment selection, and Order Confirmation success view.
3. **Frontend Zustand Order Sync**:
   - Added `useOrderStore` to manage loading states, network error handling, backend request submissions, and customer order history records in a centralized store.
4. **Order History Component**:
   - Refactored the user profile to fetch and visualize past orders, including listing individual line items, dates, statuses, pricing details, and shipping locations.

### Detailed Implementation Steps

#### 1. Database Migrations (`backend/prisma/`)
* Schema: `schema.prisma` - Added required shipping address strings to the `Order` model.
* Created and executed SQLite migration `add_shipping_details`.

#### 2. Backend DTO & Service Validation (`backend/src/order/`)
* DTO: `CreateOrderDto` - Configured `@IsString()` and `@IsNotEmpty()` validation rules for all shipping parameters.
* Service: `OrderService` - Stored the verified shipping parameters in the database transaction.
* Tests: `order.service.spec.ts` - Updated unit tests with shipping data parameters.

#### 3. Frontend Zustand Order Store (`store/orders.ts`)
* Configured `useOrderStore` to trigger endpoints `GET /orders` and `POST /orders` using Cookie-based sessions.

#### 4. Navigation & Route Protections (`App.tsx` & `CartDrawer.tsx`)
* Registered a new protected route `/checkout`.
* Pointed the shopping cart drawer's check out action button to programmatically redirect users to the `/checkout` route.

#### 5. Multi-Step Form Components (`pages/Checkout.tsx`)
* Built three sequential steps with local validations, price math calculations, stock check error states, and a reference ID success page.

#### 6. Order History Dashboard View (`pages/Profile.tsx`)
* Split the Profile page into a responsive split grid dashboard: Left shows credentials card, Right shows order history card with details and dynamic status badges.

---

## Day 9 — Stripe Payments

Implemented a secure, full-stack payment gateway integration using Stripe SDK (backend) and Stripe Elements (frontend).

### Key Architecture Decisions
1. **Secure Backend-Mediated Payment Intents**:
   - Instead of sending card information to our server, we initialize a `PaymentIntent` via Stripe on the NestJS backend using the order total stored in our database.
   - This ensures the exact amount is verified, prevents user tampering with payment details, and complies with PCI-DSS guidelines.
2. **Stripe Elements card form**:
   - Used `@stripe/react-stripe-js` to render the secure `CardElement` component on the frontend, ensuring customer payment credentials go directly to Stripe's servers.
3. **Double Confirmation Loop**:
   - Order is created first in a `PENDING` state.
   - After a client successfully pays via Stripe, a separate confirmation request is sent to the backend (`POST /payments/confirm`).
   - The backend retrieves the status of the `PaymentIntent` from Stripe, verifies its metadata corresponds to the current order ID, and safely transitions the status to `PROCESSING` within a database transaction.

### Detailed Implementation Steps

#### 1. Backend Payment Module (`backend/src/payment/`)
* Created `PaymentService`, `PaymentController`, `PaymentModule`, and registration in `AppModule`.
* Exposed endpoints:
  - `POST /payments/create-intent` (creates PaymentIntent, returns clientSecret).
  - `POST /payments/confirm` (validates success with Stripe, updates order status to `PROCESSING`).

#### 2. Backend Unit Testing (`backend/src/payment/payment.service.spec.ts`)
* Added unit tests asserting success paths and all error states (order not found, unauthorized, invalid state, Stripe payment mismatch).
* Mocked Stripe instance and Prisma database transactions successfully.

#### 3. Frontend Store Integration (`frontend/src/store/orders.ts`)
* Extended `useOrderStore` with `createPaymentIntent` and `confirmPayment` actions communicating with backend endpoints.

#### 4. Frontend Checkout Integration (`frontend/src/pages/Checkout.tsx`)
* Wrapped checkout view inside Stripe's `<Elements>` provider using `loadStripe` and publishable key.
* Integrated card details payment form showing the `CardElement` when the card payment option is selected.
* Updated checkout submit handler to coordinate:
  1. Call `createOrder` to get a pending order ID.
  2. Request Stripe PaymentIntent from the backend.
  3. Execute `stripe.confirmCardPayment` on the client side.
  4. Invoke backend `confirmPayment` to transition the status on success.

---

## Day 10 — Admin Dashboard

Implemented a complete full-stack Admin Control Center featuring system-wide analytics, order status management, and complete product CRUD operations.

### Key Architecture Decisions
1. **Secure Admin Stats API**:
   - Built a secure backend analytics endpoint (`GET /orders/admin/stats`) restricted to users with the `ADMIN` role.
   - Computes key performance metrics (total sales, order counts, average order values, and inventory status) and breakdowns (category sales, order status counts) dynamically in SQL.
2. **State-Driven Action Stores**:
   - Extended the frontend Zustand state stores (`useProductStore` and `useOrderStore`) with admin actions (product CRUD operations and order status overrides) communicating securely with cookie-authenticated backend routes.
3. **Tabbed Control Console**:
   - Developed an integrated admin console (`pages/AdminDashboard.tsx`) with three dedicated tabs: Dashboard Stats (real-time charts and summaries), Manage Orders (status changes and detail panels), and Manage Products (catalog grid with forms).
4. **Declarative Modal Dialogs**:
   - Implemented sleek HTML/CSS modals for creating products, editing products, and confirming catalog deletions without relying on heavy third-party UI libraries.

### Detailed Implementation Steps

#### 1. Backend Service & Controller (`backend/src/order/`)
* Service: `OrderService` - Implemented `getAdminStats()` computing metrics using Prisma aggregates and category sales grouping, with robust unit testing.
* Controller: `OrderController` - Exposed `GET /orders/admin/stats` guarded by the global roles middleware.

#### 2. Frontend Zustand Stores (`frontend/src/store/`)
* Products Store: Added `createProduct`, `updateProduct`, and `deleteProduct` using cookie credentials.
* Orders Store: Added `fetchAdminStats` and `updateOrderStatus` with state updates.

#### 3. Administrative Router Protection (`frontend/src/App.tsx` & `components/Navbar.tsx`)
* Registered the `/admin` path wrapped inside the pre-existing `AdminRoute` guard.
* Appended a conditionally rendered "Admin" link in the navigation header for users with the `ADMIN` role.

#### 4. Dashboard View & Forms (`frontend/src/pages/AdminDashboard.tsx`)
* Built the responsive stats grid, system orders status modification selector, in-memory catalog search, product creation/updating forms, and item deletion modals.

### Verification Run Output
* All backend Jest tests passed successfully:
```bash
PASS src/product/product.service.spec.ts
PASS src/app.controller.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/payment/payment.service.spec.ts
PASS src/order/order.service.spec.ts

Test Suites: 5 passed, 5 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        4.251 s
```
* React codebase compiles cleanly with zero warnings:
```bash
$ npx tsc --noEmit
# Completed successfully (exit status 0)
```

---

## Day 11 — Code Documentation & Comments

Added detailed class and method JSDoc comments to both backend and frontend codebases, outlining system design, security rules, and state management logic. Split across 5 commits for clean version control.

### Key Documentation Highlights

1. **Authentication System (Commit 1)**:
   - Documented the backend controllers, strategies (`AtStrategy`, `RtStrategy`), and guards (`AtGuard`, `RtGuard`, `RolesGuard`).
   - Cleaned up legacy non-English inline comments from strategies.
   - Documented the frontend Zustand authentication store (`store/auth.ts`) and router wrapper guards (`components/ProtectedRoute.tsx`).
2. **Product Catalog Module (Commit 2)**:
   - Documented the backend controllers and services that manage dynamic query pagination and filters.
   - Documented the frontend products store (`store/products.ts`) and pages (`Catalog.tsx`, `ProductDetail.tsx`).
3. **Shopping Cart & Wishlist (Commit 3)**:
   - Documented the persistent Zustand cart store (`store/cart.ts`) and user interface overlays (`CartDrawer.tsx`, `WishlistModal.tsx`).
4. **Order & Payment Modules (Commit 4)**:
   - Documented transactional backend order controllers, services, Stripe payment intent integration controllers, and services.
   - Documented frontend orders store (`store/orders.ts`) and multi-step checkout pages (`Checkout.tsx`).
5. **Admin Dashboard & App Integration (Commit 5)**:
   - Documented the full-stack admin console UI (`AdminDashboard.tsx`) and application root routing setup (`App.tsx`).

---

## Day 12 — Ratings & Reviews System

Implemented a full-stack product rating and customer reviews system, enabling authenticated users who are verified purchasers of a product to write reviews and choose rating stars, and administrators or authors to manage/delete them.

### Key Architecture Decisions
1. **Purchase Validation Logic**:
   - Built a secure, automated validation check in `ReviewService` querying database orders to verify if the submitting user has an associated, fully paid order containing the product, preventing spam reviews.
2. **Dynamic Product Ratings Aggregation**:
   - Integrated dynamic average rating and reviews count calculations into `ProductService.findAll` and `ProductService.findOne` queries using Prisma database mappings.
3. **Cross-Store Zustand State Management**:
   - Implemented `useReviewStore` which dynamically updates product statistics within `useProductStore` upon successful review submission or deletion, allowing real-time, responsive UI updates.
4. **Star-Rating Picker and Breakdown Distribution**:
   - Developed an interactive star selector widget using Lucide icons with smooth hover scale effects, alongside a summary breakdown showing percentage distributions for each star level.

### Detailed Implementation Steps

#### 1. Database Schema
* File: `backend/prisma/schema.prisma`
* Added `Review` model with relations to `User` and `Product`:
  ```prisma
  model Review {
    id        String   @id @default(uuid())
    rating    Int      // 1 to 5 stars
    comment   String
    userId    String
    productId String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  }
  ```

#### 2. Backend Services & Controllers (`backend/src/review/`)
* Service: `ReviewService` - Implements `create` (with verified purchaser validation), `findAllForProduct`, and `remove` (restricted to authors and admins).
* Controller: `ReviewController` - Maps POST, GET, and DELETE routes securely under authentication guards.

#### 3. Frontend Store & UI components (`frontend/src/store/` & `frontend/src/pages/`)
* Store: Created `store/reviews.ts` hosting API requests with Zustand cross-store synchronization.
* Catalog: Integrated star average displays and review counts beneath catalog product titles.
* ProductDetail: Built breakdown progress bars, list of client reviews, admin/author trash indicators, and interactive review entry form.

### Verification Run Output
* Backend unit tests pass cleanly:
  ```bash
  PASS src/app.controller.spec.ts
  PASS src/auth/auth.service.spec.ts
  PASS src/review/review.service.spec.ts
  PASS src/order/order.service.spec.ts
  PASS src/payment/payment.service.spec.ts
  PASS src/product/product.service.spec.ts

  Test Suites: 6 passed, 6 total
  Tests:       44 passed, 44 total
  ```
* Frontend builds and typechecks successfully:
  ```bash
  $ npx tsc --noEmit
  # Completed successfully (exit status 0)
  ```

## Day 13 — Promo Coupon System Backend

Implemented the database schema, CRUD services, validation controller, and secure checkout transaction integrations for the discount coupon promotional system.

### Key Architecture Decisions
1. **Atomic Database Transactions**:
   - Integrated coupon check, usage limit checks, expiry verification, and used count increments atomically within the `prisma.$transaction` checkout block in `OrderService` to prevent race conditions during concurrent checkouts.
2. **Backend Discount Calculations**:
   - Calculated coupon discounts on the server-side to prevent client-side tampering, storing `discountAmount` and `couponId` directly on the `Order` record as an immutable historical record.
3. **Public Validation Endpoint**:
   - Developed `GET /coupons/validate/:code` to allow authenticated users to verify active status, expiry bounds, and minimum spend limits of coupons during cart modification.

### Detailed Implementation Steps

#### 1. Database Schema
* File: `backend/prisma/schema.prisma`
* Added `Coupon` model and referenced it in the `Order` model:
  ```prisma
  model Coupon {
    id             String      @id @default(uuid())
    code           String      @unique
    discountType   DiscountType
    value          Float
    minOrderAmount Float       @default(0)
    maxUses        Int?
    usedCount      Int         @default(0)
    active         Boolean     @default(true)
    expiresAt      DateTime?
    createdAt      DateTime    @default(now())
    updatedAt      DateTime    @updatedAt
    orders         Order[]
  }
  ```

#### 2. Backend Services & Controllers
* Service: `CouponService` - Manages CRUD, listings, and checkout validations.
* Controller: `CouponController` - Exposes REST endpoints for admin management and validation.
* Order: Integrated discount calculations into `OrderService.createOrder`.

---

## Day 14 — Promo Coupon System Frontend & Dashboard

Implemented the client-side state store, checkout flow integration, order history views, and administrative management panel for coupon promo codes.

### Key Architecture Decisions
1. **Unified Zustand Coupon Store**:
   - Created `useCouponStore` for managing administrative CRUD actions (`fetchCoupons`, `createCoupon`, `deleteCoupon`) and checkout code validation (`validateCoupon`).
2. **Checkout Coupon Application**:
   - Embedded coupon code inputs with error handling and real-time discount deduction directly into the step-by-step wizard Checkout component.
3. **Responsive Admin Panel**:
   - Added a dedicated "Manage Coupons" tab inside `AdminDashboard.tsx` displaying coupon codes, types, usage statistics, active statuses, and expirations.

### Detailed Implementation Steps

#### 1. Zustand Store
* File: `frontend/src/store/coupons.ts`
* Created store exposing `fetchCoupons`, `createCoupon`, `deleteCoupon`, `validateCoupon`, and applied coupon states.

#### 2. Administrative Control
* File: `frontend/src/pages/AdminDashboard.tsx`
* Designed coupon listing tables, create coupon modals, and confirmation dialogs.

#### 3. Checkout & Order History
* File: `frontend/src/pages/Checkout.tsx`
* Added promo code entry, real-time total updates, and payload integrations.
* File: `frontend/src/pages/Profile.tsx`
* Displayed discount lines and coupon labels under order details.


---

## Day 15 — Relevance Search, Recommendations Engine, & Security/Performance Auditing

Implemented tokenized search-relevance ranking, collaborative/category-based product recommendation widgets, and global security & performance enhancements.

### Key Architecture Decisions
1. **Relevance-Scoring Search**:
   - Instead of simple database wildcards, the search queries are tokenized. Matches on titles gain higher weight than descriptions, and exact phrase matches receive bonus scores.
2. **Hybrid Product Recommendation Engine**:
   - The product detail view triggers recommended items. Recommendations prioritize same-category products sorted by rating and reviews count, falling back to top-rated catalog items across other categories if needed to pad to 4 recommendations.
3. **Helmet Security Headers & Throttling**:
   - Applied Helmet security headers on NestJS to secure the app against common vulnerabilities.
   - Configured rate limiting (100 requests per minute per IP) globally on backend API routes.
4. **React Route Lazy Loading**:
   - Refactored frontend pages to use dynamic `lazy` imports wrapped in a `Suspense` loader, lowering initial javascript bundle sizes and speeding up initial paint.

### Detailed Implementation Steps

#### 1. Search Relevance (Backend & Frontend)
* File: `backend/src/product/product.service.ts`
* Tokenized keyword terms, calculated search weight scores, handled custom sorting, and returned scored matching results.
* File: `frontend/src/pages/Catalog.tsx`
* Added an active search query banner detailing relevance sorting and a clear trigger.

#### 2. Recommendations Engine
* Files: `backend/src/product/product.controller.ts` & `product.service.ts`
* Exposed `GET /products/:id/recommendations` returning top-rated related items. Added spec suite validating engine ordering and padding.
* Files: `frontend/src/store/products.ts` & `pages/ProductDetail.tsx`
* Integrated state actions and a responsive "You May Also Like" card grid navigation widget.

#### 3. Security & Performance
* File: `backend/src/main.ts` & `app.module.ts`
* Applied Helmet middleware and registered global `ThrottlerGuard` rate limiter.
* File: `frontend/src/App.tsx`
* Wrapped routing pages in lazy-suspense boundaries.

---

## Day 16 — Containerization & Multi-Service Orchestration

Containerized the entire monorepo environment for unified, reliable deployment using Docker and Docker Compose.

### Key Architecture Decisions
1. **Multi-Stage Frontend Build**:
   - Built frontend using a two-stage Dockerfile: the first stage builds the static assets using Node.js, and the second stage hosts them using a highly optimized Nginx server, serving content securely on port 80.
2. **Standardized Backend Docker Environment**:
   - Configured NestJS inside a Node-slim image with proper dependency installation and entrypoint orchestration.
3. **Volume Persistent SQLite Storage**:
   - Structured persistent directory volumes (`/app/data`) for the SQLite DB to prevent container updates or restarts from wiping the database state.

### Detailed Implementation Steps

#### 1. Frontend Dockerization (`frontend/Dockerfile` & `frontend/nginx.conf`)
* Configured `nginx.conf` routing all HTML5 request paths back to `index.html` (supporting React SPA client routing).
* Excluded local node modules and build assets via `.dockerignore`.

#### 2. Backend Dockerization (`backend/Dockerfile` & `backend/start.sh`)
* Created custom `start.sh` entrypoint executing Prisma migrations, building distribution bundles, and starting the NestJS application server.

#### 3. Orchestration (`docker-compose.yml`)
* Coordinated services (`backend` on `3000` and `frontend` on `5173`) with volume mappings for `/app/data` to persist databases.

---

## Day 17 — PDF Invoice Generation & Brand Refinement

Refactored the application's overall branding and implemented clean, client-side PDF invoice generation.

### Key Architecture Decisions
1. **Rebranding to Hamro Pasal**:
   - Updated the entire visual layout, logos, navigation, and PDF headers to showcase the new brand name **Hamro Pasal** (Nepali for "Our Shop").
2. **Client-Side PDF Compilation**:
   - Used `jsPDF` to compile order invoice details into PDF format directly in the user's browser, eliminating rendering overhead on the backend.

### Detailed Implementation Steps

#### 1. Brand Updates (`frontend/src/`)
* Modified application title, primary headers, checkout layout, and invoices to reflect **Hamro Pasal**.

#### 2. PDF Helper Utility (`frontend/src/utils/pdfGenerator.ts`)
* Created `generateInvoicePDF()` using `jsPDF` to draw purchase summaries, metadata, and invoice items in a table layout.

#### 3. UI Download Actions (`frontend/src/`)
* Embedded download options in Checkout Success cards, Order History dashboard items, and Admin order manager list details.

---

## Day 18 — Sandbox Payment Gateways Integration (eSewa & IME Pay)

Integrated multiple Sandbox payment gateways, specifically targeting localized Nepali gateways **eSewa** and **IME Pay**, alongside pre-existing Stripe capabilities.

### Key Architecture Decisions
1. **Expanded Database Schema**:
   - Extended the `Order` model with `paymentMethod` and `paymentId` fields to capture and track specific checkout payments.
2. **Sandbox Payment Controllers**:
   - Built eSewa and IME Pay verification endpoints on the NestJS backend, executing cryptographic signature validations to confirm transaction authenticity.
3. **Redirect Flow Coordination**:
   - Structured frontend redirect hooks to send users to sandbox checkouts and capture response parameters on return pages.

### Detailed Implementation Steps

#### 1. Prisma Migrations (`backend/prisma/`)
* Schema: `schema.prisma` - Added payment trackers. Executed migration `add_payment_fields`.

#### 2. Backend Gateways (`backend/src/payment/`)
* Implemented eSewa and IME Pay verification logic (cryptographic verification, checksum calculations, and payload processing).

#### 3. Frontend Payments Store (`frontend/src/store/orders.ts`)
* Configured checkout handlers to dispatch sandbox payloads and parse gateway returns for order state transition.

---

## Day 19 — Database Seeding, Volume Shadowing, and Production Tuning

Performed stability updates, resolving database volume shadowing conflicts in Docker, handling seeding runtime issues, and implementing fail-safe transaction logging.

### Key Architecture Decisions
1. **SQLite Path Realignment**:
   - Resolved SQLite volume shadowing by moving the database file to `/app/data/dev.db` on both host and containers, ensuring all database mutations persist during docker rebuilds.
2. **Prisma Seed Cleanups**:
   - Updated database seeding logic to delete dependent records in a sequence that prevents foreign key constraints from blocking migrations.
3. **Production Entrypoint Tuning**:
   - Enabled `FORCE_SEED` environment variables in `start.sh` to selectively allow seeding during staging deployments.

### Detailed Implementation Steps

#### 1. Configuration Realignment (`backend/start.sh`, `backend/Dockerfile`)
* Updated environment database URLs to point strictly to the persistent `/app/data/` volume.
* Ensured startup directory creation scripts operate before NestJS bootstrapping.

#### 2. Transaction Exception Safety (`backend/src/order/order.service.ts`)
* Wrapped transactional blocks inside try-catch logging segments to debug database queries in real time.

