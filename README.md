# Online Bookstore Engine

## Overview

This project is an online bookstore built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4.0**, and **Supabase**. It implements a balanced **SSR (Server-Side Rendering)** and **CSR (Client-Side Rendering)** approach to maximize security, SEO, and interactive performance. The engine integrates authentication, real-time shopping cart management, wishlist tracking, dynamic search capabilities, and advanced filtering/sorting.

## Project Status

**Current Phase**: Core marketplace MVP - Production-ready with strong automated test coverage
**Test Coverage**: **96.45% average coverage** (95.52% statements, 99.56% branches, 97.39% functions)
**Performance**: Lighthouse Desktop 99/100 (0.3s FCP, 0.8s LCP, 0ms TBT, 0 CLS)
**Last Updated**: August 23, 2026 (latest automated coverage report)

## Key Highlights

- ✅ **Strong automated coverage**: Core storefront routes, components, data actions, and providers are well covered by Jest
- ✅ **9 Sort Options**: Including Best Sellers (implemented via sales_count), price, release date, ratings
- ✅ **Real-time Sync**: Shopping cart and wishlist sync across devices via Supabase listeners
- ✅ **Schema-First Validation**: All inputs validated with Zod from client to database
- ✅ **Advanced State Management**: Dual-Context + Reducer pattern preventing re-render loops

## Architecture & Engineering Decisions

### Dual Context + Reducer Pattern

The application uses a sophisticated state management architecture to prevent unnecessary re-renders:

```typescript
User/Cart Reducer (pure, centralized logic)
    ↓
UserStateContext / CartStateContext (data only)
UserActionsContext / CartActionsContext (dispatch functions)
    ↓
Components subscribe only to what they need
```

**Benefits:**
- Logout buttons don't re-render when cart data changes
- Atomic state updates prevent intermediate inconsistent states
- Server actions and real-time listeners both update through the same reducer
- No useState callback chains or prop drilling

### Seeded Initial State Pattern

RootLayout fetches user and cart data server-side, injecting pre-loaded providers:
- **Result**: Cumulative Layout Shift (CLS) = 0
- **Benefit**: Users see correct state immediately, no loading flicker
- **Implementation**: [components/layout/RootLayoutContent.tsx](components/layout/RootLayoutContent.tsx)

### Schema-First Validation

All user inputs flow through Zod schemas before reaching the database:

```typescript
const schema = z.object({
    email: z.string().email(),
    password: passwordRules, // min 8 chars, uppercase, lowercase, digit, special char
});
type FormData = z.infer<typeof schema>; // Auto-generated TypeScript type
```

**Result**: Type safety from form submission to database insert

## Testing & Quality Assurance

### Coverage Summary

| Area | Statements | Branches | Functions | Lines | Avg | Status |
|------|-----------|----------|-----------|-------|-----|--------|
| **Overall** | 95.52% | 99.56% | 97.39% | 95.52% | 97% | ✅ Excellent |
| App Routing | 100.00 | 100.00 | 100.00 | 100.00 | 100.00 | ✅ Complete |
| Components | 100.00 | 100.00 | 100.00 | 100.00 | 100.00 | ✅ Complete |
| Server Actions | 100.00 | 100.00 | 100.00 | 100.00 | 100.00 | ✅ Complete |
| Data Fetching | 100.00 | 100.00 | 100.00 | 100.00 | 100.00 | ✅ Complete |
| Providers | 100.00 | 100.00 | 100.00 | 100.00 | 100.00 | ✅ Complete |
| Schemas | 100.00 | 100.00 | 100.00 | 100.00 | 100.00 | ✅ Complete |
| Dev-Tools | 40.00 | 40.00 | 40.00 | 40.00 | 40.00 | ⚠️ Intentional (admin-only) |

### Running Tests

```bash
# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch

# Run specific test file
npm test -- SearchBar.tsx
```

## Performance Metrics (Lighthouse CLI)

Audited with professional-grade tooling to ensure speed and accessibility.

| Metric | Desktop | Mobile |
|--------|---------|--------|
| **FCP** (First Contentful Paint) | 0.3s | 1.1s |
| **LCP** (Largest Contentful Paint) | 0.8s | 2.0s |
| **TBT** (Total Blocking Time) | 0ms | 130ms |
| **CLS** (Cumulative Layout Shift) | 0 | 0 |
| **Speed Index** | 0.7s | 2.5s |
| **Performance Score** | 99/100 | 91/100 |
| **Accessibility** | 90/100 | 90/100 |
| **Best Practices** | 96/100 | 96/100 |
| **SEO** | 100/100 | 100/100 |

