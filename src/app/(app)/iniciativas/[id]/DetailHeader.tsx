"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { InitiativeDetail } from "@/lib/storage/initiative_detail";

const TABS: { key: string; label: string; segment: string | null }[] = [
  { key: "resumen", label: "Resumen", segment: null },
  { key: "eventos", label: "Eventos", segment: "eventos" },
  { key: "formularios", label: "Formularios", segment: "formularios" },
  { key: "documentos", label: "Documentos", segment: "documentos" },
  { key: "equipo", label: "Equipo", segment: "equipo" },
  {
    key: "mesa-de-trabajo",
    label: "Mesa de trabajo",
    segment: "mesa-de-trabajo",
  },
];

function stageChipTone(detail: InitiativeDetail): { bg: string; text: string } {
  if (detail.initiative.current_stage === "ltp_tracking") {
    return { bg: "bg-pae-green/10", text: "text-pae-green" };
  }
  return { bg: "bg-pae-blue/10", text: "text-pae-blue" };
}

function statusChipTone(
  status: InitiativeDetail["status"],
): { bg: string; text: string } {
  switch (status) {
    case "in_progress":
      return { bg: "bg-pae-green/10", text: "text-pae-green" };
    case "pending":
      return { bg: "bg-pae-red/10", text: "text-pae-red" };
    case "paused":
      return { bg: "bg-pae-amber/10", text: "text-pae-amber" };
    case "rejected":
    case "area_change":
      return {
        bg: "bg-pae-text-tertiary/10",
        text: "text-pae-text-secondary",
      };
  }
}

function roleShort(displayName: string): string {
  const parts = displayName.split(" ");
  if (parts.length < 2) return displayName;
  const first = parts[0] ?? "";
  return `${first.charAt(0)}. ${parts.slice(1).join(" ")}`;
}

export function DetailHeader({ detail }: { detail: InitiativeDetail }) {
  const pathname = usePathname();
  const base = `/iniciativas/${detail.initiative.id}`;
  const stageTone = stageChipTone(detail);
  const statusTone = statusChipTone(detail.status);

  const rolesText = [
    `Dim: ${detail.dimension}`,
    ...detail.header_roles.map((r) => `${r.abbr}: ${roleShort(r.display_name)}`),
  ].join(" | ");

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-pae-text-secondary">
        <Link href="/mis-iniciativas" className="hover:text-pae-blue">
          Mis iniciativas
        </Link>
        <span className="mx-1.5 text-pae-text-tertiary">›</span>
        <span className="font-medium text-pae-text">
          {detail.initiative.name}
        </span>
      </p>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-pae-text">
            {detail.initiative.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-[3px] text-[11px] font-medium ${stageTone.bg} ${stageTone.text}`}
            >
              {detail.stage_label}
            </span>
            <span
              className={`rounded-full px-2.5 py-[3px] text-[11px] font-medium ${statusTone.bg} ${statusTone.text}`}
            >
              {detail.status_label}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-pae-text-secondary">
            {rolesText}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-pae-red/30 bg-pae-red/5 px-3 py-2 text-[12px] font-semibold text-pae-red transition hover:bg-pae-red/10"
            title="Descargar presentación PPTX"
          >
            Descargar PPTX
          </button>
          <button
            type="button"
            className="rounded-lg border border-pae-border bg-pae-surface px-3 py-2 text-[12px] font-medium text-pae-text-secondary transition hover:bg-pae-bg"
            title="Generar nota de prensa DOCX"
          >
            Nota de prensa
          </button>
        </div>
      </div>

      <nav className="border-b border-pae-border" aria-label="Tabs">
        <ul className="-mb-px flex flex-wrap gap-5">
          {TABS.map((t) => {
            const href = t.segment ? `${base}/${t.segment}` : base;
            const active =
              t.segment === null
                ? pathname === base
                : pathname === href || pathname.startsWith(`${href}/`);
            const locked =
              t.key === "mesa-de-trabajo" && !detail.is_stage_4_unlocked;

            if (locked) {
              return (
                <li key={t.key}>
                  <span
                    className="inline-flex cursor-not-allowed items-center gap-1.5 border-b-[3px] border-transparent py-2 text-[13px] text-pae-text-tertiary"
                    title="Se desbloquea en etapa Delivery (F3 aprobado o F4 existe)"
                  >
                    {t.label}
                    <span aria-hidden>🔒</span>
                  </span>
                </li>
              );
            }

            return (
              <li key={t.key}>
                <Link
                  href={href}
                  className={`inline-block border-b-[3px] py-2 text-[13px] transition ${
                    active
                      ? "border-pae-blue font-semibold text-pae-blue"
                      : "border-transparent text-pae-text-secondary hover:text-pae-text"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
