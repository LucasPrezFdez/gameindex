"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserAuthClient } from "@/services/auth-browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

const MIN_PASSWORD_LENGTH = 6;

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode: AuthMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setError(null);
    firstFieldRef.current?.focus();
  }, [mode]);

  function switchMode(next: AuthMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "signup") params.set("mode", "signup");
    else params.delete("mode");
    setMessage(null);
    const query = params.toString();
    router.replace(query ? `/auth?${query}` : "/auth", { scroll: false });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const authClient = createBrowserAuthClient();

      if (mode === "signup") {
        const cleanUsername = getSafeUsername(username || email.split("@")[0]);
        const { data, error: signUpError } = await authClient.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: cleanUsername,
              display_name: cleanUsername
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user && data.session) {
          await fetch("/api/me/profile", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.session.access_token}`
            }
          }).catch(() => null);
          router.push(redirectTo === "/games" ? "/onboarding" : redirectTo);
          router.refresh();
          return;
        }

        setMessage("Cuenta creada. Ya puedes iniciar sesión.");
        switchMode("signin");
      } else {
        const { error: signInError } = await authClient.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInError) throw signInError;

        router.push(redirectTo);
        router.refresh();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No se pudo completar la autenticación.");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";
  const usernamePreview = isSignup && username ? getSafeUsername(username) : null;

  return (
    <div className="surface-card w-full rounded-3xl p-6 sm:p-8">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" role="tablist" aria-label="Tipo de acceso">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={cn(
              "h-9 rounded-lg text-sm font-semibold transition",
              mode === value ? "bg-white/[0.1] text-foreground shadow-sm" : "text-muted hover:text-foreground"
            )}
          >
            {value === "signin" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <h1 className="text-3xl font-black">{isSignup ? "Únete a GameIndex" : "Bienvenido de nuevo"}</h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup
          ? "Crea tu cuenta gratis para valorar juegos, escribir reseñas y montar tus listas."
          : "Inicia sesión para seguir con tu biblioteca, tus listas y tus reseñas."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
        {isSignup && (
          <Input
            ref={firstFieldRef}
            label="Nombre de usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="norapixel"
            autoComplete="username"
            minLength={3}
            maxLength={32}
            hint={
              usernamePreview
                ? `Tu perfil público: /users/${usernamePreview}`
                : "Opcional. Si lo dejas vacío usaremos la primera parte de tu email."
            }
          />
        )}

        <Input
          ref={isSignup ? undefined : firstFieldRef}
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          inputMode="email"
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="auth-password" className="block text-sm font-medium">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={MIN_PASSWORD_LENGTH}
              required
              className="pr-24"
              aria-describedby={isSignup ? "auth-password-hint" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-semibold text-muted transition hover:bg-white/10 hover:text-foreground"
              aria-pressed={showPassword}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {isSignup && (
            <p id="auth-password-hint" className={cn("text-xs", password && password.length < MIN_PASSWORD_LENGTH ? "text-amber-300" : "text-muted")}>
              Mínimo {MIN_PASSWORD_LENGTH} caracteres.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm text-lime">
            {message}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Procesando…" : isSignup ? "Crear cuenta" : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <button
          type="button"
          className="font-semibold text-blue-300 underline-offset-4 hover:underline"
          onClick={() => switchMode(isSignup ? "signin" : "signup")}
        >
          {isSignup ? "Entra" : "Regístrate gratis"}
        </button>
      </p>
    </div>
  );
}

/** Solo rutas internas: evita redirecciones abiertas tipo "//otro-dominio.com". */
function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/games";
  if (value.startsWith("/auth")) return "/games";
  return value;
}

function getSafeUsername(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);

  return normalized || "usuario";
}
