"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AddTeamMemberModal } from "@/components/team/AddTeamMemberModal";
import type { InitiativeMemberRole } from "@/types";
import type {
  InitiativeTeam,
  StakeholderRow,
  StrategicAlignmentRow,
  TeamWorkMember,
} from "@/lib/storage/team";
import { getInitiativeTeam, removeTeamMember } from "@/lib/storage/team";

import { useInitiativeDetail } from "../DetailContext";

function WorkTypeBadge({ value }: { value: TeamWorkMember["work_type"] }) {
  const isInternal = value === "Interno";
  const classes = isInternal
    ? "bg-pae-blue/10 text-pae-blue"
    : "bg-pae-amber/10 text-pae-amber-dark";
  return (
    <span
      className={`inline-block rounded-full px-2 py-[2px] text-[11px] font-medium ${classes}`}
    >
      {value}
    </span>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-pae-border px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.05em] text-pae-text-tertiary">
      {children}
    </th>
  );
}

function TableHeaderRight({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-pae-border px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-[0.05em] text-pae-text-tertiary">
      {children}
    </th>
  );
}

function WorkTeamTable({
  members,
  canManage,
  onAddClick,
  onRemove,
}: {
  members: TeamWorkMember[];
  canManage: boolean;
  onAddClick: () => void;
  onRemove: (m: TeamWorkMember) => void;
}) {
  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-pae-text">
            Equipo de trabajo
          </h2>
          <p className="mt-0.5 text-[11px] text-pae-text-tertiary">
            {members.length}{" "}
            {members.length === 1 ? "integrante" : "integrantes"}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={onAddClick}
            className="rounded-lg bg-pae-blue px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90"
          >
            + Agregar al equipo
          </button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <TableHeader>Nombre</TableHeader>
              <TableHeader>Rol</TableHeader>
              <TableHeaderRight>% Asignación</TableHeaderRight>
              <TableHeader>Interno/Externo</TableHeader>
              <TableHeader>VP</TableHeader>
              {canManage && <th className="border-b border-pae-border px-3 py-2" aria-label="Acciones" />}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 6 : 5}
                  className="px-3 py-6 text-center text-[12px] text-pae-text-tertiary"
                >
                  Todavía no hay integrantes asignados.
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr
                key={`${m.user_id}_${m.role}`}
                className="border-b border-pae-border/60 transition hover:bg-pae-bg"
              >
                <td className="px-3 py-2.5 text-[12px] font-medium text-pae-text">
                  {m.display_name}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {m.role_label}
                </td>
                <td className="px-3 py-2.5 text-right text-[12px] text-pae-text tabular-nums">
                  {m.allocation_percent}%
                </td>
                <td className="px-3 py-2.5">
                  <WorkTypeBadge value={m.work_type} />
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {m.vicepresidencia}
                </td>
                {canManage && (
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(m)}
                      className="rounded-md border border-pae-red/30 bg-pae-surface px-2 py-1 text-[11px] font-medium text-pae-red transition hover:bg-pae-red/5"
                      title="Sacar del equipo"
                    >
                      Sacar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StrategicAlignmentTable({
  rows,
}: {
  rows: StrategicAlignmentRow[];
}) {
  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h2 className="text-[14px] font-semibold text-pae-text">
        Alineación estratégica
      </h2>
      <p className="mt-0.5 text-[11px] text-pae-text-tertiary">
        Sponsors, Business Owner, Portfolio y Líder de Dimensión responsables de
        la iniciativa.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <TableHeader>Rol</TableHeader>
              <TableHeader>Nombre</TableHeader>
              <TableHeader>Cargo</TableHeader>
              <TableHeader>VP</TableHeader>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.key}
                className="border-b border-pae-border/60 transition hover:bg-pae-bg"
              >
                <td className="px-3 py-2.5 text-[12px] font-semibold text-pae-text">
                  {r.label}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text">
                  {r.display_name ?? (
                    <span className="italic text-pae-text-tertiary">
                      Sin asignar
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {r.job_title ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {r.vicepresidencia ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StakeholdersTable({ rows }: { rows: StakeholderRow[] }) {
  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h2 className="text-[14px] font-semibold text-pae-text">
        Interesados y consultados
      </h2>
      <p className="mt-0.5 text-[11px] text-pae-text-tertiary">
        Personas informadas o consultadas durante el ciclo de la iniciativa.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <TableHeader>Nombre</TableHeader>
              <TableHeader>Posición</TableHeader>
              <TableHeader>VP</TableHeader>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-[12px] text-pae-text-tertiary"
                >
                  No hay interesados registrados.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.user_id}
                className="border-b border-pae-border/60 transition hover:bg-pae-bg"
              >
                <td className="px-3 py-2.5 text-[12px] font-medium text-pae-text">
                  {r.display_name}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {r.position}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {r.vicepresidencia}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function EquipoTab() {
  const detail = useInitiativeDetail();
  const [team, setTeam] = useState<InitiativeTeam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const result = getInitiativeTeam(detail.initiative.id);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setTeam(result.data);
  }, [detail.initiative.id, reloadKey]);

  const excludedByRole = useMemo(() => {
    if (!team) return {} as Partial<Record<InitiativeMemberRole, string[]>>;
    const map: Partial<Record<InitiativeMemberRole, string[]>> = {};
    for (const m of team.work_members) {
      const arr = map[m.role] ?? [];
      arr.push(m.user_id);
      map[m.role] = arr;
    }
    return map;
  }, [team]);

  function handleRemove(member: TeamWorkMember) {
    const confirmed = window.confirm(
      `¿Sacar a ${member.display_name} del equipo (${member.role_label})?`,
    );
    if (!confirmed) return;
    const result = removeTeamMember(
      detail.initiative.id,
      member.user_id,
      member.role,
    );
    if (!result.success) {
      setRemoveError(result.error.message);
      return;
    }
    setRemoveError(null);
    reload();
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pae-red/30 bg-pae-red/5 p-4">
        <p className="text-[13px] text-pae-red">{error}</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[13px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {removeError && (
        <div className="rounded-xl border border-pae-red/30 bg-pae-red/5 p-3">
          <p className="text-[12px] text-pae-red">{removeError}</p>
        </div>
      )}

      <WorkTeamTable
        members={team.work_members}
        canManage={team.can_manage}
        onAddClick={() => setModalOpen(true)}
        onRemove={handleRemove}
      />
      <StrategicAlignmentTable rows={team.strategic_alignment} />
      <StakeholdersTable rows={team.stakeholders} />

      {team.can_manage && (
        <AddTeamMemberModal
          open={modalOpen}
          initiativeId={detail.initiative.id}
          excludedUserIdsByRole={excludedByRole}
          onClose={() => setModalOpen(false)}
          onAdded={reload}
        />
      )}
    </div>
  );
}
