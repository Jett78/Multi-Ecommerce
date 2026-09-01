# Next.js + NestJS Turborepo

A full-stack monorepo with Next.js 16 frontend, NestJS backend, Drizzle ORM, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Auth | Better Auth |
| State | TanStack React Query |
| Storage | AWS S3 |

## Project Structure

```
my-turborepo/
├── apps/
│   ├── web/                  # Next.js frontend (port 3000)
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── actions/          # Server actions
│   │   ├── types/            # TypeScript types
│   │   ├── config/           # API routes config
│   │   └── proxy.ts          # Request interceptor (auth + redirects)
│   │
│   ├── api/                  # NestJS backend (port 4000)
│   │   └── src/
│   │       ├── modules/      # Feature modules
│   │       ├── db/           # Schema + migrations
│   │       ├── common/       # Shared utilities
│   │       └── lib/          # Helper libraries
│   │
│   └── docs/                 # Documentation site (port 3001)
│
├── packages/
│   ├── ui/                   # Shared React components
│   ├── eslint-config/        # Shared ESLint config
│   └── typescript-config/    # Shared TS configs
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm 11+
- PostgreSQL database (Neon, Supabase, or local)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/my-turborepo.git
cd my-turborepo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

**Backend** (`apps/api/.env`):
```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/dbname?sslmode=require

# Server
PORT=4000

# Better Auth
BETTER_AUTH_URL=http://localhost:4000
BETTER_AUTH_SECRET=your-random-secret-key
FRONTEND_URL=http://localhost:3000

# Email (SMTP)
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your-email@domain.com
MAIL_PASSWORD=your-email-password
MAIL_FROM="Your App <no-reply@domain.com>"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket-name
AWS_CLOUDFRONT_URL=your-bucket-name.s3.region.amazonaws.com
```

**Frontend** (`apps/web/.env`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Set up database

```bash
cd apps/api

# Push schema to database (creates tables)
npm run db:push

# Seed default data (admin user, permissions, navigation)
npm run db:seed
```

Default admin login after seeding:
- **Email:** admin@gmail.com
- **Password:** Admin@123

### 5. Start development servers

```bash
# From root - runs both frontend and backend
npm run dev
```

Or run individually:
```bash
cd apps/web && npm run dev    # Frontend: http://localhost:3000
cd apps/api && npm run dev    # Backend:  http://localhost:4000
```

## Database Commands

```bash
cd apps/api

