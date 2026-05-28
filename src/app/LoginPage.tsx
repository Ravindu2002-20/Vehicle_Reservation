"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Car, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 200) {
        sessionStorage.setItem("user", JSON.stringify(data.data.user));
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-100 px-4">
      {/* Background glow */}
      <div className="absolute w-72 h-72 bg-orange-400/20 blur-3xl rounded-full top-10 left-10" />
      <div className="absolute w-72 h-72 bg-blue-400/10 blur-3xl rounded-full bottom-10 right-10" />

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-orange-100 p-3 rounded-xl w-fit">
            <Car className="w-6 h-6 text-orange-600" />
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900">
            Vehicle Reservation
          </CardTitle>

          <CardDescription className="text-gray-500">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-200">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-visible:ring-orange-500"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-visible:ring-orange-500"
                required
              />
            </div>

            {/* Button */}
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 transition-all duration-300 shadow-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer hint */}
          <p className="text-xs text-center text-gray-400 mt-6">
            Secure access for authorized users only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}