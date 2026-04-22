"use client";

import { useEffect, useMemo, useState } from "react";

import type { InitiativeMemberRole, User } from "@/types";
import { getAvailableUsers } from "@/lib/storage/auth";
import {
  addAffectedMember,
  addTeamMember,
  changeInitiativeArea,
  changeTeamMemberRole,
  getCurrentInitiativeVp,
  getInitiativeTeam,
  listAvailableVps,
  removeTeamMember,
} from "@/lib/storage/team";

type PopupKind =
  | "area"
  | "add"
  | "remove"
  | "role"
  | "affected"
  | null;

interface Props {
  initiativeId: string;
  initiativeName: string;
  onChanged: () => void;
}

const ASSIGNABLE: {
  role: InitiativeMemberRole;
  label: string;
}[] = [
  { role: "po", label: "Product Owner" },
  { role: "promotor", label: "Promotor" },
  { role: "ld", label: "Líder de Dimensión" },
  { role: "sm", label: "Scrum Master" },
  { role: "equipo", label: "Equipo" },
];

export function TeamManagementPanel({
  initiativeId,
  initiativeName,
  onChanged,
}: Props) {
  const [popup, setPopup] = useState<PopupKind>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vps, setVps] = useState<string[]>([]);
  const [currentVp, setCurrentVp] = useState<string>("");
  const [areaChanged, setAreaChanged] = useState(false);
  const [members, setMembers] = useState<
    { user_id: string; display_name: string; role: InitiativeMemberRole; role_label: string }[]
  >([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Form state per popup
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<InitiativeMemberRole>("equipo");
  const [selectedVp, setSelectedVp] = useState("");
  const [reason, setReason] = useState("");
  const [removeUserRole, setRemoveUserRole] = useState("");

  function reload() {
    const us = getAvailableUsers();
    if (us.success) setUsers(us.data);
    setVps(listAvailableVps());
    const vpState = getCurrentInitiativeVp(initiativeId);
    setCurrentVp(vpState.current_vp);
    setAreaChanged(vpState.changed);

    const team = getInitiativeTeam(initiativeId);
    if (team.success) {
      setMembers(
        team.data.work_members.map((m) => ({
          user_id: m.user_id,
          display_name: m.display_name,
          role: m.role,
          role_label: m.role_label,
        })),
      );
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initiativeId]);

  function closePopup() {
    setPopup(null);
    setSelectedUser("");
    setSelectedRole("equipo");
    setSelectedVp("");
    setReason("");
    setRemoveUserRole("");
    setErr(null);
  }

  function notifyMsg(m: string) {
    setMsg(m);
    setErr(null);
    setTimeout(() => setMsg(null), 3500);
  }

  function notifyErr(e: string) {
    setErr(e);
    setMsg(null);
  }

  const availableForAdd = useMemo(() => {
    const assigned = new Set(members.map((m) => m.user_id));
    return users.filter((u) => !assigned.has(u.id));
  }, [users, members]);

  function handleChangeArea() {
    if (!selectedVp) return notifyErr("Elegí el VP destino");
    const res = changeInitiativeArea(
      initiativeId,
      selectedVp,
      reason || null,
    );
    if (!res.success) return notifyErr(res.error.message);
    notifyMsg(`Área cambiada a ${selectedVp}`);
    closePopup();
    reload();
    onChanged();
  }

  function handleAdd() {
    if (!selectedUser) return notifyErr("Elegí una persona");
    const res = addTeamMember({
      initiative_id: initiativeId,
      user_id: selectedUser,
      role: selectedRole,
    });
    if (!res.success) return notifyErr(res.error.message);
    notifyMsg("Miembro agregado al equipo");
    closePopup();
    reload();
    onChanged();
  }

  function handleRemove() {
    if (!removeUserRole) return notifyErr("Elegí a quién sacar");
    const [userId, role] = removeUserRole.split("::");
    if (!userId || !role) return notifyErr("Selección inválida");
    const res = removeTeamMember(
      initiativeId,
      userId,
      role as InitiativeMemberRole,
    );
    if (!res.success) return notifyErr(res.error.message);
    notifyMsg("Miembro sacado del equipo");
    closePopup();
    reload();
    onChanged();
  }

  function handleRole() {
    if (!removeUserRole) return notifyErr("Elegí a la persona");
    const [userId, oldRole] = removeUserRole.split("::");
    if (!userId || !oldRole) return notifyErr("Selección inválida");
    const res = changeTeamMemberRole(
      initiativeId,
      userId,
      oldRole as InitiativeMemberRole,
      selectedRole,
    );
    if (!res.success) return notifyErr(res.error.message);
    notifyMsg("Rol actualizado");
    closePopup();
    reload();
    onChanged();
  }

  function handleAffected() {
    if (!selectedUser) return notifyErr("Elegí una persona");
    const res = addAffectedMember(initiativeId, selectedUser);
    if (!res.success) return notifyErr(res.error.message);
    notifyMsg(
      "Persona agregada como afectada. Le llegó una notificación y la verá en 'Que me impactan'.",
    );
    closePopup();
    reload();
    onChanged();
  }

  return (
    <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-semibold text-pae-text">
          Gestión de iniciativa
        </p>
        <p className="text-[10px] text-pae-text-tertiary">
          Área actual:{" "}
          <span className="font-semibold text-pae-text">{currentVp || "—"}</span>
          {areaChanged && (
            <span className="ml-1 rounded-full bg-pae-amber/15 px-2 py-0.5 text-[9px] font-semibold text-pae-amber">
              Cambiada
            </span>
          )}
        </p>
      </div>
      <p className="mt-1 text-[10px] text-pae-text-secondary">
        Acciones independientes de la aprobación. No afectan votos ni decisiones del gateway.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPopup("area")}
          className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
        >
          ↔ Cambio de área
        </button>
        <button
          type="button"
          onClick={() => setPopup("add")}
          className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
        >
          + Agregar miembro
        </button>
        <button
          type="button"
          onClick={() => setPopup("remove")}
          className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
        >
          − Sacar miembro
        </button>
        <button
          type="button"
          onClick={() => setPopup("role")}
          className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
        >
          👤 Asignar rol
        </button>
        <button
          type="button"
          onClick={() => setPopup("affected")}
          className="inline-flex h-8 items-center rounded-md border border-pae-blue/40 bg-pae-blue/5 px-3 text-[11px] font-semibold text-pae-blue transition hover:bg-pae-blue/10"
        >
          ⚠ Incluir afectados
        </button>
      </div>

      {msg && <p className="mt-3 text-[11px] text-pae-green">{msg}</p>}
      {err && <p className="mt-3 text-[11px] text-pae-red">{err}</p>}

      {popup && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4"
          onClick={closePopup}
        >
          <div
            className="w-full max-w-md rounded-[10px] bg-pae-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {popup === "area" && (
              <>
                <p className="text-[14px] font-semibold text-pae-text">
                  Cambio de área
                </p>
                <p className="mt-1 text-[11px] text-pae-text-secondary">
                  <span className="font-semibold">{initiativeName}</span> está
                  actualmente en{" "}
                  <span className="font-semibold">{currentVp}</span>.
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      Derivar a
                    </label>
                    <select
                      value={selectedVp}
                      onChange={(e) => setSelectedVp(e.target.value)}
                      className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                    >
                      <option value="">Seleccionar VP destino...</option>
                      {vps
                        .filter((v) => v !== currentVp)
                        .map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      Motivo (opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej: mayor impacto en operaciones upstream"
                      className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text placeholder:text-pae-text-tertiary"
                    />
                  </div>
                </div>
              </>
            )}

            {popup === "add" && (
              <>
                <p className="text-[14px] font-semibold text-pae-text">
                  Agregar miembro al equipo
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      Persona
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                    >
                      <option value="">Seleccionar...</option>
                      {availableForAdd.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.display_name} — {u.job_title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      Rol
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as InitiativeMemberRole)
                      }
                      className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                    >
                      {ASSIGNABLE.map((r) => (
                        <option key={r.role} value={r.role}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {popup === "remove" && (
              <>
                <p className="text-[14px] font-semibold text-pae-text">
                  Sacar miembro del equipo
                </p>
                <div className="mt-4">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                    Miembro
                  </label>
                  <select
                    value={removeUserRole}
                    onChange={(e) => setRemoveUserRole(e.target.value)}
                    className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                  >
                    <option value="">Seleccionar...</option>
                    {members.map((m) => (
                      <option
                        key={`${m.user_id}-${m.role}`}
                        value={`${m.user_id}::${m.role}`}
                      >
                        {m.display_name} ({m.role_label})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {popup === "role" && (
              <>
                <p className="text-[14px] font-semibold text-pae-text">
                  Cambiar rol a un miembro
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      Miembro
                    </label>
                    <select
                      value={removeUserRole}
                      onChange={(e) => setRemoveUserRole(e.target.value)}
                      className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                    >
                      <option value="">Seleccionar...</option>
                      {members.map((m) => (
                        <option
                          key={`${m.user_id}-${m.role}`}
                          value={`${m.user_id}::${m.role}`}
                        >
                          {m.display_name} ({m.role_label})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      Nuevo rol
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as InitiativeMemberRole)
                      }
                      className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                    >
                      {ASSIGNABLE.map((r) => (
                        <option key={r.role} value={r.role}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {popup === "affected" && (
              <>
                <p className="text-[14px] font-semibold text-pae-text">
                  Incluir afectado
                </p>
                <p className="mt-1 text-[11px] text-pae-text-secondary">
                  La persona va a recibir una notificación y va a ver esta
                  iniciativa en su tab <strong>Que me impactan</strong>.
                </p>
                <div className="mt-4">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                    Persona
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                  >
                    <option value="">Seleccionar...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name} — {u.job_title}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {err && <p className="mt-3 text-[11px] text-pae-red">{err}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closePopup}
                className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-surface px-3 text-[11px] font-medium text-pae-text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (popup === "area") handleChangeArea();
                  else if (popup === "add") handleAdd();
                  else if (popup === "remove") handleRemove();
                  else if (popup === "role") handleRole();
                  else if (popup === "affected") handleAffected();
                }}
                className="inline-flex h-8 items-center rounded-md bg-pae-blue px-3 text-[11px] font-semibold text-white hover:bg-pae-blue/90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
