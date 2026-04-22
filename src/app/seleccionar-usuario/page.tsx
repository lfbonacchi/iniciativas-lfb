"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Id, User } from "@/types";
import {
  getAvailableUsers,
  loadSeedData,
  switchUser,
} from "@/lib/storage/auth";
import { clearAllData } from "@/lib/storage/files";

type RoleKey = "po" | "sm" | "bo" | "vp" | "at";

interface RoleDefinition {
  key: RoleKey;
  title: string;
  subtitle: string;
  description: string;
  footnote?: string;
  userIds: readonly Id[];
  accent: "blue" | "green" | "red";
}

const ROLES: readonly RoleDefinition[] = [
  {
    key: "po",
    title: "Product Owner",
    subtitle: "PO / Promotor",
    description:
      "Crea y gestiona propuestas, completa formularios y sube versiones finales.",
    footnote: "En su defecto: Líder de Dimensión.",
    userIds: ["u3", "u5", "u6"],
    accent: "blue",
  },
  {
    key: "sm",
    title: "Scrum Master",
    subtitle: "SM",
    description:
      "Acompaña al equipo, edita formularios como delegado del PO y registra cambios.",
    footnote: "Mismos permisos de edición que el PO.",
    userIds: ["u11"],
    accent: "blue",
  },
  {
    key: "bo",
    title: "Business Owner",
    subtitle: "BO",
    description:
      "Valida el valor de negocio de las iniciativas donde es owner.",
    userIds: ["u4"],
    accent: "green",
  },
  {
    key: "vp",
    title: "VP / Sponsor",
    subtitle: "VP",
    description:
      "Aprueba gateways y supervisa el portfolio de su vicepresidencia.",
    userIds: ["u1", "u7"],
    accent: "red",
  },
  {
    key: "at",
    title: "Área Transformación",
    subtitle: "AT",
    description:
      "Ve todo el portfolio, gestiona equipos y coordina iniciativas.",
    userIds: ["u2", "u9"],
    accent: "red",
  },
];

const ACCENT_CLASSES: Record<
  RoleDefinition["accent"],
  { bar: string; chip: string; chipText: string; ring: string }
> = {
  blue: {
    bar: "bg-pae-blue",
    chip: "bg-pae-blue/10",
    chipText: "text-pae-blue",
    ring: "ring-pae-blue",
  },
  green: {
    bar: "bg-pae-green",
    chip: "bg-pae-green/10",
    chipText: "text-pae-green",
    ring: "ring-pae-green",
  },
  red: {
    bar: "bg-pae-red",
    chip: "bg-pae-red/10",
    chipText: "text-pae-red",
    ring: "ring-pae-red",
  },
};

function initials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function destinationForRole(role: RoleKey): string {
  return role === "po" || role === "sm" ? "/mis-iniciativas" : "/dashboard";
}

