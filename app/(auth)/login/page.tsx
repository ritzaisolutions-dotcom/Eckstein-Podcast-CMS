"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

async function loginAction(password: string): Promise<{ error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (res.ok) return {};
  const data = await res.json().catch(() => ({})) as Record<string, string>;
  return { error: data.error ?? "Falsches Passwort." };
}

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await loginAction(password);
      if (result.error) {
        setError(result.error);
        setPassword("");
      } else {
        router.replace(from);
      }
    });
  }

  return (
    <div className="login-screen flex items-center justify-center min-h-dvh px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full border flex items-center justify-center overflow-hidden" style={{ borderColor: "rgba(201,168,76,0.3)" }}>
            {logoFailed ? (
              <span style={{ fontFamily: "var(--font-cinzel)", color: "var(--gold)", fontSize: "2rem", letterSpacing: "0.05em" }}>E</span>
            ) : (
              <Image
                src="/brand/logo-master-navy.png"
                alt="Eckstein Podcast"
                width={96}
                height={96}
                priority
                className="w-full h-full object-cover"
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>
          <div className="text-center">
            <h1
              className="text-2xl tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-cinzel)", color: "var(--gold)" }}
            >
              Eckstein
            </h1>
            <p
              className="text-xs tracking-[0.3em] uppercase mt-0.5"
              style={{ fontFamily: "var(--font-cinzel)", color: "rgba(201,168,76,0.55)" }}
            >
              Content Studio
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-cinzel)", color: "rgba(245,238,216,0.55)" }}
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded border text-cream placeholder:text-cream/20 focus:outline-none transition-colors"
              style={{
                background: "rgba(245,238,216,0.06)",
                borderColor: error ? "#e57373" : "rgba(201,168,76,0.3)",
                fontFamily: "var(--font-eb-garamond)",
                fontSize: "1rem",
                color: "var(--cream)",
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#e57373", fontFamily: "var(--font-eb-garamond)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !password}
            className="w-full py-3 rounded tracking-[0.2em] uppercase text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isPending ? "rgba(201,168,76,0.7)" : "var(--gold)",
              color: "var(--navy)",
              fontFamily: "var(--font-cinzel)",
              fontWeight: 600,
            }}
          >
            {isPending ? "..." : "Einloggen"}
          </button>
        </form>

        <p
          className="text-xs text-center"
          style={{ color: "rgba(245,238,216,0.2)", fontFamily: "var(--font-eb-garamond)" }}
        >
          Eckstein Podcast · Internes Studio
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
