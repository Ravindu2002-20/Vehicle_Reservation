"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/session";

type ProfileData = {
  id: number;
  full_name: string;
  email: string;
  telephone: string | null;
  role: string;
  admin_role?: string;
  department?: {
    name: string;
    faculty: string;
  };
  department_id?: number;
};

export function AdminAccountDetailsPage() {
  const { user, loading: sessionLoading } = useSession();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelephone, setEditTelephone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      setProfileLoading(false);
      setProfileError("Not authenticated");
      return;
    }

    async function fetchProfile() {
      try {
        setProfileLoading(true);
        const res = await fetch("/api/profile");
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          setProfileError(payload?.error ?? "Failed to load profile");
          return;
        }
        const data: ProfileData = payload?.data ?? null;
        setProfile(data);
        if (data) {
          setEditName(data.full_name ?? "");
          setEditEmail(data.email ?? "");
          setEditTelephone(data.telephone ?? "");
        }
      } catch {
        setProfileError("Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, [user, sessionLoading]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName,
          email: editEmail,
          telephone: editTelephone,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveError(payload?.error ?? "Failed to save changes");
        return;
      }
      setProfile((prev) =>
        prev ? { ...prev, full_name: editName, email: editEmail, telephone: editTelephone || null } : prev
      );
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditName(profile.full_name ?? "");
      setEditEmail(profile.email ?? "");
      setEditTelephone(profile.telephone ?? "");
    }
    setSaveError(null);
    setEditing(false);
  };

  if (sessionLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading account details…</p>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm">
          <p className="text-red-600 font-medium">{profileError ?? "Could not load profile"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-orange-600 underline hover:text-orange-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const roleBadge = (role: string) => {
    const map: Record<string, { label: string; color: string }> = {
      "admin-deputy":      { label: "Admin Deputy",      color: "bg-orange-100 text-orange-700" },
      "university-deputy": { label: "University Deputy", color: "bg-green-100 text-green-700"  },
      dean:                { label: "Dean",              color: "bg-indigo-100 text-indigo-700" },
      "senior-officer":    { label: "Senior Officer",    color: "bg-red-100 text-red-700"      },
    };
    const entry = map[role] ?? { label: role, color: "bg-gray-100 text-gray-600" };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.color}`}>
        {entry.label}
      </span>
    );
  };

  const Field = ({
    label,
    value,
    editable = false,
    editValue,
    onEdit,
    type = "text",
  }: {
    label: string;
    value: string | null | undefined;
    editable?: boolean;
    editValue?: string;
    onEdit?: (v: string) => void;
    type?: string;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
      {editing && editable && onEdit ? (
        <input
          type={type}
          value={editValue ?? ""}
          onChange={(e) => onEdit(e.target.value)}
          className="px-3 py-2 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-gray-800 bg-white transition"
        />
      ) : (
        <p className="text-sm text-gray-800 font-medium py-2">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </p>
      )}
    </div>
  );

  return (
    <div className="px-4 py-6 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white shadow-inner">
            {profile.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.full_name}</h1>
            <p className="text-orange-100 text-sm truncate">{profile.email}</p>
            <div className="mt-1.5">{roleBadge(profile.role)}</div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 bg-white/20 hover:bg-white/30 transition rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">
          ✓ Profile updated successfully
        </div>
      )}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          {saveError}
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Admin Information</h2>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Full Name"  value={profile.full_name}  editable editValue={editName}      onEdit={setEditName} />
          <Field label="Email"      value={profile.email}      editable editValue={editEmail}     onEdit={setEditEmail}     type="email" />
          <Field label="Telephone"  value={profile.telephone}  editable editValue={editTelephone} onEdit={setEditTelephone} type="tel" />
          {profile.admin_role && (
            <Field label="Admin Role" value={profile.admin_role} />
          )}
        </div>

        {profile.department && (
          <>
            <div className="px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Department</h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Department" value={profile.department.name} />
              <Field label="Faculty"    value={profile.department.faculty} />
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancelEdit}
            disabled={saving}
            className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}