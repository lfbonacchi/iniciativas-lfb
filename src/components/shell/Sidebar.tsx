"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { User } from "@/types";

interface SidebarProps {
  user: User | null;
  pendingApprovals?: number;
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
  green: "bg-pae-green/10 text-pae-green",
  red: "bg-pae-red/10 text-pae-red",
  gray: "bg-pae-text-tertiary/10 text-pae-text-secondary",
};

const SECTION_LABEL =
  "mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-pae-text";

function canCreateInitiative(user: User | null): boolean {
  if (!user) return false;
  return user.global_role === "area_transformacion" || !user.is_vp;
}

export function Sidebar({ user, pendingApprovals = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboards" },
    { href: "/mis-iniciativas", label: "Mis iniciativas" },
    { href: "/gateways", label: "Gateways" },
  ];

  return (
    <aside className="fixed left-0 top-14 hidden h-[calc(100vh-56px)] w-[220px] border-r border-pae-border bg-pae-surface px-3 py-6 md:block">
      <div className="mb-8">
        <p className={SECTION_LABEL}>Acciones</p>
        <div className="space-y-3">
          {canCreateInitiative(user) && (
            <Link
              href="/nueva-propuesta"
              className="flex h-10 w-full items-center justify-center rounded-lg border border-pae-blue/30 bg-pae-blue/10 text-[14px] font-medium text-pae-blue transition hover:bg-pae-blue/20"
            >
              + Nueva propuesta
            </Link>
          )}
          <Link
            href="/subir-documento"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-pae-green/30 bg-pae-green/10 text-[14px] font-medium text-pae-green transition hover:bg-pae-green/20"
          >
            Subir documento
          </Link>
          {pendingApprovals > 0 && (
            <Link
              href="/aprobaciones"
              className="flex h-10 w-full items-center justify-between rounded-lg border border-pae-red/30 bg-pae-red/10 px-3 text-[14px] font-medium text-pae-red transition hover:bg-pae-red/20"
            >
              <span>Aprobaciones pendientes</span>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pae-red px-1 text-[12px] font-semibold text-white">
                {pendingApprovals}
              </span>
            </Link>
          )}
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
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${STATUS_TONE[chip.tone]}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
