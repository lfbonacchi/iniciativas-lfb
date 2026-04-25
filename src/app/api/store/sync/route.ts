import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Usar connection_limit=1 y timeout corto para Lambda
const DB_URL = process.env.DATABASE_URL ?? "";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DB_URL + "&connection_limit=1&connect_timeout=10",
    },
  },
  log: ["error", "warn"],
});

// POST /api/store/sync — recibe el store completo y sincroniza con la DB
export async function POST(req: NextRequest) {
  try {
    console.log("Sync started, DB_URL prefix:", DB_URL.substring(0, 40));
    const store = await req.json();

    // Sync in order — users first (FK dependencies), then rest in parallel
    await syncUsers(store);
    const results = await Promise.allSettled([
      syncInitiatives(store),
      syncMembers(store),
      syncForms(store),
      syncFormResponses(store),
      syncGateways(store),
      syncGatewayVotes(store),
      syncEvents(store),
      syncMesa(store),
      syncNotifications(store),
      syncDocuments(store),
    ]);

    // Log any failures for debugging
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Sync entity ${i} failed:`, r.reason);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sync error:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function syncUsers(store: Record<string, unknown[]>) {
  const users = (store.users ?? []) as Array<Record<string, unknown>>;
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id as string },
      create: {
        id: u.id as string,
        azure_oid: u.azure_oid as string ?? null,
        email: u.email as string,
        display_name: u.display_name as string,
        job_title: u.job_title as string,
        department: u.department as string,
        vicepresidencia: u.vicepresidencia as string,
        global_role: u.global_role as "user" | "area_transformacion" | "admin",
        is_vp: u.is_vp as boolean,
      },
      update: {
        display_name: u.display_name as string,
        job_title: u.job_title as string,
      },
    });
  }
}

async function syncInitiatives(store: Record<string, unknown[]>) {
  const initiatives = (store.initiatives ?? []) as Array<Record<string, unknown>>;
  for (const i of initiatives) {
    await prisma.initiative.upsert({
      where: { id: i.id as string },
      create: {
        id: i.id as string,
        name: i.name as string,
        current_stage: i.current_stage as "proposal" | "dimensioning" | "mvp" | "ltp_tracking",
        status: i.status as "in_progress" | "pending" | "paused" | "rejected" | "area_change",
        has_etapa1: i.has_etapa1 as boolean,
        has_etapa2: i.has_etapa2 as boolean,
        has_etapa3: i.has_etapa3 as boolean,
        created_at: new Date(i.created_at as string),
      },
      update: {
        name: i.name as string,
        current_stage: i.current_stage as "proposal" | "dimensioning" | "mvp" | "ltp_tracking",
        status: i.status as "in_progress" | "pending" | "paused" | "rejected" | "area_change",
        has_etapa1: i.has_etapa1 as boolean,
        has_etapa2: i.has_etapa2 as boolean,
        has_etapa3: i.has_etapa3 as boolean,
      },
    });
  }
}

async function syncMembers(store: Record<string, unknown[]>) {
  const members = (store.initiative_members ?? []) as Array<Record<string, unknown>>;
  for (const m of members) {
    await prisma.initiativeMember.upsert({
      where: {
        user_id_initiative_id: {
          user_id: m.user_id as string,
          initiative_id: m.initiative_id as string,
        },
      },
      create: {
        user_id: m.user_id as string,
        initiative_id: m.initiative_id as string,
        role: m.role as "promotor" | "ld" | "po" | "bo" | "sponsor" | "sm" | "equipo" | "afectado",
        can_edit: m.can_edit as boolean,
        access_level: m.access_level as "edit" | "comment" | "view" | undefined ?? undefined,
      },
      update: {
        role: m.role as "promotor" | "ld" | "po" | "bo" | "sponsor" | "sm" | "equipo" | "afectado",
        can_edit: m.can_edit as boolean,
      },
    });
  }
}

async function syncForms(store: Record<string, unknown[]>) {
  const forms = (store.forms ?? []) as Array<Record<string, unknown>>;
  for (const f of forms) {
    await prisma.form.upsert({
      where: { id: f.id as string },
      create: {
        id: f.id as string,
        initiative_id: f.initiative_id as string,
        form_type: f.form_type as "F1" | "F2" | "F3" | "F4" | "F5",
        version: f.version as number,
        status: f.status as "draft" | "submitted" | "in_review" | "approved" | "final" | "reviewed" | "closed",
        ltp_period: f.ltp_period as string ?? null,
        created_by: f.created_by as string,
        created_at: new Date(f.created_at as string),
        updated_at: new Date(f.updated_at as string),
        submitted_at: f.submitted_at ? new Date(f.submitted_at as string) : null,
        approved_at: f.approved_at ? new Date(f.approved_at as string) : null,
      },
      update: {
        status: f.status as "draft" | "submitted" | "in_review" | "approved" | "final" | "reviewed" | "closed",
        updated_at: new Date(f.updated_at as string),
        submitted_at: f.submitted_at ? new Date(f.submitted_at as string) : null,
        approved_at: f.approved_at ? new Date(f.approved_at as string) : null,
      },
    });
  }
}

async function syncFormResponses(store: Record<string, unknown[]>) {
  const responses = (store.form_responses ?? []) as Array<Record<string, unknown>>;
  for (const r of responses) {
    await prisma.formResponse.upsert({
      where: { form_id_field_key: { form_id: r.form_id as string, field_key: r.field_key as string } },
      create: {
        id: r.id as string,
        form_id: r.form_id as string,
        field_key: r.field_key as string,
        value: r.value as object,
      },
      update: { value: r.value as object },
    });
  }
}

async function syncGateways(store: Record<string, unknown[]>) {
  const gateways = (store.gateways ?? []) as Array<Record<string, unknown>>;
  for (const g of gateways) {
    await prisma.gateway.upsert({
      where: { id: g.id as string },
      create: {
        id: g.id as string,
        form_id: g.form_id as string,
        initiative_id: g.initiative_id as string,
        gateway_number: g.gateway_number as number,
        status: g.status as "pending" | "approved" | "approved_with_changes" | "feedback" | "pause" | "reject" | "area_change",
        requires_unanimity: g.requires_unanimity as boolean,
      },
      update: {
        status: g.status as "pending" | "approved" | "approved_with_changes" | "feedback" | "pause" | "reject" | "area_change",
      },
    });
  }
}

async function syncGatewayVotes(store: Record<string, unknown[]>) {
  const votes = (store.gateway_votes ?? []) as Array<Record<string, unknown>>;
  for (const v of votes) {
    await prisma.gatewayVote.upsert({
      where: { gateway_id_user_id: { gateway_id: v.gateway_id as string, user_id: v.user_id as string } },
      create: {
        id: v.id as string,
        gateway_id: v.gateway_id as string,
        user_id: v.user_id as string,
        vote: v.vote as "approved" | "approved_with_changes" | "feedback" | "pause" | "reject" | "area_change",
        feedback_text: v.feedback_text as string ?? null,
      },
      update: {
        vote: v.vote as "approved" | "approved_with_changes" | "feedback" | "pause" | "reject" | "area_change",
        feedback_text: v.feedback_text as string ?? null,
      },
    });
  }
}

async function syncEvents(store: Record<string, unknown[]>) {
  const events = (store.portfolio_events ?? []) as Array<Record<string, unknown>>;
  for (const e of events) {
    await prisma.portfolioEvent.upsert({
      where: { id: e.id as string },
      create: {
        id: e.id as string,
        name: e.name as string,
        type: e.type as "gate" | "sprint_review" | "seg_q" | "seg_mensual" | "ltp_plan" | "entrega" | "otro",
        custom_type_label: e.custom_type_label as string ?? null,
        initiative_id: e.initiative_id as string,
        date: new Date(e.date as string),
        original_date: e.original_date ? new Date(e.original_date as string) : null,
        status: (e.status as string ?? "scheduled") as "scheduled" | "cancelled",
        created_by: e.created_by as string,
        created_at: new Date(e.created_at as string),
      },
      update: {
        name: e.name as string,
        date: new Date(e.date as string),
        status: (e.status as string ?? "scheduled") as "scheduled" | "cancelled",
      },
    });
  }
}

async function syncMesa(store: Record<string, unknown[]>) {
  const bloqueantes = (store.mesa_bloqueantes ?? []) as Array<Record<string, unknown>>;
  for (const b of bloqueantes) {
    await prisma.mesaBloqueante.upsert({
      where: { id: b.id as string },
      create: {
        id: b.id as string,
        initiative_id: b.initiative_id as string,
        name: b.name as string,
        is_priority: b.is_priority as boolean,
        resolved: b.resolved as boolean,
        created_at: new Date(b.created_at as string),
        created_by: b.created_by as string,
      },
      update: {
        name: b.name as string,
        is_priority: b.is_priority as boolean,
        resolved: b.resolved as boolean,
      },
    });
  }

  const temas = (store.mesa_temas_pendientes ?? []) as Array<Record<string, unknown>>;
  for (const t of temas) {
    await prisma.mesaTemaPendiente.upsert({
      where: { id: t.id as string },
      create: {
        id: t.id as string,
        initiative_id: t.initiative_id as string,
        text: t.text as string,
        done: t.done as boolean,
        created_at: new Date(t.created_at as string),
        created_by: t.created_by as string,
      },
      update: { done: t.done as boolean, text: t.text as string },
    });
  }
}

async function syncNotifications(store: Record<string, unknown[]>) {
  const notifs = (store.notifications ?? []) as Array<Record<string, unknown>>;
  for (const n of notifs) {
    await prisma.notification.upsert({
      where: { id: n.id as string },
      create: {
        id: n.id as string,
        user_id: n.user_id as string,
        type: n.type as "gateway_vote_pending" | "gateway_resolved" | "form_feedback_received" | "form_submitted" | "form_reviewed" | "initiative_paused" | "initiative_rejected" | "initiative_area_change" | "member_added" | "member_removed" | "document_generated" | "document_uploaded",
        title: n.title as string,
        message: n.message as string,
        initiative_id: n.initiative_id as string,
        read: n.read as boolean,
        created_at: new Date(n.created_at as string),
      },
      update: { read: n.read as boolean },
    });
  }
}

async function syncDocuments(store: Record<string, unknown[]>) {
  const docs = (store.documents ?? []) as Array<Record<string, unknown>>;
  for (const d of docs) {
    await prisma.document.upsert({
      where: { id: d.id as string },
      create: {
        id: d.id as string,
        initiative_id: d.initiative_id as string,
        document_type: d.document_type as "formulario_xlsx" | "formulario_pdf" | "vf_formulario_xlsx" | "vf_formulario_pdf" | "vf_presentacion_pptx" | "vf_nota_prensa_docx" | "minuta_gateway_docx" | "manual_upload",
        file_path: d.file_path as string,
        stage: d.stage as "proposal" | "dimensioning" | "mvp" | "ltp_tracking",
        ltp_period: d.ltp_period as string ?? null,
        generated_by: d.generated_by as string,
        created_at: new Date(d.created_at as string),
      },
      update: {},
    });
  }
}
