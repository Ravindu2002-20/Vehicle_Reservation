# Vehicle Reservation System — Workflow Enforcement Specification (Final Version)

> Backend status notes
>
> **working** = endpoint logic exists and enforces the intended rule.
>
> **not working** = rule is specified here, but current code does not enforce it (or enforces a different rule / uses different statuses/fields).


## System Objective

This document defines the authoritative workflow, approval routing, security rules, request visibility, PDF handling, and audit requirements for the Vehicle Reservation System.

Technology Stack:

* Next.js
* Prisma
* Supabase Auth

The workflow must be enforced server-side while preserving:

* Existing Supabase Authentication
* Existing Prisma relationships
* Existing API architecture
* Existing `getCurrentUser()` implementation

---

# Core Principles

## Authentication

The following components must NOT be modified:

* Supabase Auth
* Session management
* Login flow
* Prisma ↔ Supabase user mapping
* `getCurrentUser()`

---

## Database

Do not redesign the database schema unless explicitly requested.

Existing relationships must remain intact.

---

## Security

All workflow validation must occur server-side.

Every API endpoint must validate:

```ts
const currentUser = await getCurrentUser();
```

Frontend filtering is optional.

Backend enforcement is mandatory.

---

# Request Creation

## Actors

* Student
* Lecturer

---

## Request Form Fields

### Basic Information

```text
Purpose
Destination
Travel Date
Return Date
Passengers
Trip Type
```

---

### Deputy Registrar Selection

The requester must select the Deputy Registrar that should receive the request after Dean approval.

Options:

```text
Final Destination

○ General Admin Deputy Registrar
○ University Deputy Registrar
```

Stored as:

```text
target_deputy_role
```

Allowed values:

```text
admin_deputy
university_deputy
```

---

### Request Letter Upload

The requester must upload a request letter PDF.

Field:

```text
Request Letter PDF
```

Accepted MIME Type:

```text
application/pdf
```

Recommended Maximum Size:

```text
10 MB
```

---

# PDF Storage

## Storage Requirement

PDF files must NOT be stored in Supabase Storage.

PDF files must be stored locally on the application server.

Example:

```text
/uploads/request-letters/
```

Example structure:

```text
uploads/
└── request-letters/
    ├── request_001.pdf
    ├── request_002.pdf
    └── request_003.pdf
```

---

## Database Storage

Only the file path should be stored.

Example field:

```text
request_letter_path
```

Example value:

```text
/uploads/request-letters/request_001.pdf
```

---

# Initial Request Status

When a request is created:

```text
approval_status   = pending_dean
allocation_status = pending
```

Every request starts with Dean approval.

No request may bypass the Dean.

---

# Dean Approval Stage

## Visibility

Dean can only view:

```text
approval_status = pending_dean
```

**Backend enforcement**: **not working**

- **not working (current code mismatch)**: Backend routes use `approval_status` values like `pending`, `approved_by_dean`, `approved`, and `returned_to_dean` rather than the spec’s `pending_dean`, `pending_admin_deputy`, `pending_university_deputy`, etc.
- **not working (current code mismatch)**: Dean/faculty restriction is not enforced in the approval endpoints (no faculty ownership check).

---

## Faculty Restriction

**Backend enforcement**: **not working** (no faculty ownership restriction check exists in the current Dean/Admin approval/reject routes; approvals are role-based/admin-based but not faculty-matched)

Dean approval is only allowed when:

```text
Requester Faculty
        ==
Dean Faculty
```

Example:

```text
Engineering Student
        ↓
Engineering Dean
```

A Dean from another faculty must not be able to approve or reject the request.

---

## Available Actions

### Approve

When approved:

If:

```text
target_deputy_role = admin_deputy
```

Then:

```text
approval_status = pending_admin_deputy
```

---

If:

```text
target_deputy_role = university_deputy
```

Then:

```text
approval_status = pending_university_deputy
```

---

### Reject

Clicking Reject must open a popup dialog.

Required field:

```text
Rejection Reason
```

Buttons:

```text
Send
Cancel
```

Upon submission:

```text
approval_status = rejected
```

Store:

```text
rejected_by
rejected_at
rejection_reason
```

---

# General Admin Deputy Registrar Stage

## Visibility

Admin Deputy can only view:

```text
approval_status = pending_admin_deputy
```

---

## Available Actions

### Approve

When approved:

```text
approval_status = approved_for_allocation
```

---

### Reject

Display rejection dialog.

Required field:

```text
Rejection Reason
```

Store:

```text
rejected_by
rejected_at
rejection_reason
```

Update:

```text
approval_status = rejected
```

---

# University Deputy Registrar Stage

