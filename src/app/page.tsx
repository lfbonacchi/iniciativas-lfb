"use client";

import Link from "next/link";
import { useState } from "react";

export default function MockSsoPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            <p className="mt-1 text-center text-[12px] text-pae-text-secondary">
              Pan American Energy — Cuenta corporativa
            </p>

            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-medium text-pae-text-secondary"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="off"
                  placeholder="nombre@pae.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block h-10 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-medium text-pae-text-secondary"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="off"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block h-10 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled
                className="block w-full cursor-not-allowed rounded-lg bg-pae-blue/70 py-3 text-[13px] font-semibold text-white"
              >
                Ingresar con cuenta Microsoft
              </button>

              <p className="text-center text-[11px] font-medium text-pae-blue">
                ¿Olvidaste tu contraseña?
              </p>
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-xl border-2 border-dashed border-pae-border bg-pae-surface/60 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
            Post-MVP
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-pae-text-secondary">
            Este login se conecta automáticamente con Microsoft Entra ID. El
            rol del usuario se asigna según su perfil corporativo de PAE.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/seleccionar-usuario"
            className="inline-flex items-center gap-2 rounded-lg bg-pae-blue px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-pae-blue/90"
          >
            Ir a MVP
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
