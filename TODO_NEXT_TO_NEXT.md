# TODO - Next.js backend + Prisma integration

## Step 1: Create Next.js app
- [ ] Create `next-app/` directory with Next.js App Router + TypeScript.
- [ ] Set dev server to port 3000.

## Step 2: Reuse Prisma
- [ ] Configure Prisma to use existing schema at `backend/prisma/schema.prisma`.
- [ ] Create `next-app/src/lib/prisma.ts` that imports/initializes PrismaClient using `backend/prisma.config.ts` logic.
- [ ] Ensure Next can load `DATABASE_URL` / `DIRECT_URL` from `next-app/.env.local`.

## Step 3: Implement core API routes
- [ ] `GET /api/vehicles`
- [ ] `GET /api/vehicle-requests`
- [ ] `POST /api/vehicle-requests`
- [ ] `PATCH /api/vehicle-requests/:id/approve`
- [ ] `PATCH /api/vehicle-requests/:id/allocate`

## Step 4: Wire frontend to API
- [ ] Locate current mock/fetch logic in `src/app/components/**`.
- [ ] Replace mock calls with calls to Next API (port 3000).

## Step 5: Prisma migrate + seed
- [ ] Run Prisma generate/migrate.
- [ ] Run existing `backend/prisma/seed.ts` with correct env.

## Step 6: Testing
- [ ] `next dev` smoke test for route responses.
- [ ] Verify frontend flows for vehicle requests end-to-end.