export default function SeleccionarUsuarioPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<Id | "">("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const result = getAvailableUsers();
    if (result.success) {
      setAllUsers(result.data);
    }
  }, [demoLoaded]);

  const role = ROLES.find((r) => r.key === selectedRole) ?? null;

  const roleUsers = useMemo<User[]>(() => {
    if (!role) return [];
    const byId = new Map(allUsers.map((u) => [u.id, u] as const));
    return role.userIds
      .map((id) => byId.get(id))
      .filter((u): u is User => Boolean(u));
  }, [role, allUsers]);

  useEffect(() => {
    if (!role) {
      setSelectedUserId("");
      return;
    }
    const single = roleUsers.length === 1 ? roleUsers[0] : null;
    if (single) {
      setSelectedUserId(single.id);
    } else {
      setSelectedUserId("");
    }
  }, [role, roleUsers]);

  function handleLoadDemo() {
    const result = loadSeedData();
    if (!result.success) {
      setErrorMsg(result.error.message);
      return;
    }
    setErrorMsg(null);
    setDemoLoaded(true);
  }

  function handleClearData() {
    if (
      !window.confirm(
        "Se borran todas las iniciativas, formularios, gateways y eventos guardados. ¿Continuar?",
      )
    ) {
      return;
    }
    const result = clearAllData();
    if (!result.success) {
      setErrorMsg(result.error.message);
      return;
    }
    setErrorMsg(null);
    setDemoLoaded(false);
    setSelectedRole(null);
    setSelectedUserId("");
    // Forzar re-fetch de usuarios (el store se recarga con seed de users al próximo read)
    const available = getAvailableUsers();
    if (available.success) setAllUsers(available.data);
  }

  function handleConfirm() {
    if (!role || !selectedUserId) return;
    const result = switchUser(selectedUserId);
    if (!result.success) {
      setErrorMsg(result.error.message);
      return;
    }
    router.push(destinationForRole(role.key));
  }

  const canConfirm = Boolean(role && selectedUserId);

  return (
    <main className="flex min-h-screen items-start justify-center bg-pae-bg px-6 py-12">
      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-pae-text-tertiary">
            PAE — Plataforma de Portfolio
          </p>
          <h1 className="mt-2 text-[20px] font-semibold text-pae-text">
            Seleccioná un rol para probar
          </h1>
          <p className="mt-1 text-[14px] text-pae-text-secondary">
            Cada rol tiene su propia vista del portfolio.
          </p>

          <div className="mx-auto mt-4 max-w-xl space-y-2 text-left">
            <p className="rounded-lg bg-pae-blue/5 px-3 py-2 text-[13px] leading-snug text-pae-text-secondary">
              <span className="font-semibold text-pae-blue">Nota:</span> el
              Líder de Dimensión determina quién es el Product Owner y asigna
              los demás roles de la iniciativa.
            </p>
            <p className="rounded-lg bg-pae-blue/5 px-3 py-2 text-[13px] leading-snug text-pae-text-secondary">
              <span className="font-semibold text-pae-blue">Nota:</span> Scrum
              Masters y coaches pueden ser asignados a cualquier rol según
              corresponda.
            </p>
          </div>
        </header>

        <section aria-labelledby="paso-1" className="mb-8">
          <h2
            id="paso-1"
            className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-pae-text-tertiary"
          >
            Paso 1 — Elegí un rol
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ROLES.map((r) => {
              const accent = ACCENT_CLASSES[r.accent];
              const isActive = selectedRole === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r.key);
                    setErrorMsg(null);
                  }}
                  className={`relative flex items-start gap-3 overflow-hidden rounded-xl border bg-pae-surface px-4 py-4 text-left shadow-sm transition hover:shadow-md ${
                    isActive
                      ? `border-transparent ring-2 ${accent.ring}`
                      : "border-pae-border"
                  }`}
                  aria-pressed={isActive}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-1 ${accent.bar}`}
                    aria-hidden
                  />
                  <div className="flex-1 pl-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-semibold text-pae-text">
                        {r.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-[2px] text-[12px] font-medium ${accent.chip} ${accent.chipText}`}
                      >
                        {r.subtitle}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] leading-snug text-pae-text-secondary">
                      {r.description}
                    </p>
                    {r.footnote && (
                      <p className="mt-1 text-[13px] italic text-pae-text-tertiary">
                        {r.footnote}
                      </p>
                    )}
                    <p className="mt-2 text-[12px] text-pae-text-tertiary">
                      {r.userIds.length === 1
                        ? "1 usuario disponible"
                        : `${r.userIds.length} usuarios disponibles`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="paso-2" className="mb-8">
          <h2
            id="paso-2"
            className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-pae-text-tertiary"
          >
            Paso 2 — Elegí un usuario
          </h2>

          <div className="rounded-xl border border-pae-border bg-pae-surface p-5">
            {!role ? (
              <p className="text-[14px] text-pae-text-tertiary">
                Seleccioná primero un rol para ver los usuarios disponibles.
              </p>
            ) : roleUsers.length === 1 && roleUsers[0] ? (
              (() => {
                const u = roleUsers[0];
                return (
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold ${ACCENT_CLASSES[role.accent].chip} ${ACCENT_CLASSES[role.accent].chipText}`}
                    >
                      {initials(u.display_name)}
                    </span>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-pae-text">
                        {u.display_name}
                      </p>
                      <p className="text-[13px] text-pae-text-secondary">
                        {u.job_title} · {u.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-pae-bg px-2 py-[2px] text-[12px] font-medium text-pae-text-secondary">
                      Autoseleccionado
                    </span>
                  </div>
                );
              })()
            ) : (
              <div>
                <label
                  htmlFor="user-select"
                  className="block text-[13px] font-medium text-pae-text-secondary"
                >
                  Usuario
                </label>
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value as Id)}
                  className="mt-2 block h-10 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text focus:border-pae-blue focus:outline-none"
                >
                  <option value="">— Seleccioná un usuario —</option>
                  {roleUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name} · {u.job_title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="demo" className="mb-8">
          <h2
            id="demo"
            className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-pae-text-tertiary"
          >
            Datos de ejemplo (opcional)
          </h2>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-pae-border bg-pae-surface px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold text-pae-text">
                Cargar datos demo
              </p>
              <p className="mt-1 text-[13px] text-pae-text-secondary">
                Carga 8 iniciativas de ejemplo con formularios, gateways y
                eventos en localStorage.
              </p>
              {demoLoaded && (
                <p className="mt-1 text-[13px] font-medium text-pae-green">
                  ✓ Datos demo cargados
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="rounded-lg border border-pae-blue px-4 py-2 text-[14px] font-semibold text-pae-blue transition hover:bg-pae-blue/5"
              >
                {demoLoaded ? "Recargar demo" : "Cargar datos demo"}
              </button>
              <button
                type="button"
                onClick={handleClearData}
                className="rounded-lg border border-pae-red px-4 py-2 text-[13px] font-medium text-pae-red transition hover:bg-pae-red/5"
              >
                Limpiar todos los datos
              </button>
            </div>
          </div>
          <p className="mt-2 text-[12px] text-pae-text-tertiary">
            Tip: &ldquo;Limpiar&rdquo; borra iniciativas, formularios y eventos
            guardados en este navegador. Los usuarios mock se recargan
            automáticamente.
          </p>
        </section>

        {errorMsg && (
          <p className="mb-4 rounded-lg bg-pae-red/10 px-4 py-3 text-[14px] text-pae-red">
            {errorMsg}
          </p>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition ${
              canConfirm
                ? "bg-pae-blue hover:bg-pae-blue/90"
                : "cursor-not-allowed bg-pae-blue/40"
            }`}
          >
            Confirmar e ingresar
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
