-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('user', 'area_transformacion', 'admin');

-- CreateEnum
CREATE TYPE "InitiativeStage" AS ENUM ('proposal', 'dimensioning', 'mvp', 'ltp_tracking');

-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('in_progress', 'pending', 'paused', 'rejected', 'area_change');

-- CreateEnum
CREATE TYPE "InitiativeMemberRole" AS ENUM ('promotor', 'ld', 'po', 'bo', 'sponsor', 'sm', 'equipo', 'afectado');

-- CreateEnum
CREATE TYPE "MemberAccessLevel" AS ENUM ('edit', 'comment', 'view');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('F1', 'F2', 'F3', 'F4', 'F5');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'final', 'reviewed', 'closed');

-- CreateEnum
CREATE TYPE "FormSnapshotType" AS ENUM ('submitted', 'final');

-- CreateEnum
CREATE TYPE "GatewayNumber" AS ENUM ('G1', 'G2', 'G3');

-- CreateEnum
CREATE TYPE "GatewayStatus" AS ENUM ('pending', 'approved', 'approved_with_changes', 'feedback', 'pause', 'reject', 'area_change');

-- CreateEnum
CREATE TYPE "GatewayVoteValue" AS ENUM ('approved', 'approved_with_changes', 'feedback', 'pause', 'reject', 'area_change');

-- CreateEnum
CREATE TYPE "InlineCommentStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('formulario_xlsx', 'formulario_pdf', 'vf_formulario_xlsx', 'vf_formulario_pdf', 'vf_presentacion_pptx', 'vf_nota_prensa_docx', 'minuta_gateway_docx', 'manual_upload');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('docx', 'xlsx', 'pdf', 'pptx', 'png', 'jpg', 'mp4');

