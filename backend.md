# ✅ Vehicle Reservation System — Workflow Enforcement Specification

## System Objective

You are working on a Vehicle Reservation System backend built with:

* Next.js
* Prisma
* Supabase Auth

Your responsibility is to enforce a strict multi-stage approval workflow for vehicle requests while preserving the existing authentication, database schema, and API architecture unless explicitly instructed otherwise.

---

# 🔐 Core Principles (NON-NEGOTIABLE)

### Authentication

Do **NOT** modify or break:

* Supabase Auth
* Prisma ↔ Supabase user mapping
* Existing login/session flow
* Existing `getCurrentUser()` implementation

### Database

Do **NOT** redesign the database schema unless explicitly requested.

Existing tables and relationships should remain intact.

### Scope of Changes

Only modify logic related to:

* Vehicle request workflow
* Approval routing
* Request visibility
* Role-based approval actions

### Security

All role checks and workflow enforcement MUST occur server-side.

Use:

```ts
getCurrentUser()
```

inside API routes.

Never rely solely on frontend filtering.

---

# 🚗 Vehicle Request Approval Workflow

## Stage 1 — Request Creation

### Actor

* Student
* Lecturer

### Action

Create a vehicle request.

### Initial State

```text
approval_status   = pending_dean
allocation_status = pending
```

---

## Stage 2 — Dean Approval (Faculty Gatekeeper)

### Purpose

The Dean acts as the first approval authority.

Every request must be reviewed by the Dean of the requester's faculty before any higher-level administrator can access it.

### Visibility

Dean can only view:

```text
approval_status = pending_dean
```

### Restrictions

The following roles must NOT see these requests:

* Admin Deputy
* University Deputy Registrar
* Senior Officer

Until dean approval occurs.

### Faculty Constraint

The Dean reviewing the request must belong to the same faculty as the requester.

Example:

```text
Requester Faculty = Engineering

Only Engineering Dean can approve/reject.
```

### Approval Outcome

#### Approve

```text
approval_status = pending_admin_deputy
```

Store dean approval information.

#### Reject

```text
approval_status = rejected
```

---

## Stage 3 — Admin Deputy Approval

### Visibility

Admin Deputy can only view:

```text
approval_status = pending_admin_deputy
```

### Available Actions

* Approve
* Reject

### Routing Logic

Admin Deputy determines the next stage based on trip distance/type.

---

### Short Trip

If:

```text
distance_type = short
```

Then:

```text
approval_status = approved_for_allocation
```

Route directly to Senior Officer.

---

### Long Trip

If:

```text
distance_type = long
```

Then:

```text
approval_status = pending_university_deputy
```

Route to University Deputy Registrar.

---

### Rejection

```text
approval_status = rejected
```

---

## Stage 4 — University Deputy Registrar Approval

### Purpose

Required only for long-distance trips.

### Visibility

University Deputy can only view:

```text
approval_status = pending_university_deputy
```

### Available Actions

* Approve
* Reject

### Approval Outcome

#### Approve

```text
approval_status = approved_for_allocation
```

#### Reject

```text
approval_status = rejected
```

---

## Stage 5 — Senior Officer Allocation

### Visibility

Senior Officer can only view:

```text
approval_status = approved_for_allocation
```

### Responsibilities

Assign:

* Vehicle
* Driver

### Allocation Completion

```text
allocation_status = allocated
```

### Final State

```text
approval_status   = approved_for_allocation
allocation_status = allocated
```

---

# 👁️ Strict Visibility Rules

## Request Visibility Matrix

| Role              | Can View                  |
| ----------------- | ------------------------- |
| Dean              | pending_dean              |
| Admin Deputy      | pending_admin_deputy      |
| University Deputy | pending_university_deputy |
| Senior Officer    | approved_for_allocation   |

---

## Enforcement Rules

### Forbidden

No role may view requests from future stages.

```text
❌ Dean cannot view Admin Deputy requests
❌ Admin Deputy cannot view University Deputy requests
❌ University Deputy cannot view allocation queue
❌ Senior Officer cannot view Dean queue
```

### No Bypassing

The workflow must never allow:

```text
❌ User → Admin Deputy
❌ User → University Deputy
❌ Dean → Senior Officer
❌ Admin Deputy → Senior Officer (for long trips)
```

---

# 🧠 Business Logic Rules

## 1. Faculty Constraint

Dean approval requires faculty matching.

```text
Requester Faculty
        ==
Dean Faculty
```

Requests cannot be approved by a Dean from another faculty.

---

## 2. Approval Chain Integrity

Every request must follow the exact workflow below.

### Short Trip

```text
User
  ↓
Dean
  ↓
Admin Deputy
  ↓
Senior Officer
```

---

### Long Trip

```text
User
  ↓
Dean
  ↓
Admin Deputy
  ↓
University Deputy
  ↓
Senior Officer
```

No stage may be skipped.

---

## 3. Trip Type Routing

| Trip Type  | Workflow                                                 |
| ---------- | -------------------------------------------------------- |
| Short Trip | Dean → Admin Deputy → Senior Officer                     |
| Long Trip  | Dean → Admin Deputy → University Deputy → Senior Officer |

---

## 4. Data Integrity Rules

### Approval History

Never overwrite previous approvals.

Example:

```text
Dean Approval
Admin Deputy Approval
University Deputy Approval
```

must remain preserved.

### Audit Trail

Maintain historical approval records.

Do not remove:

* Previous approver IDs
* Approval timestamps
* Historical status transitions

### Rejections

Rejected requests must remain stored for auditing.

Never delete rejected requests automatically.

---

# 🔧 Backend Enforcement Requirements

The workflow state machine must be enforced inside API routes.

### Required Locations

```text
/api/vehicle-requests/*
```

and

```ts
getCurrentUser()
```

role validation logic.

### Backend Responsibilities

Validate:

* Current role
* Current approval state
* Faculty ownership
* Trip routing rules

before allowing any action.

### Important

Frontend filtering is optional.

Backend validation is mandatory.

---

# 📌 State Machine (Source of Truth)

```text
pending_dean
    ↓
pending_admin_deputy
    ↓
 ┌───────────────┐
 │ Short Trip    │
 └───────┬───────┘
         ↓
approved_for_allocation
         ↓
allocated


 ┌───────────────┐
 │ Long Trip     │
 └───────┬───────┘
         ↓
pending_university_deputy
         ↓
approved_for_allocation
         ↓
allocated
```

Rejected path:

```text
pending_dean
pending_admin_deputy
pending_university_deputy

        ↓

     rejected
```

---

# 🔒 Future Extension Rule

This workflow is the authoritative source of truth.

Any future role, approval level, or business process must:

```text
Extend the state machine
```

and must never:

```text
Replace the state machine
```

All future workflow enhancements must preserve:

* Approval chain integrity
* Visibility restrictions
* Audit history
* Server-side enforcement
* Faculty-based authorization

```
```
