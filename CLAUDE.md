# Flock and Fur

A two-sided marketplace connecting animal owners with professional animal mess cleanup services in Birmingham, Alabama.

## Business Model

- Clients post cleanup jobs (cages, pens, barns, etc.)
- Cleaners browse and request jobs
- Clients confirm cleaner selection
- Platform takes 20% of each completed job via Stripe Connect

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js (Auth.js) - email/password + Google/Facebook |
| Payments | Stripe Connect (destination charges) |
| File Storage | AWS S3 |
| Hosting | Vercel (or AWS Amplify) |

## User Roles

1. **Client** - Animal owners who need cleanup services
2. **Cleaner** - Service providers who perform cleanups
3. **Admin** - Business operators who oversee platform

## Core Workflows

### Job Flow
1. Client creates job request (animal type, location, size, availability)
2. Cleaners browse available jobs
3. Cleaner requests a job
4. Client confirms/selects cleaner
5. Cleaner performs job and uploads completion photos
6. Client confirms job completion
7. Payment processed (80% to cleaner, 20% platform fee)
8. Both parties rate each other

### Cleaner Onboarding
1. Sign up with email or social auth
2. Complete profile with animal handling background
3. Profile reviewed (future: admin approval workflow)
4. Can start browsing/requesting jobs

## Development Phases

### Phase 1 - Foundation (MVP) ✅ COMPLETE
- [x] Project setup (Next.js, TypeScript, Tailwind, Prisma)
- [x] Database schema design
- [x] Landing page with business info
- [x] Auth system (client, cleaner, admin roles)
- [x] Client dashboard: create job requests, view status
- [x] Cleaner dashboard: profile, browse jobs, request jobs
- [x] Client: confirm cleaner selection
- [x] Basic admin dashboard

### Phase 2 - Core Operations
- [ ] Stripe Connect integration
- [ ] Photo uploads for job completion (AWS S3)
- [ ] Rating system (bidirectional)
- [ ] Job status workflow UI
- [ ] Payment processing and payouts

### Phase 3 - Polish
- [ ] Email notifications
- [ ] Cleaner favorites / request previous cleaner
- [ ] Dispute handling in admin
- [ ] Analytics dashboard
- [ ] PWA capabilities

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Landing page, public pages
│   ├── (auth)/             # Login, register, etc.
│   ├── client/             # Client dashboard
│   ├── cleaner/            # Cleaner dashboard
│   ├── admin/              # Admin dashboard
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Feature components
├── lib/
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # NextAuth config
│   └── stripe.ts           # Stripe config
└── prisma/
    └── schema.prisma       # Database schema
```

## Environment Variables

```
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env` and fill in your values
   - Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
   - Set up a PostgreSQL database and add DATABASE_URL
   - (Optional) Add Google OAuth credentials

3. **Set up the database:**
   ```bash
   npm run db:push    # Push schema to database
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   - Landing page: http://localhost:3000
   - Register as client or cleaner to test

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
```

## Geographic Scope

Currently Birmingham, Alabama only. Architecture supports future expansion to other cities.
