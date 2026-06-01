"use client";

import { useEffect, useMemo, useState } from "react";
import { User, Mail, Phone, Building2, IdCard, BookOpen, Pencil, Check, X, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { useSession } from "../../../lib/session";
import { getAuth } from "@/lib/api";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// ─── Auth modal ───────────────────────────────────────────────────────────────
function AuthDialog({
  onConfirm,
  onCancel,
  isSaving,
  error,
}: {
  onConfirm: (password: string) => void;
  onCancel: () => void;
  isSaving: boolean;
  error: string;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleConfirm = () => {
    if (!password.trim()) {
      setLocalError("Password is required to save changes.");
      return;
    }
    setLocalError("");
    onConfirm(password);
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Confirm Your Identity</h2>
          </div>
          <p className="text-orange-100 text-sm mt-1">
            Enter your password to save profile changes
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              className="pr-10"
              autoFocus
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {displayError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Confirm & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline-editable field ────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  icon,
  iconColor,
  fieldKey,
  onSaved,
  readOnly = false,
  userId,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  fieldKey?: string;
  onSaved?: (newValue: string) => void;
  readOnly?: boolean;
  userId?: number | null;
}) {


  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pendingSave, setPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState("");

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const requestSave = () => {
    if (draft.trim() === value) { cancel(); return; }
    setAuthError("");
    setPendingSave(true);
  };

  const confirmSave = async (password: string) => {
    // `userId` is passed from the parent page.
    if (userId == null) {
      setAuthError("Session expired. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setAuthError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          field: fieldKey,
          value: draft.trim(),
          password,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setAuthError(payload.error ?? "Failed to save changes.");
        setIsSaving(false);
        return;
      }

      setPendingSave(false);
      setEditing(false);
      onSaved?.(draft.trim());
      toast.success(`${label} updated successfully`);
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {pendingSave && (
        <AuthDialog
          onConfirm={confirmSave}
          onCancel={() => { setPendingSave(false); setAuthError(""); }}
          isSaving={isSaving}
          error={authError}
        />
      )}
      <div className="flex items-start gap-3 group">
        <span className={`${iconColor} mt-1 flex-shrink-0`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          {editing ? (
            <div className="flex items-center gap-2 mt-0.5">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") requestSave();
                  if (e.key === "Escape") cancel();
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <button onClick={requestSave} className="text-green-600 hover:text-green-700 flex-shrink-0" title="Save">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={cancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 break-all">{value || "Not provided"}</p>
              {!readOnly && (
                <button
                  onClick={startEdit}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-orange-600 flex-shrink-0"
                  title={`Edit ${label}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function AccountDetailsPage() {
  const { user } = useSession();

  const sessionUserId = user?.id;

  // Provide userId to EditableField (which PATCHes /api/profile).
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    telephone: "",
    registration_or_employee_no: "",
    department: {
      faculty: null as string | null,
      name: null as string | null,
    },
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        if (!sessionUserId) {
          setRedirected(true);
          window.location.href = "/login";
          return;
        }

        // GET /api/profile expects auth user id (server will read x-user-id header for now).
        const res = await fetch(`/api/profile`, {
          headers: {
            "x-user-id": String(sessionUserId),
          },
        });

        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error ?? "Failed to load profile");
        }

        if (cancelled) return;

        // API returns { data: { full_name, email, telephone, ... } }
        const data = payload.data ?? payload;

        setProfileData({
          name: data.full_name ?? data.name ?? "",
          email: data.email ?? "",
          telephone: data.telephone ?? "",
          registration_or_employee_no: data.registration_or_employee_no ?? "",
          department: {
            faculty: data.department?.faculty ?? null,
            name: data.department?.name ?? null,
          },
        });
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (!cancelled && !redirected) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionUserId, redirected]);

  const departmentInfo = useMemo(() => {
    // First try API returned department, then fall back to session data
    return {
      faculty: profileData.department.faculty ?? (user as any)?.department?.faculty ?? null,
      name: profileData.department.name ?? (user as any)?.department?.name ?? null,
    };
  }, [profileData, user]);

  // After a successful save, sync local state + update sessionStorage
  const handleSaved = (field: keyof typeof profileData) => (value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    try {
        const stored = getAuth();
      if (stored) {
        const fieldMap: Record<string, string> = { name: "full_name", email: "email", telephone: "telephone" };
        stored[fieldMap[field] ?? field] = value;
        // Keep payload shape consistent with UI (uses user.full_name in other places)
        if (field === "name") {
          stored.full_name = value;
        }
        sessionStorage.setItem("user", JSON.stringify(stored));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Account Details</h1>
        <p className="text-gray-600 mt-2">
          Loaded from the signed-in database account. Hover a field to edit it.
        </p>
      </div>

      {loading ? (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white pb-8">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-white/20 animate-pulse" />
              <div className="flex-1">
                <div className="h-6 w-2/3 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-white/20 rounded mt-3 animate-pulse" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : loadError ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="text-red-600 font-medium">{loadError}</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white pb-8">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-orange-500 text-white text-2xl font-bold">
                  {initials(profileData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl mb-2">{profileData.name}</CardTitle>
                <CardDescription className="text-orange-100 text-lg">
                  {profileData.registration_or_employee_no || user.registration_or_employee_no || user.user_type || ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department — read-only */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <BookOpen className="w-5 h-5" />
              Department Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <EditableField
              label="Faculty"
              value={departmentInfo.faculty ?? "Not assigned"}

              icon={<Building2 className="w-5 h-5" />}
              iconColor="text-orange-600"
              readOnly
            />
            <Separator />
            <EditableField
              label="Department"
              value={departmentInfo.name ?? "Not assigned"}

              icon={<BookOpen className="w-5 h-5" />}
              iconColor="text-orange-600"
              readOnly
            />
            <Separator />
            <EditableField
              label="Role"
              value={user.role ?? (user.user_type as any) ?? "student"}
              icon={<IdCard className="w-5 h-5" />}
              iconColor="text-orange-600"
              readOnly
            />
          </CardContent>
        </Card>

        {/* Contact — editable */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <User className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <EditableField
              label="Full Name"
              value={profileData.name}
              icon={<User className="w-5 h-5" />}
              iconColor="text-orange-600"
              fieldKey="name"
              onSaved={handleSaved("name")}
              userId={sessionUserId}
            />
            <Separator />
            <EditableField
              label="Email Address"
              value={profileData.email}
              icon={<Mail className="w-5 h-5" />}
              iconColor="text-orange-600"
              fieldKey="email"
              onSaved={handleSaved("email")}
              userId={sessionUserId}
            />
            <Separator />
            <EditableField
              label="Phone Number"
              value={profileData.telephone}
              icon={<Phone className="w-5 h-5" />}
              iconColor="text-orange-600"
              fieldKey="telephone"
              onSaved={handleSaved("telephone")}
              userId={sessionUserId}
            />
            <Separator />
            <EditableField
              label="Registration / Employee No"
              value={profileData.registration_or_employee_no || user.registration_or_employee_no || "Not applicable"}
              icon={<IdCard className="w-5 h-5" />}
              iconColor="text-orange-600"
              readOnly
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}