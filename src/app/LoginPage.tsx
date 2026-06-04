"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
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


  const bgImages = ["/login.png", "/login_2.jpg", "/login_3.jpg"];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((current) => (current + 1) % bgImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [bgImages.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("LOGIN DATA", data);
      console.log("LOGIN ERROR", error);

      if (error) {
        setError(error.message);
        return;
      }

      // Wait until the session is available client-side (cookies updated by @supabase/ssr)
      await supabase.auth.getSession();

      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {bgImages.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === bgIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}

      <div className="absolute inset-0 bg-slate-950/25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_36%),linear-gradient(90deg,rgba(15,23,42,0.38),rgba(15,23,42,0.12),rgba(15,23,42,0.38))]" />

      {/* Background glow */}
      <div className="absolute w-72 h-72 bg-orange-400/20 blur-3xl rounded-full top-10 left-10" />
      <div className="absolute w-72 h-72 bg-blue-400/10 blur-3xl rounded-full bottom-10 right-10" />

      <Card className="relative z-10 w-full max-w-md border border-white/25 bg-black/25 shadow-2xl shadow-black/35 backdrop-blur-2xl backdrop-saturate-150">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-white/15 p-3 rounded-xl w-fit">
            <Car className="w-6 h-6 text-orange-300" />
          </div>

          <CardTitle className="mx-auto max-w-sm text-center text-2xl font-bold leading-tight text-white">
            Vehicle Reservation System
            <span className="block text-lg font-semibold text-white/85">
              Wayamba University Of Sri Lanka
            </span>
          </CardTitle>

          <CardDescription className="text-white/75">
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
              <Label htmlFor="email" className="text-white/85">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/25 bg-white/10 text-white placeholder:text-white/55 focus-visible:ring-orange-400"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/85">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/25 bg-white/10 text-white placeholder:text-white/55 focus-visible:ring-orange-400"
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
          <p className="text-xs text-center text-white/60 mt-6">
            Secure access for authorized users only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