## Features

### Core Bookstore Functionality

- **Book Browsing & Pagination**: 12 books per page with comprehensive metadata (authors, genres, formats, publication dates)
- **Advanced Search**: Real-time search bar with 1000ms debounce, case-insensitive partial matching, 10-book limit dropdown
- **Sorting and Filtering**: 
  - Traditional sorting options (by name, price, best sellers, etc.)
  - Advanced filtering allowing to filter the content by book data (authors, genres, formats, price range, etc.)
- **Book Details Pages**: Comprehensive metadata display with dynamic SEO metadata
- **Reviews System**: 
  - Paginated user reviews with 5-star ratings
  - View Own reviews page with infinite scroll, delete and edit functionalities
- **Wishlist Management**: 
  - Add/remove books with 10-item limit
  - Persistent storage with cross-device sync
  - Real-time hover effects indicating status
  - Togglable wishlist mode Public/Private
  - Public wishlist accessible via username
  - Private wishlist accessible via token that can be refreshed to revoke access to the view
  - Restricted access to the mode that is not chosen
- **Shopping Cart**: 
  - Animated sidebar drawer with smooth transitions
  - Real-time quantity controls (1-99 items)
  - "Reactive Flip" synchronization: 100% reliable cart status via useActionState + isPending + server timestamps
  - Total calculation with tax support
- **User Profile**: Page with access to account settings and users content
- **Security Audit Logs**: Logging of aspects such as authentication, password changes, unauthorized data access, etc.
- **Real-time Feedback**: Notistack toast notifications for all interactions

### Authentication & User Management

- **Supabase Email/Password Auth**: Secure sign-up with strict password rules
  - Minimum 8 characters, maximum 50
  - Required: uppercase, lowercase, digit, special character (@$!%*?&)
- **Profile Management**: Multi-step forms with Zod validation for:
  - Username updates
  - Shipping address (street, postcode, city, country, phone)
  - Date of birth
  - Password changes with verification
- **First-Time Login Flow**: Users must complete address setup before accessing cart/wishlist
- **Real-Time Session Persistence**: Supabase auth listeners with cross-device sync (CLS = 0)
- **Row Level Security (RLS)**: Database-level access control per user

### Developer Tools & Administration

- **Dev-Tools Admin Console** (development-only, redirects to home in production)
  - **Live Telemetry Dashboard**: Real-time system performance metrics
  - **System Logs**: Comprehensive activity and error logging
  - **Database Seeding Controls**: One-click data population
    - Generate realistic book data (Faker.js, en_GB locale) with uniqueness constraints
    - Create test users and purchase orders with relational integrity
    - Seed reviews, discounts, and wishlist entries
  - **User Registry**: View and manage test user accounts

### Security & Data Protection

- **Cross-Device Synchronization**: Real-time listeners maintain auth state and cart sync
- **Server-Side Auth**: Credentials kept out of client JavaScript using @supabase/ssr
- **Schema-First Validation**: All user inputs validated at edge before mutations
- **Persistent Data**: Cart, wishlist, and profile survive session refreshes and browser closures

## Technology Stack

- **Frontend**: Next.js (App Router) & React
- **Styling**: Tailwind CSS & MUI (Material UI)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: Centralised React Context (User & Cart Providers)
- **Validation**: Zod (Schema-driven validation)
- **Testing**: Jest & React Testing Library
- **Utility**: Faker.js (used for localised en_GB data seeding via API endpoints)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account with a PostgreSQL database
- Environment variables configured (see `.env.example`)

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd store
npm install

# Set up environment variables
# Edit .env.local with your Supabase credentials and API keys

# Seed database (optional - use Dev-Tools console)
npm run dev
# Navigate to /dev-tools and use the Database Actions panel
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Run Jest tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- /app/HomePage.tsx

# Build for production
npm run build
npm start
```

### Accessing Dev-Tools

The admin console is available at `http://localhost:3000/dev-tools` during development. Use it to:

- Seed realistic test data
- Monitor system telemetry
- View application logs
- Manage test user accounts

## Database Architecture

The system follows a relational structure designed for e-commerce scalability.

