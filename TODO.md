# TODO - Senior Officer Dashboard Refactoring & Feature Expansion

## Plan Summary
Implement a fully customized Senior Officer experience (sidebar, layout, pages, components) without affecting any other role/dashboards or approval workflow.

## 0) Backend Workflow Review (must stay compliant)
- [x] Read `backend.md` and capture the authoritative state machine + Senior Officer responsibilities.
- [x] Confirm Senior Officer MUST NOT approve/reject; only allocate vehicles/drivers and update `allocation_status=allocated`.

## 1) Create comprehensive Senior Officer implementation plan
- [x] Inventory existing Senior Officer dashboard: currently mocked (`src/app/components/roles/SeniorOfficerDashboard.tsx`).
- [x] Identify current role routing architecture: `UniversityDashboard` uses in-app state + `UniversitySidebar` menu.
- [x] Note that current sidebar menu supports only `StudentPage | AdminPage`; requires extending types for senior-officer-only pages.
- [x] Identify request detail APIs/types and current limitations (no request_letter_path in Prisma schema).
- [x] Identify existing vehicle/drivers management UI is mock-only (e.g., `FleetStatusView`).

## 2) Implement Senior Officer routing isolation
- [x] Extend `src/app/components/UniversityDashboard.tsx` to add a **SeniorOfficerPage** union and route-only rendering for `role==='senior-officer'`.
- [x] Update `src/app/components/UniversitySidebar.tsx` to render a **Senior Officer specific sidebar** (remove `Approvals`, add required menu items).


## 3) Add Senior Officer frontend pages/components
Create Senior Officer component set (all isolated under senior officer role components):
- [x] `src/app/components/roles/senior-officer/SeniorOfficerLayout.tsx` (shared layout styling)

- [x] `src/app/components/roles/senior-officer/SeniorOfficerDashboardPage.tsx`

- [x] 3 statistic cards: Total Drivers, Total Vehicles, New Requests (approval_status=approved_for_allocation & allocation_status=pending)
  - [x] Approved Requests Awaiting Allocation table (Request ID, Requester, Faculty, Destination, Trip Type, Travel Date, Status, Action=View Request)
  - [x] Ongoing Trips section at bottom (active allocations)

- [x] `src/app/components/roles/senior-officer/VehicleAllocationPage.tsx`

  - [x] Table of requests filtered by approval_status=approved_for_allocation & allocation_status=pending
  - [x] Click row -> request full details + PDF buttons + allocation form

- [x] `src/app/components/roles/senior-officer/RequestAllocationDetailPage.tsx` (details + allocation form)

  - [x] Vehicle selection dropdown: ONLY vehicles that are Available
  - [x] Driver selection dropdown(s) based on trip type:
    - [x] long: Primary + Secondary (different drivers)
    - [x] short: Single driver only

- [x] `src/app/components/roles/senior-officer/SchedulePage.tsx`
  - [x] Weekly calendar-style grid (Mon..Sun)
  - [x] Show allocations for current week only where allocation_status=allocated

- [x] `src/app/components/roles/senior-officer/VehicleStatusPage.tsx`
  - [x] Table columns required: Vehicle Number, Vehicle Type, Current Status, Current Driver, Availability
  - [x] Colored badges mapping: Available/Allocated/Under Repair/Inactive

- [x] `src/app/components/roles/senior-officer/DriversPage.tsx`
  - [x] Table columns required and Add Driver button + modal/form

- [x] `src/app/components/roles/senior-officer/VehiclesPage.tsx`
  - [x] Table columns required and Add Vehicle button + modal/form

- [x] `src/app/components/roles/senior-officer/MessagesPage.tsx` (if already exists for other roles, adapt without impacting them)


## 4) Backend API extensions (server-side enforcement)
All new/extended backend endpoints must validate:
- [x] `const currentUser = await getCurrentUser();`
- [x] Role check: senior-officer allowed only for allocation + viewing allowed resources.

### 4.1 Senior Officer dashboard data APIs
- [x]  Add endpoint(s) to compute Senior Officer stats and “new requests awaiting allocation”.

### 4.2 Vehicle Allocation APIs
- [x] Add endpoint to list pending allocations requests filtered by:
  - [x] approval_status=approved_for_allocation
- [x] allocation_status=pending
- [x] Add endpoint to fetch full request details for allocation view (including requester, faculty, trip type, and PDF path).
- [x] Add endpoint to allocate vehicle + driver(s) and update:
- [x] allocation_status -> allocated
- [x] Set vehicle_id and driver_id fields appropriately for the schema (long trip requires two drivers—see schema limitation)
- [x] Must not alter approval history or approval_status.

### 4.3 Availability filtering APIs
- [x] Endpoint(s) to fetch available vehicles (availability_status=Available and NOT allocated/under repair/inactive).
- [x] Endpoint(s) to fetch available drivers:
  - [x] short: drivers not on active trips and available
  - [x] long: same plus selection constraint (frontend validates distinct drivers; backend should still validate)

### 4.4 Schedule APIs
- [x] Endpoint to return weekly allocations grid from current week only where allocation_status=allocated.

## 5) Prisma schema + PDF path storage (backend-only extension)
**Requirement:** Do NOT store PDFs in Supabase; use local server storage path and store only the path in DB.
- [x] Extend Prisma schema to add `request_letter_path` to `VehicleRequest`.
- [x] Extend request creation endpoint (`src/app/api/vehicle-requests/route.ts`) to accept the PDF upload (or path) and save locally to `/uploads/request-letters/`.
- [ ] Add endpoints for Senior Officer PDF view/download:
  - [x] `GET /api/vehicle-requests/[id]/letter/view` (stream or redirect to a readable URL)
  - [x] `GET /api/vehicle-requests/[id]/letter/download` (Content-Disposition attachment)
  - [ ] Ensure 403 if not permitted (per backend.md).

> Note: If the current frontend form does not upload PDFs yet, add the minimal PDF upload UI ONLY for request creation flow (must not break existing roles).

## 6) Routing/page integration
- [x] Wire Senior Officer “View Request” action to open RequestAllocationDetailPage.
- [x] Wire sidebar navigation for senior-officer pages.

## 7) Testing & validation
- [ ] Verify other roles (student/lecturer/dean/depots/admin) function unchanged.
- [ ] Verify Senior Officer cannot hit approve/reject endpoints.
- [ ] Verify all senior-officer-visible data is filtered server-side by workflow rules.
- [ ] Run TypeScript build / lint and fix errors.

