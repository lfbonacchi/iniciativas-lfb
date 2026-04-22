"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { InitiativeStage, Notification, User } from "@/types";
import { listInitiatives } from "@/lib/storage/initiatives";
import { getNotifications } from "@/lib/storage/notifications";
import {
  listPendingActionsForUser,
  type PendingActionItem,
} from "@/lib/storage/gateways";

import { NotificationsPanel } from "./NotificationsPanel";
import { usePipeline } from "./PipelineContext";

interface HeaderProps {
  user: User | null;
  notificationCount?: number;
}

const PIPELINE_STAGES: {
  key: InitiativeStage;
  label: string;
}[] = [
  { key: "proposal", label: "Propuesta" },
  { key: "dimensioning", label: "Dimensionamiento" },
  { key: "mvp", label: "MVP" },
  { key: "ltp_tracking", label: "Delivery" },
];

const ZOOM_STORAGE_KEY = "mandarina-ui-zoom";
const LEGACY_ZOOM_STORAGE_KEY = "pae-ui-zoom";
const ZOOM_MIN = 0.85;
const ZOOM_MAX = 1.4;

function applyZoom(value: number) {
  if (typeof document === "undefined") return;
  document.body.style.setProperty("zoom", String(value));
}

function FontSizeSlider() {
  const [zoom, setZoom] = useState<number>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let raw: string | null = null;
    if (typeof window !== "undefined") {
      raw = window.localStorage.getItem(ZOOM_STORAGE_KEY);
      if (raw === null) {
        const legacy = window.localStorage.getItem(LEGACY_ZOOM_STORAGE_KEY);
        if (legacy !== null) {
          window.localStorage.setItem(ZOOM_STORAGE_KEY, legacy);
          window.localStorage.removeItem(LEGACY_ZOOM_STORAGE_KEY);
          raw = legacy;
        }
      }
    }
    const parsed = raw ? parseFloat(raw) : NaN;
    const initial =
      Number.isFinite(parsed) && parsed >= ZOOM_MIN && parsed <= ZOOM_MAX
        ? parsed
        : 1;
    setZoom(initial);
    applyZoom(initial);
    setMounted(true);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setZoom(v);
    applyZoom(v);
    window.localStorage.setItem(ZOOM_STORAGE_KEY, String(v));
  }

  if (!mounted) return null;

  return (
    <div
      className="hidden items-center gap-2 rounded-lg bg-pae-bg px-3 py-1.5 md:flex"
      title="Tamaño de letra"
    >
      <span className="text-[12px] font-semibold text-pae-text-secondary">
        A
      </span>
      <input
        type="range"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={0.05}
        value={zoom}
        onChange={handleChange}
        aria-label="Ajustar tamaño de letra"
        className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-pae-border accent-pae-blue"
      />
      <span className="text-[16px] font-semibold text-pae-text">A</span>
      <span className="ml-1 min-w-[36px] text-right text-[11px] font-medium tabular-nums text-pae-text-tertiary">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
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

export function Header({ user, notificationCount }: HeaderProps) {
  const accent = user ? avatarAccent(user) : null;
  const { activeStage } = usePipeline();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingActionItem[]>(
    [],
  );
  const [initiativeNames, setInitiativeNames] = useState<
    Record<string, string>
  >({});

  const refresh = useCallback(() => {
    if (!user) {
      setNotifs([]);
      setPendingActions([]);
      return;
    }
    const res = getNotifications(user.id);
    setNotifs(res.success ? res.data : []);
    const actions = listPendingActionsForUser(user.id);
    setPendingActions(actions.success ? actions.data : []);
    const inis = listInitiatives();
    if (inis.success) {
      const map: Record<string, string> = {};
      for (const i of inis.data) map[i.id] = i.name;
      setInitiativeNames(map);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Badge de la campana = acciones pendientes (alineado con sidebar).
  // Así no hay desfase entre "tenés N acciones" (sidebar) y el 🔔.
  const badgeCount = notificationCount ?? pendingActions.length;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-pae-border bg-pae-surface px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/logo-pae.svg"
          alt="Pan American Energy"
          width={88}
          height={35}
          priority
          className="h-8 w-auto"
        />
        <span className="hidden text-[14px] font-medium text-pae-text-secondary sm:inline">
          Gestión de Portfolio
        </span>
      </Link>

      <nav
        aria-label="Pipeline"
        className="hidden items-center gap-2 text-[16px] md:flex"
      >
        {PIPELINE_STAGES.map((s, idx) => {
          const isActive = activeStage === s.key;
          return (
            <span key={s.key} className="flex items-center gap-2">
              <span
                className={
                  isActive
                    ? "border-b-2 border-pae-blue pb-0.5 font-semibold text-pae-blue"
                    : "text-pae-text-tertiary"
                }
              >
                {s.label}
              </span>
              {idx < PIPELINE_STAGES.length - 1 && (
                <span aria-hidden className="text-pae-text-tertiary">
                  ›
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <FontSizeSlider />

        <div className="relative">
          <button
            type="button"
            aria-label="Notificaciones"
            aria-expanded={open}
            onClick={() => {
              if (!open) refresh();
              setOpen((v) => !v);
            }}
            className="relative grid h-8 w-8 place-items-center rounded-full border border-pae-border text-pae-text-secondary transition hover:bg-pae-bg"
          >
            <span className="text-[18px]" aria-hidden>
              🔔
            </span>
            {badgeCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pae-red px-1 text-[13px] font-semibold text-white">
                {badgeCount}
              </span>
            )}
          </button>
          {open && (
            <NotificationsPanel
              notifications={notifs}
              pendingActions={pendingActions}
              initiativeNames={initiativeNames}
              onClose={() => setOpen(false)}
              onChanged={refresh}
            />
          )}
        </div>

        {user && accent && (
          <div
            className={`grid h-8 w-8 place-items-center rounded-full text-[15px] font-semibold ${accent.bg} ${accent.fg}`}
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
