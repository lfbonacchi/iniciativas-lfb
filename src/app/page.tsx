"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    // Login exitoso — ir al callback que auto-selecciona el usuario
    router.push("/auth/callback");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-pae-bg px-6 py-10">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl bg-pae-surface shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="h-1.5 w-full bg-pae-blue" />

          <div className="px-8 py-10">
            <div className="mx-auto mb-5 grid h-10 w-10 grid-cols-2 gap-[2px]">
              <span className="rounded-[1px] bg-[#F25022]" />
              <span className="rounded-[1px] bg-[#7FBA00]" />
              <span className="rounded-[1px] bg-[#00A4EF]" />
              <span className="rounded-[1px] bg-[#FFB900]" />
            </div>

            <h1 className="text-center text-[18px] font-semibold text-pae-text">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-center text-[14px] text-pae-text-secondary">
              Pan American Energy — Cuenta corporativa
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13px] font-medium text-pae-text-secondary"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@pae.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 block h-10 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[13px] font-medium text-pae-text-secondary"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 block h-10 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-pae-red/10 px-3 py-2 text-[13px] text-pae-red">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="block w-full rounded-lg bg-pae-blue py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-pae-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Ingresando…" : "Ingresar"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
        </div>
      </div>
    </main>
  );
}
