"use client";

import Image from "next/image";
import Link from "next/link";

import type { User } from "@/types";

interface HeaderProps {
  user: User | null;
  notificationCount?: number;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function avatarAccent(user: User): { bg: string; fg: string } {
  if (user.global_role === "area_transformacion" || user.is_vp) {
    return { bg: "bg-pae-red/10", fg: "text-pae-red" };
  }
  return { bg: "bg-pae-blue/10", fg: "text-pae-blue" };
}

export function Header({ user, notificationCount = 0 }: HeaderProps) {
  const accent = user ? avatarAccent(user) : null;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between border-b border-pae-border bg-pae-surface px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/logo-pae.svg"
          alt="Pan American Energy"
          width={88}
          height={35}
          priority
          className="h-8 w-auto"
        />
        <span className="hidden text-[10px] font-medium text-pae-text-secondary sm:inline">
          Gestión de Portfolio
        </span>
      </Link>

      <nav
        aria-label="Pipeline"
        className="hidden items-center gap-2 text-[12px] text-pae-text-tertiary md:flex"
      >
        <span>Propuesta</span>
        <span aria-hidden>›</span>
        <span>Dimensionamiento</span>
        <span aria-hidden>›</span>
        <span>MVP</span>
        <span aria-hidden>›</span>
        <span>Delivery</span>
      </nav>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative grid h-8 w-8 place-items-center rounded-full border border-pae-border text-pae-text-secondary transition hover:bg-pae-bg"
        >
          <span className="text-[14px]" aria-hidden>
            🔔
          </span>
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pae-red px-1 text-[9px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        {user && accent && (
          <div
            className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold ${accent.bg} ${accent.fg}`}
            title={user.display_name}
            aria-label={user.display_name}
          >
            {initials(user.display_name)}
          </div>
        )}
      </div>
    </header>
  );
}
