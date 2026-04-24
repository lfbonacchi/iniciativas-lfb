import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSeedData } from "@/data/seed";

const DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://pae_admin:PaePortfolio2026!@pae-portfolio-instance.c3hpfgbwvxqr.sa-east-1.rds.amazonaws.com:5432/pae_portfolio?schema=public&sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL + "&connection_limit=1&connect_timeout=10" } },
});

export async function POST() {
  try {
    const seed = getSeedData();

    // Limpiar en orden correcto (FK constraints)
    await prisma.$transaction([
      prisma.auditLog.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.gatewayRevision.deleteMany(),
      prisma.gatewayDecisionPending.deleteMany(),
      prisma.gatewayInlineComment.deleteMany(),
      prisma.gatewayMinuta.deleteMany(),
      prisma.gatewayFeedbackDoc.deleteMany(),
      prisma.gatewayExtraApprover.deleteMany(),
      prisma.gatewayVote.deleteMany(),
      prisma.gateway.deleteMany(),
      prisma.formComment.deleteMany(),
      prisma.formSnapshot.deleteMany(),
      prisma.formChangeLog.deleteMany(),
      prisma.formResponse.deleteMany(),
      prisma.form.deleteMany(),
      prisma.formDefinition.deleteMany(),
      prisma.portfolioEventAttendance.deleteMany(),
      prisma.portfolioEventInvitee.deleteMany(),
      prisma.portfolioEvent.deleteMany(),
      prisma.mesaBrainstormNote.deleteMany(),
      prisma.mesaTemaPendiente.deleteMany(),
      prisma.mesaBloqueanteMember.deleteMany(),
      prisma.mesaBloqueante.deleteMany(),
      prisma.document.deleteMany(),
      prisma.fileUpload.deleteMany(),
      prisma.initiativeFolder.deleteMany(),
      prisma.initiativeMember.deleteMany(),
      prisma.initiativeAreaChange.deleteMany(),
      prisma.initiative.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Re-insertar seed data
    await prisma.user.createMany({
      data: seed.users.map((u) => ({
        id: u.id,
        azure_oid: u.azure_oid,
        email: u.email,
        display_name: u.display_name,
        job_title: u.job_title,
        department: u.department,
        vicepresidencia: u.vicepresidencia,
        global_role: u.global_role as "user" | "area_transformacion" | "admin",
        is_vp: u.is_vp,
      })),
    });

    await prisma.initiative.createMany({
      data: seed.initiatives.map((i) => ({
        id: i.id,
        name: i.name,
        current_stage: i.current_stage as "proposal" | "dimensioning" | "mvp" | "ltp_tracking",
        status: i.status as "in_progress" | "pending" | "paused" | "rejected" | "area_change",
        has_etapa1: i.has_etapa1,
        has_etapa2: i.has_etapa2,
        has_etapa3: i.has_etapa3,
        created_at: new Date(i.created_at),
      })),
    });

    for (const m of seed.initiative_members) {
      await prisma.initiativeMember.upsert({
        where: { user_id_initiative_id: { user_id: m.user_id, initiative_id: m.initiative_id } },
        create: {
          user_id: m.user_id,
          initiative_id: m.initiative_id,
          role: m.role as "promotor" | "ld" | "po" | "bo" | "sponsor" | "sm" | "equipo" | "afectado",
          can_edit: m.can_edit,
        },
        update: {},
      });
    }

    await prisma.form.createMany({
      data: seed.forms.map((f) => ({
        id: f.id,
        initiative_id: f.initiative_id,
        form_type: f.form_type as "F1" | "F2" | "F3" | "F4" | "F5",
        version: f.version,
        status: f.status as "draft" | "submitted" | "in_review" | "approved" | "final" | "reviewed" | "closed",
        ltp_period: f.ltp_period ?? null,
        created_by: f.created_by,
        created_at: new Date(f.created_at),
        updated_at: new Date(f.updated_at),
        submitted_at: f.submitted_at ? new Date(f.submitted_at) : null,
        approved_at: f.approved_at ? new Date(f.approved_at) : null,
      })),
    });

    const batchSize = 100;
    for (let i = 0; i < seed.form_responses.length; i += batchSize) {
      await prisma.formResponse.createMany({
        data: seed.form_responses.slice(i, i + batchSize).map((r) => ({
          id: r.id,
          form_id: r.form_id,
          field_key: r.field_key,
          value: r.value as object,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.gateway.createMany({
      data: seed.gateways.map((g) => ({
        id: g.id,
        form_id: g.form_id,
        initiative_id: g.initiative_id,
        gateway_number: g.gateway_number,
        status: g.status as "pending" | "approved" | "approved_with_changes" | "feedback" | "pause" | "reject" | "area_change",
        requires_unanimity: g.requires_unanimity,
      })),
    });

    await prisma.gatewayVote.createMany({
      data: seed.gateway_votes.map((v) => ({
        id: v.id,
        gateway_id: v.gateway_id,
        user_id: v.user_id,
        vote: v.vote as "approved" | "approved_with_changes" | "feedback" | "pause" | "reject" | "area_change",
        feedback_text: v.feedback_text ?? null,
      })),
      skipDuplicates: true,
    });

    await prisma.document.createMany({
      data: seed.documents.map((d) => ({
        id: d.id,
        initiative_id: d.initiative_id,
        document_type: d.document_type as "formulario_xlsx" | "formulario_pdf" | "vf_formulario_xlsx" | "vf_formulario_pdf" | "vf_presentacion_pptx" | "vf_nota_prensa_docx" | "minuta_gateway_docx" | "manual_upload",
        file_path: d.file_path,
        stage: d.stage as "proposal" | "dimensioning" | "mvp" | "ltp_tracking",
        ltp_period: d.ltp_period ?? null,
        generated_by: d.generated_by,
        created_at: new Date(d.created_at),
      })),
    });

    await prisma.notification.createMany({
      data: seed.notifications.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        type: n.type as "gateway_vote_pending" | "gateway_resolved" | "form_feedback_received" | "form_submitted" | "form_reviewed" | "initiative_paused" | "initiative_rejected" | "initiative_area_change" | "member_added" | "member_removed" | "document_generated" | "document_uploaded",
        title: n.title,
        message: n.message,
        initiative_id: n.initiative_id,
        read: n.read,
        created_at: new Date(n.created_at),
      })),
    });

    return NextResponse.json({ ok: true, message: "Base de datos reseteada a datos originales" });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Error al resetear la base de datos" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
