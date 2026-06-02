async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getFetchError(res: Response, payload: any) {
  return payload?.error ?? `Request failed with status ${res.status}`;
}

// Legacy compatibility.
// Identity must come from Supabase session via `src/lib/session.ts`,
// not from any client-side storage.
export function getAuth() {
  return null;
}

export function fetchUser() {
  return null;
}

export async function getUserProfile() {
  try {
    const res = await fetch(`/api/profile`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

export async function getUserRequests() {
  try {
    const res = await fetch(`/api/vehicle-requests`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload;
  } catch {
    return { data: [] as any[] };
  }
}

export async function getUserRequestById(id: number) {
  try {
    const res = await fetch(`/api/requests/${id}`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload?.data ?? null;
  } catch (err) {
    throw err;
  }
}

export async function deleteUserRequest(id: number) {
  try {
    const res = await fetch(`/api/requests/${id}`, {
      method: "DELETE",
    });

    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload?.success === true;
  } catch (err) {
    throw err;
  }
}

export async function getMessages() {
  try {
    const res = await fetch(`/api/messages/inbox`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload;
  } catch {
    return [];
  }
}

