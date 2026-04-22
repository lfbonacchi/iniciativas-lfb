"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import type { User } from "@/types";
import { clearAllData } from "@/lib/storage/files";
import { useUploadDocument } from "./UploadDocumentContext";

interface SidebarProps {
  user: User | null;
  pendingActions?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const STATUS_CHIPS = [
  { key: "in_progress", label: "En progreso", tone: "green" },
  { key: "pending", label: "Pendiente", tone: "red" },
  { key: "paused", label: "Pausada", tone: "gray" },
  { key: "rejected", label: "Rechazada", tone: "gray" },
  { key: "area_change", label: "Cambio área", tone: "gray" },
] as const;

const STATUS_TONE: Record<
  (typeof STATUS_CHIPS)[number]["tone"],
  string
> = {
  green: "bg-pae-green/15 text-pae-green",
  red: "bg-pae-red/15 text-pae-red",
  gray: "bg-pae-text-tertiary/15 text-pae-text-secondary",
};

const SECTION_LABEL =
  "mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-pae-text";

function canCreateInitiative(user: User | null): boolean {
  if (!user) return false;
  return user.global_role === "area_transformacion" || !user.is_vp;
}

export function Sidebar({
  user,
  pendingActions = 0,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openUpload } = useUploadDocument();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const navItems = [
    { href: "/dashboard", label: "Dashboards" },
    { href: "/mis-iniciativas", label: "Mis iniciativas" },
    { href: "/gateways", label: "Gateways" },
    { href: "/control-de-cambios", label: "Control de cambios" },
  ];

  function handleConfirmClear() {
    setClearing(true);
    setClearError(null);
    const result = clearAllData();
    if (!result.success) {
      setClearError(result.error.message);
      setClearing(false);
      return;
    }
    setConfirmOpen(false);
    setClearing(false);
    router.push("/seleccionar-usuario");
    if (typeof window !== "undefined") {
      window.location.href = "/seleccionar-usuario";
    }
  }

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        className={`fixed left-0 top-14 z-50 h-[calc(100vh-56px)] w-[240px] flex-col border-r border-pae-border bg-pae-surface px-3 py-6 transition-transform duration-200 md:top-14 md:z-30 md:flex md:w-[220px] md:translate-x-0 ${
          mobileOpen ? "flex translate-x-0" : "flex -translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Cerrar menú"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-pae-text-secondary hover:bg-pae-bg md:hidden"
        >
          <span aria-hidden className="text-[18px]">✕</span>
        </button>
        <div className="mb-8">
          <p className={SECTION_LABEL}>Acciones</p>
          <div className="space-y-3">
            {canCreateInitiative(user) && (
              <Link
                href="/nueva-propuesta"
                onClick={handleNavClick}
                className="flex h-10 w-full items-center justify-center rounded-lg border border-pae-blue/30 bg-pae-blue/10 text-[14px] font-medium text-pae-blue transition hover:bg-pae-blue/20"
              >
                + Nueva propuesta
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                openUpload();
                handleNavClick();
              }}
              className="flex h-10 w-full items-center justify-center rounded-lg border border-pae-green/30 bg-pae-green/10 text-[14px] font-medium text-pae-green transition hover:bg-pae-green/20"
            >
              Subir documento
            </button>
            {/* Siempre visible para todos los usuarios. Si hay acciones,
                el badge rojo muestra el número; si no, solo el texto. */}
            <Link
              href="/aprobaciones"
              onClick={handleNavClick}
              className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-[14px] font-medium transition ${
                pendingActions > 0
                  ? "border-pae-red/30 bg-pae-red/10 text-pae-red hover:bg-pae-red/20"
                  : "border-pae-border bg-pae-bg text-pae-text-secondary hover:bg-pae-surface"
              }`}
            >
              <span>Acciones pendientes</span>
              {pendingActions > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pae-red px-1 text-[12px] font-semibold text-white">
                  {pendingActions}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <p className={SECTION_LABEL}>Navegación</p>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="relative">
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-pae-blue"
                      aria-hidden
                    />
                  )}
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`block rounded-md px-3 py-2.5 text-[15px] transition ${
                      active
                        ? "bg-pae-blue/[0.06] font-semibold text-pae-blue"
                        : "text-pae-text-secondary hover:bg-pae-bg hover:text-pae-text"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className={SECTION_LABEL}>Estado</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                title={`Filtrar por estado: ${chip.label}`}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 hover:scale-[1.04] hover:shadow-pill ${STATUS_TONE[chip.tone]}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-dashed border-pae-border pt-4">
          <p className="mb-3 text-[11px] leading-snug text-pae-text-tertiary">
            Los datos se guardan en localStorage de tu navegador.
          </p>
          <button
            type="button"
            onClick={() => {
              setClearError(null);
              setConfirmOpen(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-pae-red/40 px-3 py-2 text-[12px] font-semibold text-pae-red transition hover:bg-pae-red/10"
          >
            <span aria-hidden>🗑</span>
            <span>Borrar memoria MVP</span>
          </button>
        </div>
      </aside>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-memory-title"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-pae-surface p-6 shadow-xl">
            <h2
              id="clear-memory-title"
              className="text-[16px] font-semibold text-pae-text"
            >
              ¿Estás seguro?
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-pae-text-secondary">
              Esto borra todas las iniciativas, formularios, documentos y
              configuración del MVP. Esta acción no se puede deshacer.
            </p>
            {clearError && (
              <p className="mt-3 rounded-md bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
                {clearError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={clearing}
                className="rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[13px] font-medium text-pae-text-secondary transition hover:bg-pae-bg disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={clearing}
                className="rounded-lg bg-pae-red px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-pae-red/90 disabled:opacity-50"
              >
                {clearing ? "Borrando…" : "Borrar todo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
