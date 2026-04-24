import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const DB_URL = process.env.DATABASE_URL ?? 
  "postgresql://pae_admin:PaePortfolio2026!@pae-portfolio-instance.c3hpfgbwvxqr.sa-east-1.rds.amazonaws.com:5432/pae_portfolio?schema=public&sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DB_URL + "&connection_limit=1&connect_timeout=10",
    },
  },
  log: ["error", "warn"],
});

// GET /api/store — devuelve todos los datos para hidratar el localStorage
export async function GET() {
  try {
    const [
      users,
      initiatives,
      initiative_members,
      initiative_folders,
      form_definitions,
      forms,
      form_responses,
      form_snapshots,
      gateways,
      gateway_votes,
      documents,
      notifications,
      portfolio_events,
      mesa_bloqueantes,
      mesa_temas_pendientes,
      mesa_brainstorm_notes,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.initiative.findMany(),
      prisma.initiativeMember.findMany(),
      prisma.initiativeFolder.findMany(),
      prisma.formDefinition.findMany(),
      prisma.form.findMany(),
      prisma.formResponse.findMany(),
      prisma.formSnapshot.findMany(),
      prisma.gateway.findMany(),
      prisma.gatewayVote.findMany(),
      prisma.document.findMany(),
      prisma.notification.findMany(),
      prisma.portfolioEvent.findMany({
        include: {
          invitations: true,
          attendance: true,
        },
      }),
      prisma.mesaBloqueante.findMany({
        include: { involucrados: true },
      }),
      prisma.mesaTemaPendiente.findMany(),
      prisma.mesaBrainstormNote.findMany(),
    ]);

    // Transformar al formato que espera el store del frontend
    const store = {
      users: users.map((u) => ({
        id: u.id,
        azure_oid: u.azure_oid,
        email: u.email,
        display_name: u.display_name,
        job_title: u.job_title,
        department: u.department,
        vicepresidencia: u.vicepresidencia,
        global_role: u.global_role,
        is_vp: u.is_vp,
      })),
      initiatives: initiatives.map((i) => ({
        id: i.id,
        name: i.name,
        current_stage: i.current_stage,
        status: i.status,
        has_etapa1: i.has_etapa1,
        has_etapa2: i.has_etapa2,
        has_etapa3: i.has_etapa3,
        created_at: i.created_at.toISOString(),
      })),
      initiative_members: initiative_members.map((m) => ({
        user_id: m.user_id,
        initiative_id: m.initiative_id,
        role: m.role,
        can_edit: m.can_edit,
        access_level: m.access_level,
      })),
      initiative_folders: initiative_folders.map((f) => ({
        id: f.id,
        initiative_id: f.initiative_id,
        folder_path: f.folder_path,
        stage: f.stage,
        ltp_period: f.ltp_period,
        created_at: f.created_at.toISOString(),
      })),
      form_definitions: form_definitions.map((fd) => ({
        id: fd.id,
        form_type: fd.form_type,
        version: fd.version,
        sections_config: fd.sections_config,
      })),
      forms: forms.map((f) => ({
        id: f.id,
        initiative_id: f.initiative_id,
        form_type: f.form_type,
        version: f.version,
        status: f.status,
        ltp_period: f.ltp_period,
        created_by: f.created_by,
        created_at: f.created_at.toISOString(),
        updated_at: f.updated_at.toISOString(),
        submitted_at: f.submitted_at?.toISOString() ?? null,
        approved_at: f.approved_at?.toISOString() ?? null,
      })),
      form_responses: form_responses.map((r) => ({
        id: r.id,
        form_id: r.form_id,
        field_key: r.field_key,
        value: r.value,
      })),
      form_change_log: [],
      form_snapshots: form_snapshots.map((s) => ({
        id: s.id,
        form_id: s.form_id,
        snapshot_type: s.snapshot_type,
        version_number: s.version_number,
        responses_data: s.responses_data,
        created_at: s.created_at.toISOString(),
      })),
      gateways: gateways.map((g) => ({
        id: g.id,
        form_id: g.form_id,
        initiative_id: g.initiative_id,
        gateway_number: g.gateway_number,
        status: g.status,
        requires_unanimity: g.requires_unanimity,
      })),
      gateway_votes: gateway_votes.map((v) => ({
        id: v.id,
        gateway_id: v.gateway_id,
        user_id: v.user_id,
        vote: v.vote,
        feedback_text: v.feedback_text,
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        initiative_id: n.initiative_id,
        read: n.read,
        created_at: n.created_at.toISOString(),
      })),
      documents: documents.map((d) => ({
        id: d.id,
        initiative_id: d.initiative_id,
        document_type: d.document_type,
        file_path: d.file_path,
        stage: d.stage,
        ltp_period: d.ltp_period,
        generated_by: d.generated_by,
        created_at: d.created_at.toISOString(),
      })),
      file_uploads: [],
      audit_log: [],
      portfolio_events: portfolio_events.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        custom_type_label: e.custom_type_label,
        initiative_id: e.initiative_id,
        date: e.date.toISOString(),
        original_date: e.original_date?.toISOString() ?? null,
        status: e.status,
        invited_user_ids: e.invitations.map((i) => i.user_id),
        attendance: Object.fromEntries(
          e.attendance.map((a) => [a.user_id, a.status]),
        ),
        created_by: e.created_by,
        created_at: e.created_at.toISOString(),
      })),
      mesa_bloqueantes: mesa_bloqueantes.map((b) => ({
        id: b.id,
        initiative_id: b.initiative_id,
        name: b.name,
        involucrados: b.involucrados.map((i) => i.user_id),
        is_priority: b.is_priority,
        resolved: b.resolved,
        created_at: b.created_at.toISOString(),
        created_by: b.created_by,
      })),
      mesa_temas_pendientes: mesa_temas_pendientes.map((t) => ({
        id: t.id,
        initiative_id: t.initiative_id,
        text: t.text,
        done: t.done,
        created_at: t.created_at.toISOString(),
        created_by: t.created_by,
      })),
      mesa_brainstorm_notes: mesa_brainstorm_notes.map((n) => ({
        initiative_id: n.initiative_id,
        content: n.content,
        updated_at: n.updated_at.toISOString(),
        updated_by: n.updated_by,
      })),
      form_comments: [],
      gateway_extra_approvers: [],
      gateway_feedback_docs: [],
      gateway_decisions: [],
      gateway_inline_comments: [],
      gateway_minutas: [],
      gateway_revisions: [],
      initiative_area_changes: [],
    };

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Error al cargar datos" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
