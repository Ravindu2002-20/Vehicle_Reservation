# TODO: Add "Vice Chancellor" role and approval stage

## Steps

### Core service / RBAC / types
- [x] `src/lib/approvalService.ts` — add `pending_vice_chancellor` status, transition, inbox role, rejectable status, reject permission
- [x] `src/lib/rbac.ts` — add `pending_vice_chancellor` to APPROVE_PERMISSIONS & REJECT_PERMISSIONS
- [x] `src/lib/current-user.ts` — add `"vice-chancellor"` to `UnifiedRoleType` and `VALID_ROLES`

### Role routing
- [x] `src/app/components/RoleRouter.tsx` — add `"vice-chancellor"` to `UserRole` and `VALID_ROLES`
- [x] `src/app/dashboard/page.tsx` — add `"vice-chancellor"` to `UserRole` and `VALID_ROLES`
- [x] `src/app/components/UniversityDashboard.tsx` — add role, `isAdminRole`, Reports condition, import & default dashboard branch
- [x] New file `src/app/components/roles/ViceChancellorDashboard.tsx` (copy of UniversityDeputyDashboard)
- [x] `src/app/components/roles/OngoingRequestsView.tsx` — add `"vice-chancellor"` stage & inbox role

### API routes
- [x] `src/app/api/vehicle-requests/[id]/approve/route.ts` — university-deputy → `pending_vice_chancellor`; new vice-chancellor block
- [x] `src/app/api/vehicle-requests/[id]/reject/route.ts` — add vice-chancellor allowed role
- [x] `src/app/api/vehicle-requests/inbox/[role]/route.ts` — add vice-chancellor branch
- [x] `src/app/api/vehicle-requests/route.ts` — add `"vice-chancellor": "pending_vice_chancellor"` to `statusByRole`
- [x] `src/app/api/stats/route.ts` — add vice-chancellor pending case + add to both `in:` arrays

### UI labels / badges
- [x] `src/app/components/UniversitySidebar.tsx` — ROLE_LABELS
- [x] `src/app/components/UniversityHeader.tsx` — ROLE_LABELS
- [x] `src/app/components/roles/ReportsPage.tsx` — showPDFButton includes vice-chancellor
- [x] Badge maps in `user/AccountDetailsPage.tsx`, `roles/AdminAccountDetailsPage.tsx`, `roles/senior-officer/SeniorOfficerAccountDetailsPage.tsx`
- [x] `src/app/components/roles/DeanApprovedRequestsTable.tsx` — add `pending_vice_chancellor` to fetch URL status list

### Verification
- [ ] Type-check / build to confirm no errors