npm run db:generate    # Generate migration files from schema
npm run db:push        # Push schema changes to database
npm run db:seed        # Seed default data
npm run db:reset       # Truncate all tables (no seed)
npm run db:studio      # Open Drizzle Studio (database GUI)
```

### Reset and re-seed

```bash
npm run db:reset && npm run db:seed
```

## Backend Features

### API Modules

| Module | Description |
|--------|-------------|
| auth | Better Auth with email, Google, GitHub OAuth |
| blog | Blog CRUD with SEO |
| company-profile | Company information management |
| faq | FAQ management |
| inquiry | Contact form submissions |
| media | Media/file uploads |
| navigation | Navigation menu management |
| page-seo | Per-page SEO settings |
| redirect | URL redirects with status codes (301, 302, 307, 308, 410) |
| role-permissions | Role-based access control |
| seo | Global SEO settings |
| service | Service catalog |
| store | E-commerce store |
| team | Team member management |
| testimonial | Testimonial management |
| upload | S3 file uploads |

## Frontend Features

### Pages

- **Public**: Home, Services, Blog, Contact
- **Auth**: Login, Register, Forgot Password, Email Verify
- **Dashboard**: Admin panel with CMS
- **Profile**: User profile management
- **Payment**: Khalti payment integration

### Key Libraries

- `@tanstack/react-query` - Server state management
- `better-auth` - Authentication
- `framer-motion` - Animations
- `tiptap` - Rich text editor
- `shadcn/ui` - UI components
- `lucide-react` - Icons

## Ecommerce Features Status

| Category | Feature | Status |
|----------|---------|--------|
| **Product Management** | Product CRUD (Create, Read, Update, Delete) | ✅ |
| | Product Variants (SKU, Price, Stock) | ✅ |
| | Product Images (Multiple, Gallery) | ✅ |
| | Product Filtering & Search | ✅ |
| | Featured Products | ✅ |
| | Best Sellers | ✅ |
| | New Arrivals | ✅ |
| | Related Products ("You May Also Like") | ✅ |
| | Product Soft Delete / Archive | ✅ |
| | Product Tags | ✅ |
| **Categories & Brands** | Category CRUD | ✅ |
| | Subcategory CRUD | ✅ |
| | Brand CRUD | ✅ |
| | Category Images | ✅ |
| **Shopping Cart** | Client-side Cart (Zustand + localStorage) | ✅ |
| | Server-side Cart API | ✅ |
| | Cart Item Selection | ✅ |
| **Checkout** | Multi-step Checkout Flow | ✅ |
| | Contact Information Form | ✅ |
| | Saved Address Selection | ✅ |
| | Order Notes | ✅ |
| | Coupon Code Application | ✅ |
| | Delivery Charge Calculation | ✅ |
| **Payment** | Khalti Payment Gateway | ✅ |
| | Cash on Delivery (COD) | ✅ |
| | Payment Settings Dashboard | ✅ |
| | Stripe Integration | ❌ |
| | eSewa Integration | ❌ |
| **Orders** | Order Creation from Cart | ✅ |
| | Order Status Management (6 statuses) | ✅ |
| | Customer Order History | ✅ |
| | Admin Order Management | ✅ |
| | Order Statistics | ✅ |
| | Order Search & Filters | ✅ |
| | Bulk Order Actions | ❌ |
| | Order Invoices / Receipts | ❌ |
| | Return / Refund Management | ❌ |
| **Coupons & Discounts** | Coupon CRUD (Fixed, %, Free Shipping) | ✅ |
| | Coupon Validation | ✅ |
| | Min Order Amount Rule | ✅ |
| | Usage Limit & Per-User Limit | ✅ |
| | Product/Category Specific Coupons | ❌ |
| | Bulk Coupon Generation | ❌ |
| **Reviews & Ratings** | Product Reviews with Ratings | ✅ |
| | Rating Breakdown / Summary | ✅ |
| | Review Moderation (Admin) | ✅ |
| | Threaded Review Replies | ✅ |
| | Mark Review as Helpful | ✅ |
| | Verified Purchase Badge | ✅ |
| | Review Images | ✅ |
| **Inventory** | Stock Quantity Tracking | ✅ |
| | Stock Adjustment API | ✅ |
| | Inventory Transaction Log | ❌ |
| | Low Stock Threshold Alerts | ✅ |
| | Allow Backorder | ✅ |
| | Auto Stock Decrement on Order | ✅ |
| | Bulk Stock Import | ❌ |
| **Shipping & Delivery** | Saved Shipping Addresses | ✅ |
| | Province/District Address Model | ✅ |
| | Pathao Courier Integration | ✅ |
| | Delivery Charge by District/Weight | ✅ |
| | Courier District Mappings | ✅ |
| | Send to Courier (Single & Bulk) | ✅ |
| | Sync Courier Status | ✅ |
| | Customer-facing Order Tracking | ❌ |
| | Multiple Shipping Methods | ❌ |
| | Shipping Label Printing | ❌ |
| **User & Auth** | Email/Password Authentication | ✅ |
| | Google OAuth | ✅ |
| | OTP Email Verification | ✅ |
| | Forgot / Reset Password | ✅ |
| | Set Password (OAuth Users) | ✅ |
| | User Profile Management | ✅ |
| | Admin User CRUD | ✅ |
| | Phone/SMS Authentication | ❌ |
| | Facebook OAuth | ❌ |
| | Two-Factor Authentication (2FA) | ❌ |
| **Roles & Permissions** | Role-Based Access Control (RBAC) | ✅ |
| | Permission Matrix UI | ✅ |
| | Dynamic Permission Assignment | ✅ |
| | 4 Roles (Super Admin, Admin, Manager, Customer) | ✅ |
| **Content Management** | Blog CRUD with Rich Text Editor | ✅ |
| | Testimonials Management | ✅ |
| | Team Members Management | ✅ |
| | FAQ Management | ✅ |
| | Contact Form / Inquiries | ✅ |
| | Banner Management (Hero, Mid-page) | ✅ |
| | Company Profile / Branding | ✅ |
| | Navigation Menu Management | ✅ |
| | Newsletter Subscription | ❌ |
| **SEO** | Global SEO Settings | ✅ |
| | Per-Page SEO | ✅ |
| | Entity-Level SEO (Product/Blog) | ✅ |
| | URL Redirects (301, 302, 307, 308) | ✅ |
| | Canonical URLs | ✅ |
| | Meta Robots Tags | ✅ |
| | Open Graph / Social Meta | ✅ |
| | Auto Sitemap Generation | ❌ |
| **Analytics & Tracking** | Google Analytics | ✅ |
| | Google Tag Manager | ✅ |
| | Google Search Console | ✅ |
| | Microsoft Clarity | ✅ |
| | Dashboard Analytics Chart | ✅ |
| **File Upload / Media** | S3 File Upload | ✅ |
| | Multiple File Upload | ✅ |
| | Media Library Dashboard | ✅ |
| | Signed URLs for Private Files | ✅ |
| | Folders / Organization | ✅ |
| **Dashboard** | Admin Dashboard Overview | ✅ |
| | Stats Cards & Charts | ✅ |
| | Quick Actions | ✅ |
| | CSV Import | ✅ |
| | Data Tables with Pagination | ✅ |
| **Storefront** | Responsive Homepage | ✅ |
| | Product Listing Page | ✅ |
| | Product Detail Page | ✅ |
| | About Page | ✅ |
| | Contact Page | ✅ |
| | Blog Listing & Detail Pages | ✅ |
| | Hero Banner Slider | ✅ |
| | WhatsApp Float Button | ✅ |
| | Social Share Buttons | ✅ |
|
| **Not Yet Implemented** | Wishlist / Save for Later | ❌ |
| | Product Comparison | ❌ |
| | Recently Viewed Products | ❌ |
| | Product Bundles / Kits | ❌ |
| | Flash Sales / Limited Offers | ❌ |
| | Loyalty / Rewards Program | ❌ |
| | Abandoned Cart Recovery | ❌ |
| | Multi-Currency Support | ❌ |
| | Tax Calculation (VAT/GST) | ❌ |
| | Email Notifications (Order, Shipping) | ❌ |
| | Invoice / PDF Generation | ❌ |
| | Bulk Product Export | ❌ |
| | Product Recommendations Engine | ❌ |
| | Multi-Language Support | ❌ |
| | API Documentation (Swagger) | ❌ |
| | PWA Support | ❌ |
| | Mobile App (React Native) | ❌ |
| | Wholesale / B2B Pricing | ❌ |

### Summary

| Metric | Count |
|--------|-------|
| Features Completed | ~65 |
| Features Remaining | ~25+ |
| Completion | ~70% |

## Available Scripts

### Root

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development |
| `npm run build` | Build all apps |
| `npm run lint` | Lint all apps |
| `npm run check-types` | Type check all apps |
| `npm run format` | Format code with Prettier |

### Backend (`apps/api`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start NestJS server |
| `npm run dev:watch` | Start with file watching |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed default data |
| `npm run db:reset` | Truncate all tables |
| `npm run db:studio` | Open Drizzle Studio |

### Frontend (`apps/web`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

## License

MIT
