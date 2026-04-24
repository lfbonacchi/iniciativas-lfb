"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
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

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={() =>
                  signIn("cognito", { callbackUrl: "/auth/callback" }, { prompt: "login" })
                }
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-pae-blue py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-pae-blue/90"
              >
                <div className="grid h-5 w-5 grid-cols-2 gap-[2px]">
                  <span className="rounded-[1px] bg-[#F25022]" />
                  <span className="rounded-[1px] bg-[#7FBA00]" />
                  <span className="rounded-[1px] bg-[#00A4EF]" />
                  <span className="rounded-[1px] bg-[#FFB900]" />
                </div>
                Ingresar con cuenta PAE
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/seleccionar-usuario"
            className="text-[13px] text-pae-text-tertiary transition hover:text-pae-text-secondary"
          >
            Acceso de prueba →
          </Link>
        </div>
      </div>
    </main>
  );
}
