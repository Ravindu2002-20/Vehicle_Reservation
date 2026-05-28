# TODO: Fix Messages send/inbox issues

## Step 1
- Update `src/app/components/student/MessagesPage.tsx`:
  - Only fetch inbox when `userId` is present.
  - Send payload that matches `src/app/api/messages/send/route.ts` expectations.
  - Add basic error handling.

## Step 2
- Update `src/app/api/messages/send/route.ts`:
  - Accept UI payload fields (sender_user_id / receiver_admin_id).
  - Remove per-request `new PrismaClient()` and use `@/lib/prisma`.
  - Validate required fields and handle missing values gracefully.

## Step 3
- Run `npm run lint` and `npm run build`.

## Step 4
- Manually verify in browser: inbox loads + sending a message creates a new inbox item.

