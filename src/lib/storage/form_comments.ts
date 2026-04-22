import type { Id } from "@/types";
import { err, ok, type Result } from "@/lib/result";

import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";
import { newId, nowIso } from "./_ids";
import {
  readStore,
  writeStore,
  type FormComment,
  type Store,
} from "./_store";

function formIsInProgress(status: string): boolean {
  // Formularios "en proceso": se puede comentar.
  // Cerrados o aprobados (approved/final/reviewed/closed): solo histórico.
  return status === "draft" || status === "submitted" || status === "in_review";
}

export interface FormCommentWithAuthor {
  id: Id;
  form_id: Id;
  user_id: Id;
  author_name: string;
  author_role_label: string;
  text: string;
  created_at: string;
}

function buildCommentsWithAuthor(
  comments: FormComment[],
  store: Store,
): FormCommentWithAuthor[] {
  return comments.map((c) => {
    const u = store.users.find((uu) => uu.id === c.user_id);
    let roleLabel = "Invitado";
    if (u) {
      if (u.global_role === "area_transformacion") roleLabel = "Área Transformación";
      else if (u.is_vp) roleLabel = "VP";
      else roleLabel = u.job_title || "Miembro";
    }
    return {
      id: c.id,
      form_id: c.form_id,
      user_id: c.user_id,
      author_name: u?.display_name ?? "Usuario desconocido",
      author_role_label: roleLabel,
      text: c.text,
      created_at: c.created_at,
    };
  });
}

export function listFormComments(
  formId: Id,
): Result<FormCommentWithAuthor[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const comments = store.form_comments
    .filter((c) => c.form_id === formId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return ok(buildCommentsWithAuthor(comments, store));
}

export function addFormComment(
  formId: Id,
  text: string,
): Result<FormCommentWithAuthor> {
  const clean = (text ?? "").trim();
  if (clean.length < 2) {
    return err("VALIDATION_ERROR", "El comentario no puede estar vacío");
  }
  if (clean.length > 2000) {
    return err("VALIDATION_ERROR", "El comentario supera los 2000 caracteres");
  }

  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  if (!formIsInProgress(form.status)) {
    return err(
      "CONFLICT",
      "Solo se puede comentar en formularios en proceso (draft, enviado o en revisión)",
    );
  }

  const comment: FormComment = {
    id: newId("fcmt"),
    form_id: formId,
    user_id: user.id,
    text: clean,
    created_at: nowIso(),
  };
  store.form_comments.push(comment);
  writeStore(store);
  return ok(buildCommentsWithAuthor([comment], store)[0]!);
}

export function deleteFormComment(commentId: Id): Result<{ id: Id }> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const comment = store.form_comments.find((c) => c.id === commentId);
  if (!comment) return err("NOT_FOUND", "Comentario no encontrado");

  // Solo el autor puede borrar su propio comentario.
  if (comment.user_id !== user.id && user.global_role !== "admin") {
    return err("FORBIDDEN", "Solo el autor puede borrar este comentario");
  }

  store.form_comments = store.form_comments.filter((c) => c.id !== commentId);
  writeStore(store);
  return ok({ id: commentId });
}