## Visibility

University Deputy Registrar can only view:

```text
approval_status = pending_university_deputy
```

---

## Available Actions

### Approve

When approved:

```text
approval_status = approved_for_allocation
```

---

### Reject

Display rejection dialog.

Required field:

```text
Rejection Reason
```

Store:

```text
rejected_by
rejected_at
rejection_reason
```

Update:

```text
approval_status = rejected
```

---

# Senior Officer Allocation Stage

## Visibility

Senior Officer can only view:

```text
approval_status = approved_for_allocation
```

---

## Responsibilities

Assign:

```text
Vehicle
Driver
```

---

## Allocation Completion

After assignment:

```text
allocation_status = allocated
```

Final state:

```text
approval_status   = approved_for_allocation
allocation_status = allocated
```

---

# Rejected Request Rules

## Rejected Requests

Rejected requests must remain permanently stored.

Never automatically delete rejected requests.

---

## Editing Rejected Requests

Not allowed.

```text
User cannot edit rejected requests.
```

---

## Resubmitting Rejected Requests

Not allowed.

```text
User cannot resubmit rejected requests.
```

---

## Creating New Request

If a request is rejected:

```text
Requester must create a completely new request.
```

The new request receives:

```text
New Request ID
New Approval Chain
New Audit History
```

---

# Request Visibility Matrix

| Role                           | Visible Status            |
| ------------------------------ | ------------------------- |
| Dean                           | pending_dean              |
| General Admin Deputy Registrar | pending_admin_deputy      |
| University Deputy Registrar    | pending_university_deputy |
| Senior Officer                 | approved_for_allocation   |

---

# PDF Access Rules

## Request Owner

Can:

```text
View PDF
Download PDF
```

---

## Dean

Can:

```text
View PDF
Download PDF
```

---

## General Admin Deputy Registrar

Can:

```text
View PDF
Download PDF
```

---

## University Deputy Registrar

Can:

```text
View PDF
Download PDF
```

---

## Senior Officer

Can:

```text
View PDF
Download PDF
```

---

## Unauthorized Access

Must return:

```text
403 Forbidden
```

---

# Approval History Requirements

Approval history must never be overwritten.

Store all actions:

```text
Approver ID
Approver Role
Decision
Timestamp
Remarks
```

---

# Audit Trail Requirements

Maintain historical records of:

```text
Approvals
Rejections
Allocations
Status Changes
```

Historical records must never be removed automatically.

---

# Backend Enforcement Requirements

Workflow enforcement must be implemented inside:

```text
/api/vehicle-requests/*
```

---

## Required Validation

Before any action:

```ts
const currentUser = await getCurrentUser();
```

must validate:

```text
User Identity
User Role
Current Status
Faculty Ownership
Approval Permissions
Allocation Permissions
PDF Permissions
```

---

# Forbidden Actions

The backend must prevent:

```text
Dean approving requests outside their faculty

Admin Deputy approving Dean queue

University Deputy approving Dean queue

Senior Officer approving requests

Requester approving requests

Unauthorized PDF access

Unauthorized PDF downloads
```

---

# Workflow State Machine

## Main Workflow

```text
Requester
     ↓
pending_dean
     ↓

 ┌──────────────────────────┐
 │ Dean Approval            │
 └────────────┬─────────────┘
              │
              │
      Selected Destination
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼

pending_admin_deputy   pending_university_deputy
     │                 │
     │                 │
     ▼                 ▼

approved_for_allocation
            │
            ▼

Senior Officer Allocation
            │
            ▼

allocated
```

---

# Rejection Flow

```text
pending_dean
pending_admin_deputy
pending_university_deputy

        ↓

     rejected
```

---

# Final Status Values

```text
pending_dean

pending_admin_deputy

pending_university_deputy

approved_for_allocation

allocated

rejected
```

---

# Source of Truth

This specification is the authoritative source of truth for the Vehicle Reservation System workflow.

Future enhancements must preserve:

* Server-side enforcement
* Approval history
* Audit history
* Faculty authorization
* Role-based visibility
* PDF access controls
* Approval chain integrity

All future workflow enhancements must extend this state machine and must never replace it.

---

## Backend implementation notes (why some endpoints/rules may appear “not working”)

Some sections of this specification are marked **not working** because the current backend routes under `/src/app/api/vehicle-requests/**` do not implement the exact same workflow/state values and/or authorization checks described in this document.

Additionally, during documentation verification, some expected paths (ex: `src/app/api/vehicle-requests/letter/*`) could not be located in the current codebase (filesystem/tool listing returned no matching files). This means the PDF view/download rules in this spec cannot be confirmed against real endpoints at the time of this edit.

