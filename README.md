
  # Energy Management System Dashboard (Community)

  This is a code bundle for Energy Management System Dashboard (Community). The original project is available at https://www.figma.com/design/prWS03Me5yvTGi4KxNl1ZN/Energy-Management-System-Dashboard--Community-.

  ## Running the code

This repo includes a `pnpm-lock.yaml` and is built for a pnpm-based workflow. If you do not already have pnpm installed, install it globally first:

```bash
npm install -g pnpm
```

Then install dependencies:

```bash
pnpm install
```

If you prefer to bootstrap dependencies from npm, use:

```bash
npm run setup
```

Start the development server:

```bash
pnpm dev
```

or:

```bash
npm run dev
```

### Sync existing Prisma users with Supabase Auth

If you already have users or admins in Prisma and need to link them to Supabase Auth, run:

```bash
npm run sync:supabase-auth
```

This will populate `supabase_id` for existing Prisma records whose email matches a Supabase Auth user.
  