-- CreateEnum
CREATE TYPE "PortfolioEventType" AS ENUM ('gate', 'sprint_review', 'seg_q', 'seg_mensual', 'ltp_plan', 'entrega', 'otro');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('yes', 'no');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('scheduled', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('gateway_vote_pending', 'gateway_resolved', 'form_feedback_received', 'form_submitted', 'form_reviewed', 'initiative_paused', 'initiative_rejected', 'initiative_area_change', 'member_added', 'member_removed', 'document_generated', 'document_uploaded');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('initiative_created', 'initiative_imported', 'initiative_deleted', 'initiative_stage_changed', 'initiative_status_changed', 'initiative_member_added', 'initiative_member_removed', 'initiative_member_role_changed', 'form_created', 'form_submitted', 'form_approved', 'form_reviewed', 'form_response_changed', 'form_snapshot_created', 'form_access_granted', 'form_edit_access_revoked', 'gateway_vote_cast', 'gateway_resolved', 'gateway_approver_added', 'gateway_approver_removed', 'gateway_feedback_doc_created', 'gateway_inline_comments_published', 'gateway_minuta_saved', 'gateway_resubmitted', 'initiative_area_changed', 'initiative_affected_added', 'document_uploaded', 'document_generated', 'document_downloaded', 'document_moved', 'document_deleted', 'file_uploaded', 'file_downloaded', 'file_moved', 'file_deleted', 'memory_cleared', 'event_created', 'event_attendance_set', 'event_rescheduled', 'event_cancelled', 'event_materialized');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('initiative', 'initiative_member', 'form', 'form_response', 'gateway', 'gateway_vote', 'document', 'file_upload', 'portfolio_event');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "azure_oid" TEXT,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "vicepresidencia" TEXT NOT NULL,
    "global_role" "GlobalRole" NOT NULL DEFAULT 'user',
    "is_vp" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiatives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "current_stage" "InitiativeStage" NOT NULL DEFAULT 'proposal',
    "status" "InitiativeStatus" NOT NULL DEFAULT 'in_progress',
    "has_etapa1" BOOLEAN NOT NULL DEFAULT false,
    "has_etapa2" BOOLEAN NOT NULL DEFAULT false,
    "has_etapa3" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "initiatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiative_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "role" "InitiativeMemberRole" NOT NULL,
    "can_edit" BOOLEAN NOT NULL DEFAULT true,
    "access_level" "MemberAccessLevel",

    CONSTRAINT "initiative_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiative_folders" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "folder_path" TEXT NOT NULL,
    "stage" "InitiativeStage" NOT NULL,
    "ltp_period" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "initiative_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiative_area_changes" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "from_vp" TEXT,
    "to_vp" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "initiative_area_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_definitions" (
    "id" TEXT NOT NULL,
    "form_type" "FormType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sections_config" JSONB NOT NULL,

    CONSTRAINT "form_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "form_type" "FormType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "FormStatus" NOT NULL DEFAULT 'draft',
    "ltp_period" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_change_log" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_snapshots" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "snapshot_type" "FormSnapshotType" NOT NULL,
    "version_number" INTEGER NOT NULL,
    "responses_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_comments" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateways" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "gateway_number" INTEGER NOT NULL,
    "status" "GatewayStatus" NOT NULL DEFAULT 'pending',
    "requires_unanimity" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_votes" (
    "id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vote" "GatewayVoteValue" NOT NULL,
    "feedback_text" TEXT,

    CONSTRAINT "gateway_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_extra_approvers" (
    "id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "added_by" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_extra_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_feedback_docs" (
    "id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_feedback_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_inline_comments" (
    "id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "InlineCommentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "gateway_inline_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_minutas" (
    "id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deadline_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_minutas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_decisions_pending" (
    "id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vote" "GatewayVoteValue" NOT NULL,
    "feedback_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_decisions_pending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_revisions" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "gateway_number" INTEGER NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "stage" "InitiativeStage" NOT NULL,
    "ltp_period" TEXT,
    "generated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_data_url" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PortfolioEventType" NOT NULL,
    "custom_type_label" TEXT,
    "initiative_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "original_date" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'scheduled',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_event_invitees" (
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "portfolio_event_invitees_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "portfolio_event_attendance" (
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,

    CONSTRAINT "portfolio_event_attendance_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "mesa_bloqueantes" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_priority" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "mesa_bloqueantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesa_bloqueante_members" (
    "bloqueante_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "mesa_bloqueante_members_pkey" PRIMARY KEY ("bloqueante_id","user_id")
);

-- CreateTable
CREATE TABLE "mesa_temas_pendientes" (
    "id" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "mesa_temas_pendientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesa_brainstorm_notes" (
    "initiative_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "mesa_brainstorm_notes_pkey" PRIMARY KEY ("initiative_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "initiative_id" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" "AuditEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiative_id" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_azure_oid_key" ON "users"("azure_oid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "initiative_members_user_id_initiative_id_key" ON "initiative_members"("user_id", "initiative_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_definitions_form_type_key" ON "form_definitions"("form_type");

-- CreateIndex
CREATE UNIQUE INDEX "form_responses_form_id_field_key_key" ON "form_responses"("form_id", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "gateways_form_id_key" ON "gateways"("form_id");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_votes_gateway_id_user_id_key" ON "gateway_votes"("gateway_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_extra_approvers_gateway_id_user_id_key" ON "gateway_extra_approvers"("gateway_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_inline_comments_gateway_id_user_id_section_key_fiel_key" ON "gateway_inline_comments"("gateway_id", "user_id", "section_key", "field_key");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_initiative_id_idx" ON "audit_log"("initiative_id");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- AddForeignKey
ALTER TABLE "initiative_members" ADD CONSTRAINT "initiative_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_members" ADD CONSTRAINT "initiative_members_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_folders" ADD CONSTRAINT "initiative_folders_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_area_changes" ADD CONSTRAINT "initiative_area_changes_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiative_area_changes" ADD CONSTRAINT "initiative_area_changes_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_change_log" ADD CONSTRAINT "form_change_log_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_change_log" ADD CONSTRAINT "form_change_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_snapshots" ADD CONSTRAINT "form_snapshots_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_comments" ADD CONSTRAINT "form_comments_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_comments" ADD CONSTRAINT "form_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateways" ADD CONSTRAINT "gateways_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateways" ADD CONSTRAINT "gateways_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_votes" ADD CONSTRAINT "gateway_votes_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_votes" ADD CONSTRAINT "gateway_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_extra_approvers" ADD CONSTRAINT "gateway_extra_approvers_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_extra_approvers" ADD CONSTRAINT "gateway_extra_approvers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_extra_approvers" ADD CONSTRAINT "gateway_extra_approvers_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_feedback_docs" ADD CONSTRAINT "gateway_feedback_docs_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_feedback_docs" ADD CONSTRAINT "gateway_feedback_docs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_inline_comments" ADD CONSTRAINT "gateway_inline_comments_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_inline_comments" ADD CONSTRAINT "gateway_inline_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_minutas" ADD CONSTRAINT "gateway_minutas_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_minutas" ADD CONSTRAINT "gateway_minutas_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_minutas" ADD CONSTRAINT "gateway_minutas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_decisions_pending" ADD CONSTRAINT "gateway_decisions_pending_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_decisions_pending" ADD CONSTRAINT "gateway_decisions_pending_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_revisions" ADD CONSTRAINT "gateway_revisions_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_revisions" ADD CONSTRAINT "gateway_revisions_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "initiative_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_events" ADD CONSTRAINT "portfolio_events_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_events" ADD CONSTRAINT "portfolio_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_event_invitees" ADD CONSTRAINT "portfolio_event_invitees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "portfolio_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_event_attendance" ADD CONSTRAINT "portfolio_event_attendance_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "portfolio_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_bloqueantes" ADD CONSTRAINT "mesa_bloqueantes_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_bloqueantes" ADD CONSTRAINT "mesa_bloqueantes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_bloqueante_members" ADD CONSTRAINT "mesa_bloqueante_members_bloqueante_id_fkey" FOREIGN KEY ("bloqueante_id") REFERENCES "mesa_bloqueantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_temas_pendientes" ADD CONSTRAINT "mesa_temas_pendientes_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_temas_pendientes" ADD CONSTRAINT "mesa_temas_pendientes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_brainstorm_notes" ADD CONSTRAINT "mesa_brainstorm_notes_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa_brainstorm_notes" ADD CONSTRAINT "mesa_brainstorm_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

