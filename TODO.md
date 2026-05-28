# TODO

## Requests production implementation
- [x] Add backend API: `src/app/api/requests/[id]/route.ts` with `GET` + `DELETE`

- [ ] Update frontend API layer: `src/lib/api.ts` with `getUserRequestById(id)` + `deleteUserRequest(id)` and robust error handling
- [x] Add history page UI for `/requests`: `src/app/requests/page.tsx` + `src/app/requests/requestsHistory.tsx`
- [x] Add detail page UI for `/requests/[id]`: `src/app/requests/[id]/page.tsx` + `src/app/requests/requestDetail.tsx`

- [ ] Ensure loading/error/empty states + confirm dialog + optimistic delete with rollback + hover/accordion animations
- [ ] Validate by running Next dev server and manually testing `/requests` and `/requests/[id]`

