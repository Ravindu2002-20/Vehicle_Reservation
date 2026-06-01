# Vehicle Reservation System - TODO

## Profile / Account Details page fix
- [ ] Update `src/lib/api.ts:getUserProfile()` to send `x-user-id` header (remove query param).
- [ ] Update `src/app/api/profile/route.ts:GET` to fallback to admin lookup when user not found.
- [ ] Ensure admin and user return unified shape: `{ id, full_name, email, telephone, role: admin_role }`.
- [ ] Verify profile UI redirects to `/login` when `getAuth()` returns null (avoid silent failure).

## Testing
- [ ] Run Next.js dev build and verify `/api/profile` works for both user and admin.
- [ ] Manually test AccountDetailsPage load and editable PATCH flow.

