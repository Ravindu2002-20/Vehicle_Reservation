export function getAuth() {
  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    // ignore
  }
  if (!user) return null;
  return user;
}

export function fetchUser() {
  return getAuth();
}

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

export async function getUserProfile() {
  const user = getAuth();
  if (!user) return null;

  try {
    const res = await fetch(`/api/profile?user_id=${user.id}`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

export async function getUserRequests() {
  const user = getAuth();
  if (!user) return { data: [] as any[] };

  try {
    const res = await fetch(`/api/vehicle-requests?user_id=${user.id}`);
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
  const user = getAuth();
  if (!user) return [];

  try {
    const res = await fetch(`/api/messages/inbox?user_id=${user.id}`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload;
  } catch {
    return [];
  }
}