[Database Schema](https://mermaid.ai/live/edit#pako:eNp9kl1vgjAUhv8KOddqRIdo7zYlk2yTBXQmCwlpaNVm0JIWdBv63wdMNt3QXvW0z_uejzaHUBAKCKicMLyWOPa5VqyFZ7mett-322KveVPn-dme3QfjW3fuaUgTO67-cbl25zgPgWu92NaypHaSpbSJW9re9NH25gWj8LYRcdxJGSEtiXBYE6X_pWSShpRtG8mz8gN7bj2VAsbDKCOUBIw3aE5KxKSkUvFN_ZnF1RSh4Clm9aiOLZ02eEoqplIViFVDMeesEhEJ8BXTie2NncWseqlM1SP5Pb0I4ySJWNUrtGAtGQGUyoy2IKYyxmUIeWnmQ7qhMfUBFVuC5ZsPPj8UmgTzVyHiWiZFtt4AWuFIFVGWEJzS4y_7QSgnVI5FxlNAullZAMrhHZDR7wx6NyNzoOs90zAGxeVHwei9TtcYDUemoReXfaN_aMFnlbTbGZrG4QvjP9sp)

```mermaid
erDiagram
    USERS ||--o| SHOPPING_CARTS : owns
    USERS ||--o{ BOOK_REVIEWS : writes
    USERS ||--o{ WISHLIST : saves
    USERS ||--o{ ORDERS : places
    BOOKS ||--o{ BOOK_REVIEWS : receives
    BOOKS ||--o{ SHOPPING_CART_ITEMS : included_in
    BOOKS ||--o{ WISHLIST : added_to
    SHOPPING_CARTS ||--o{ SHOPPING_CART_ITEMS : contains
    ORDERS ||--o{ ORDER_ITEMS : consists_of
    BOOKS ||--o{ ORDER_ITEMS : sold_as
    ORDERS ||--o{ ORDER_DISCOUNTS : uses
    DISCOUNTS ||--o{ ORDER_DISCOUNTS : applied_to
```

## Architecture & Key Patterns

### Dual Context + Reducer Pattern

The application uses a sophisticated state management architecture that prevents unnecessary re-renders and ensures unidirectional data flow:

```flowchart
User/Cart Reducer (pure, centralizes all domain logic)
    ↓
UserStateContext / CartStateContext (data only)
UserActionsContext / CartActionsContext (dispatch functions)
    ↓
Components subscribe to what they need
```

**Benefits:**

- Components consuming only actions don't re-render when data changes
- Atomic state updates prevent intermediate inconsistent states
- Server actions dispatch directly to reducers, no useState callbacks
- Real-time Supabase listeners inject updates through same reducer

### Server-First Data Fetching

- **RootLayout** fetches session and initial state on server
- Injects hydrated providers with seeded state (prevents CLS)
- Components receive pre-loaded data, no loading flicker
- React 19's `useActionState` handles mutations seamlessly

### Schema-Driven Type Safety

All user inputs flow through Zod schemas:

```typescript
// Single source of truth for both runtime validation and TypeScript types
const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    // ...
});

type FormData = z.infer<typeof schema>; // Auto-generated type
```

This ensures type safety from form submission to database insert.

### Directory Structure

```filesystem
app/                        → Next.js App Router server routes and layouts
  ├─ book/[slug]/           → Book details page (single book view)
  ├─ books/[...slug]/       → Books listing page (grouped by genre and format)
  ├─ dev-tools/             → Developer tools console (telemetry, logs, seeding, user registry)
  ├─ infos/                 → Legal and informational pages (TOS, Privacy, Shipping)
  ├─ user/                  → User-facing pages
    ├─ auth/                → Authentication routes
    │   ├─ change_password → Change account password page
    │   ├─ signin/         → User login page
    │   └─ signup/         → User registration page
    ├─ content/reviews/     → User reviews management (view, edit, delete own reviews)
    ├─ profile/             → User profile management (details, address, password)
    ├─ wishlist/            → User wishlist
      └─ shared/         → Shared wishlist pages
      ├─ [username]/ → Public wishlist accessible via username
      └─ token/[token]/ → Private wishlist accessible via shared token
components/                 → Reusable UI components
  ├─ books/                → Book-related components
  │   ├─ BooksManager/     → Book listing manager
  │   └─ bookCard/        → Book card components
  ├─ CartForms/            → Cart-related forms
  ├─ CartSidebar/         → Cart sidebar drawer
  ├─ FilteringSidebar/    → Advanced filtering sidebar
  ├─ formItems/           → Reusable form input components
  ├─ layout/              → Layout components (Header, Footer, RootLayout)
  └─ ui/                  → UI primitives (Breadcrumbs, Tooltip, Popover, ErrorState)
data/                      → Data layer (actions, services, repositories, constants, hooks)
  ├─ advancedFiltering/   → Advanced filtering logic
  ├─ auth/                → Authentication actions
  ├─ books/               → Book data layer
  │   └─ reviews/        → Book reviews logic
  ├─ cart/                → Shopping cart logic
  ├─ schemas/             → Zod validation schemas
  └─ user/                → User data layer
      ├─ onboarding/     → User onboarding logic
      └─ wishlist/       → Wishlist logic
        └─ sharing/     → Wishlist sharing logic
hooks/                     → Custom React hooks
  └─ SearchBar/          → Search-related hooks
providers/                 → React Context providers (global state)
  ├─ BookSortByProvider/ → Book sorting provider
  ├─ Providers/          → Root providers wrapper
  ├─ advancedFiltering/ → Advanced filtering provider
  ├─ cart/               → Cart state providers (Context, Provider, Reducer)
  └─ user/               → User state providers (Context, Provider, Reducer)
public/                    → Static assets (images, SVGs)
supabase/                  → Supabase configuration
utils/                    → Utility functions
  └─ db/                  → Database helpers
      ├─ admin/          → Admin database functions
      ├─ client/         → Client-side database functions
      └─ dbSeed/         → Database seeding utilities
__mocks__/                → Jest mocks (Next.js server mock)
__tests__/                → Jest test suite
  ├─ app/                → App pages tests mirroring app/ structure
  ├─ components/         → Component tests mirroring components/ structure
  ├─ data/               → Data tests
  ├─ hooks/              → Hook tests
  ├─ providers/          → Provider tests
  └─ utils/              → Utility tests
```

## Known Limitations

The following features are partially or not yet implemented:

| Feature                | Status             | Notes                                                |
| ---------------------- | ------------------ | ---------------------------------------------------- |
| Payment Processing     | ❌ Not Implemented | Checkout UI ready, Stripe API integration pending    |
| Admin Dashboard        | 🔶 Partial         | Dev-tools exist, full admin interface pending        |
| Order History          | ❌ Not Implemented | Database schema exists, UI pending                   |
| Discount Application   | 🔶 Partial         | Logic exists, frontend form pending                  |

## Future Roadmap

### 1. Core E-Commerce Completion

- [X] **User Review Submission**: Add UI and Server Actions to allow authenticated users to submit and rate books (currently read-only).
  - [X] **User Review Submission - UI**: Implement a modal or inline form for submitting reviews with star ratings and text.
  - [X] **User Review Submission - Server Actions**: Create server-side logic to validate
- [ ] **Stripe Payment Integration**: Implement a secure checkout flow using Stripe Elements and Server Actions.
- [ ] **Order Success Workflow**: Automate post-purchase triggers, including the generation of dynamic receipts and email confirmations.
- [ ] **Inventory Auto-Update**: Logic to decrement `stock_quantity` in the `books` table automatically upon successful purchase.
- [ ] **Order History Page**: Allow users to view their past orders with details, including items purchased, total spent, and order status.

### 2. Enhanced User Experience

- [X] **Optimistic UI Updates**: Leverage React 19's `useOptimistic` hook for "Add to Cart" and "Wishlist" actions to provide instantaneous visual feedback while background processes resolve.
- [X] **Advanced Multi-Select Filtering**: Support simultaneous filtering by multiple genres and price ranges with real-time result updates.
- [X] **Skeleton Loading States**: Implement shimmering MUI Skeleton components to replace basic loading spinners during SSR data fetching, improving perceived performance.
- [X] **Image Optimisation**: Implement Next.js Image component with WebP conversion and responsive srcset for book cover art.
- [X] **User Reviews - Advanced Features**: Expand the reviews system to include:
  - [X] **User Reviews - View own reviews**: Allow users to view and manage their submitted reviews, including editing and deleting options.
  - [X] **User Reviews - Delete**: Implement server actions and UI for users to delete their own reviews, with appropriate validation and confirmation prompts.
  - [X] **User Reviews - Edit**: Implement server actions and UI for users to edit their own reviews, ensuring validation and real-time updates.
- [X] **Wishlist Sharing**: Enable users to share their wishlist via a unique URL, allowing friends and family to view and purchase items directly from the wishlist.
  - [X] **Wishlist Sharing - Public**: Share wishlists globally via a recognizable, username-based URL (e.g., `user/wishlist/shared/[username]`).
  - [x] **Wishlist Sharing - Private**: Share exclusively using auto-generated, token-based URLs (e.g., `user/wishlist/shared/token/[token]`). Add backend repository and service functions to generate, retrieve, and manage tokens.
  - [X] **Wishlist Sharing - Visibility Controls**: Implement functionality that enables users to switch between the two modes.
  - [X] **Wishlist Sharing - Restricted View**: Implement a "Restricted Access" UI to gracefully handle invalid/revoked private links, or attempts to view a public wishlist that is turned off or doesn't exist.
- [ ] **User Profile - Public**: Add public profile page to allow users to view other users content.
- [ ] **Accessibility Enhancements**: Conduct a full WCAG 2.1 audit and implement ARIA roles, keyboard navigation, and screen reader support across the application.

### 3. Advanced Store Features

- [ ] **Discount & Promo Logic**: Implement server-side validation service to check the discounts table for expiry, usage limits, and user eligibility before applying final order totals.
- [ ] **Bestseller Gallery Section**: Homepage showcase driven by aggregate SQL queries of `order_items` and real-time sales rankings.
- [ ] **Related Books Discovery**: Product page section suggesting similar books using PostgreSQL similarity functions based on shared genres, authors, and user ratings.
- [ ] **Personalised Recommendations**: ML-driven product recommendations based on browsing history, wishlist patterns, and purchase behaviour.
- [ ] **Email Notifications**: Transactional emails for order confirmations, wishlist alerts, and promotional offers using SendGrid or similar service.

### 4. Admin & Operations

- [ ] **Inventory Management Dashboard**: Protected admin interface using Supabase Custom Claims to manage stock levels, pricing, and book metadata.
- [ ] **Review Moderation System**: Administrative queue to flag inappropriate reviews and monitor community sentiment with moderation workflows.
- [ ] **Security Audit Log Dashboard**: Secure administrative interface to monitor, filter, and analyze recorded security events, failed authentication attempts, and database errors.
- [ ] **Errors & Exception Logging**: Centralized logging system for all server-side errors, including stack traces and user context.
  - [ ] **Errors & Exception Logging - server errors**: Capture and log all server-side exceptions with stack traces and user context for debugging.
  - [ ] **Errors & Exception Logging - client errors**: Capture and log all client-side errors with stack traces and user context for debugging.
  - [ ] **Errors & Exception Logging - database errors**: Capture and log all database errors with query context and user information for debugging.
- [ ] **Role-Based Access Control (RBAC)**: Expand permission system to include "Moderator," "Editor," and "Finance" roles with granular feature access.
- [ ] **Sales Analytics Dashboard**: Real-time charts and metrics tracking revenue, top-selling books, user acquisition, and seasonal trends.
- [ ] **Bulk Operations**: Import/export functionality for managing book catalogs and customer data in CSV format.

### 5. Security & Compliance Enhancements

- [X] **Centralized Error Handler & Query Wrapper**: Implement a type-safe Supabase query wrapper alongside a centralized error handling system that sanitizes all database and authentication errors before client exposure to prevent information leakage.
- [ ] **Rate Limiting**: Implement distributed rate limiting on authentication endpoints to prevent brute force attacks and credential stuffing.
- [ ] **Security Audit Logging**: Add comprehensive logging for sensitive operations like password changes, failed authentication attempts, and administrative actions.
  - [X] **Security Audit Logging - sensitive operations** - Log all sensitive operations (password changes, logins, registrations, etc.) with timestamps and user IDs for accountability.
  - [ ] **Security Audit Logging - admin actions** - Log all administrative actions (book edits, user management, discount changes) with timestamps and user IDs for accountability.
  - [X] **Security Audit Logging - failed auth attempts** - Log all failed authentication attempts with timestamps and IP addresses for monitoring and alerting.
- [X] **Security Headers**: Implement security headers (CSP, HSTS, X-Frame-Options, etc.) via Next.js configuration and middleware for enhanced protection.
- [ ] **Advanced Input Validation**: Expand Zod schema validation with custom sanitization rules and continue the schema-first validation pattern for all user inputs.
