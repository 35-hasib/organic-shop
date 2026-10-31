# Organic Shop

A full-stack organic grocery commerce platform for Bangladesh, with a customer storefront, admin dashboard, Expo mobile app, and a shared REST API.

## Applications

| App | Directory | Default URL / command |
| --- | --- | --- |
| API | `backend/` | `http://localhost:4100` |
| Customer storefront | `frontend/` | `http://localhost:5173` |
| Admin dashboard | `admin/` | `http://localhost:5174` |
| Mobile app | `mobile/` | `npm --prefix mobile start` |

## Features

- Bilingual English/Bangla catalogue, content, and mobile language switch.
- Category hierarchy, featured products, sale pricing, search, filters, and reviews.
- Server-side cart, stock validation, coupons, delivery charges, and free-delivery thresholds.
- Idempotent cash-on-delivery checkout with conditional stock reservation.
- Customer accounts, saved addresses, order history, notifications, cancellation, and return/refund requests.
- Admin order workflow, product and inventory management, customers, coupons, delivery areas, banners, reports, CSV exports, messages, and settings.
- Cloudinary-compatible signed upload endpoint, with direct image URL fallback.
- Responsive customer/admin interfaces and an Expo Router mobile app.

## Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL, Zod, JWT, bcrypt, decimal.js-light.
- Web: React, TypeScript, Vite, Tailwind CSS, React Router.
- Mobile: Expo SDK 58, React Native, Expo Router, TypeScript.
- Images: Cloudinary optional.

## Repository Layout

```text
backend/    Express API, Prisma schema, migrations, and seed data
frontend/   Customer storefront
admin/      Store administration dashboard
mobile/     Expo customer app
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 14 or newer
- Expo Go for mobile testing, or a local Android/iOS development environment

## Local Setup

### 1. Install dependencies

```bash
npm install
npm run install:all
```

### 2. Create the database

The default configuration expects a PostgreSQL role and database:

```text
Database: organic_shop
User:     salesmaintain
Password: salesmaintain
Host:     localhost:5432
```

Example PostgreSQL setup:

```bash
sudo -u postgres psql -c "CREATE USER salesmaintain WITH PASSWORD 'salesmaintain';"
sudo -u postgres psql -c "CREATE DATABASE organic_shop OWNER salesmaintain;"
```

Adjust these values if your local PostgreSQL instance uses different credentials.

### 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env`:

```env
DATABASE_URL="postgresql://salesmaintain:salesmaintain@localhost:5432/organic_shop?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=4100
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Use a strong random `JWT_SECRET` outside local development. Leave Cloudinary values empty to use image URLs only.

### 4. Apply migrations and seed

For a fresh database:

```bash
npm run setup:db
```

For development migration changes:

```bash
npm --prefix backend run migrate
npm --prefix backend run seed
```

Recreate demo data, including deleting existing demo records:

```bash
npm --prefix backend run seed -- --force
```

### 5. Start the web apps

```bash
npm run dev
```

This starts the API, customer storefront, and admin dashboard together.

### 6. Start the mobile app

```bash
npm run dev:mobile
```

For a physical device, create `mobile/.env` and point it to your computer's LAN address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:4100/api
```

The Android emulator defaults to `http://10.0.2.2:4100/api`; iOS and web default to `http://localhost:4100/api`.

## Demo Accounts

| Role | Email | Phone | Password |
| --- | --- | --- | --- |
| Admin | `admin@organic.test` | `01700000001` | `Admin123!` |
| Customer | `customer@organic.test` | `01700000002` | `Customer123!` |
| Customer | `nusrat@organic.test` | `01700000003` | `Customer123!` |

Seeded coupon: `ORGANIC10` gives 10% off orders over BDT 1000, capped at BDT 300.

## API Overview

All endpoints are under `/api`.

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me`
- Catalogue: `GET /products`, `GET /products/slug/:slug`, `GET /categories`, `GET /banners`
- Cart: `GET /cart`, `POST /cart`, `PUT /cart/:id`, `DELETE /cart/:id`
- Checkout: `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`, `POST /orders/:id/request`
- Customer: `GET/POST/PUT/DELETE /addresses`, `GET /wishlist`, `GET /notifications`
- Coupons: `POST /coupons/validate`, `GET /coupons/public`
- Delivery: `GET /delivery`
- Admin: `/admin/stats`, `/admin/customers`, `/admin/low-stock`, `/admin/inventory/:productId`, `/admin/reports`, `/admin/export/orders`, `/admin/export/sales`
- Admin orders: `GET /orders/admin`, `GET /orders/admin/:id`, `PATCH /orders/admin/:id/status`, `PATCH /orders/admin/:id/payment`
- Admin content: products, categories, coupons, delivery areas, banners, messages, settings, and notification broadcasts

The server validates all prices, discounts, stock, and order totals. Never trust totals sent by a client.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API, storefront, and admin |
| `npm run dev:mobile` | Start Expo |
| `npm run build` | Production builds for storefront and admin |
| `npm run verify` | Build web apps and typecheck mobile |
| `npm --prefix backend run migrate:deploy` | Apply committed migrations |
| `npm --prefix backend run seed` | Seed demo data |
| `npm --prefix backend run seed -- --force` | Reset and reseed demo data |
| `npm --prefix mobile run typecheck` | Typecheck the mobile app |
| `npm --prefix mobile run doctor` | Check Expo project health |

## Production Notes

- Replace all demo credentials and the JWT secret.
- Set `CORS_ORIGIN` to the deployed storefront and admin origins.
- Run `prisma migrate deploy`, not `migrate dev`, during deployment.
- Do not run the demo seed against production data.
- Configure Cloudinary for managed uploads, or continue using external image URLs.
- Terminate TLS at a reverse proxy and keep the API private to the application network where possible.
- Schedule PostgreSQL backups and monitor inventory/order failures.
- Checkout currently supports cash on delivery only.

## Verification Status

- Backend migrations and seed completed successfully.
- API smoke tests cover authentication, catalogue, coupons, idempotent checkout, stock decrement, order status transitions, and access control.
- Customer storefront production build passes.
- Admin dashboard production build passes.
- Mobile TypeScript check, Expo Doctor, and Android Metro export pass.
