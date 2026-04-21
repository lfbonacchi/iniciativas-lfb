---
paths:
  - "src/lib/**"
  - "src/data/**"
  - "src/types/**"
  - "src/app/api/**"
---
# Modelo de datos y lógica de negocio — PAE

## Modelo de datos

15 tablas lógicas. En Fase 2-4 se modelan como objetos TypeScript en localStorage con la misma estructura. En Fase 5 se migran a PostgreSQL vía Prisma.

- **users** — id, azure_oid, email, display_name, job_title, department, vicepresidencia, global_role (user/area_transformacion/admin), is_vp (boolean)
- **initiatives** — id, name, current_stage (proposal/dimensioning/mvp/ltp_tracking), status, created_at, has_etapa1 (boolean), has_etapa2 (boolean), has_etapa3 (boolean)
- **initiative_members** — user_id, initiative_id, role (promotor/ld/po/bo/sponsor/sm/equipo), can_edit
- **form_definitions** — id, form_type (F1/F2/F3/F4/F5), version, sections_config (JSONB)
- **forms** — id, initiative_id, form_type, version, status (draft/submitted/in_review/approved/final/reviewed), ltp_period (string nullable, ej: '06-2026'), created_by, created_at, updated_at, submitted_at, approved_at
- **form_responses** — id, form_id, field_key, value (JSONB)
- **form_change_log** — id, form_id, field_key, old_value, new_value, changed_by, changed_at
- **form_snapshots** — id, form_id, snapshot_type (submitted/final), version_number, responses_data (JSONB), created_at
- **gateways** — id, form_id, initiative_id, gateway_number (1/2/3), status, requires_unanimity: true
- **gateway_votes** — id, gateway_id, user_id, vote (approved/feedback/pause/reject/area_change), feedback_text
- **notifications** — id, user_id, type, title, message, initiative_id, read, created_at
- **documents** — id, initiative_id, document_type, file_path, stage, ltp_period, generated_by, created_at
- **audit_log** — id, user_id, action, entity_type, entity_id, old_data, new_data, timestamp
- **initiative_folders** — id, initiative_id, folder_path, stage, ltp_period, created_at
- **file_uploads** — id, initiative_id, folder_id, file_name, file_type, file_size, uploaded_by, created_at

**Notas sobre el modelo:**
- `forms.status` incluye 'reviewed' para F4 y F5 (marcado por el sponsor, sin gateway formal).
- `forms.ltp_period` es null para F1/F2/F3 y tiene valor para F4/F5 (ej: '06-2026', '12-2026').
- `initiatives.current_stage` refleja la etapa actual. Iniciativas que entraron directo a LTP tienen has_etapa1/2/3 en false.
- Los gateways solo existen para F1, F2 y F3 (gateway_number 1, 2 y 3).

## Estructura de carpetas por iniciativa

Cada iniciativa tiene una estructura de carpetas para sus documentos. En Fase 2-4 se simula en localStorage como metadata. En Fase 5 se replica en SharePoint.

```
/Iniciativas/[Nombre de la iniciativa]/
  /Etapa 1/
    ETAPA_1_formulario.xlsx
    ETAPA_1_formulario.pdf
    Minuta_gateway_1.docx
    VFETAPA_1_formulario.xlsx
    VFETAPA_1_formulario.pdf
    Presentacion_1_VF.pptx
    Notadeprensa_1_VF.docx
    /archivos adicionales/
  /Etapa 2/
    (misma estructura que Etapa 1, con sufijo _2)
  /Etapa 3/
    (misma estructura que Etapa 1, con sufijo _3)
  /LTP y Seguimiento/
    /2025/
      /Junio/
        /Formulario 4 - Vision Anual/
          F4_vision_anual.xlsx
          F4_vision_anual.pdf
          VF_F4_vision_anual.xlsx
          VF_F4_vision_anual.pdf
          Presentacion_F4_VF.pptx
          Notadeprensa_F4_VF.docx
          /archivos adicionales/
        /Formulario 5 - Planificacion Anual/
          (misma estructura que F4)
      /Diciembre/
        (mismo esquema que Junio)
    /2026/
      (se repite la estructura año a año)
```

**Reglas de creación de carpetas:**
- La carpeta de una etapa solo se crea si la iniciativa tiene ese formulario completado.
- Muchas iniciativas existentes en PAE no tienen Etapa 1, 2 ni 3 — entraron directo a F4. Solo tienen la carpeta `/LTP y Seguimiento/`.
- La carpeta "archivos adicionales" guarda: versiones anteriores de documentos (antes de que la nueva versión los sobreescriba) y documentos que el usuario suba manualmente.

## Detalle de los 5 formularios

### Formulario 1 — Etapa 1: Propuesta (Gateway 1)
Describe el problema/oportunidad, el valor estratégico y la alineación con la compañía. 9 secciones: Info General, Propósito, Necesidad/oportunidad, Alineación estratégica, Descripción iniciativa, Impacto económico (corrientes de valor S/N), Gestión del cambio, Journey/hitos, Equipo (3 tablas: propuesta, gate, metodología). Al aprobarse en Gateway 1, se genera F1 VF y se habilita F2.

### Formulario 2 — Etapa 2: Dimensionamiento (Gateway 2)
Planifica factibilidad técnica, costos, equipo, riesgos e impacto económico. Hereda campos de F1 VF (carry-over). Agrega: Síntesis necesidad, Procesos as-is/to-be, Alternativas, Consideraciones digitales, Topología equipo, Gestión del cambio detallada, Costos OPEX/CAPEX, Corrientes de valor a 5 años con palancas de valor. Al aprobarse en Gateway 2, se genera F2 VF y se habilita F3.

### Formulario 3 — Etapa 3: MVP (Gateway 3)
Planifica y documenta el mínimo producto viable. Hereda campos de F2 VF (carry-over). Agrega: Descripción del MVP, Indicadores de medición, Resultados esperados vs obtenidos, Aprendizajes y bloqueantes, Conclusiones del MVP, Journey o próximos pasos, Conformación equipo Execute & Operate, Consideraciones digitales (tipo solución, desafíos, integración), Plan de gestión del cambio. Al aprobarse en Gateway 3, la iniciativa pasa a ejecución y se habilita F4.

### Formulario 4 — Visión Anual para LTP (sin gateway formal)
Define la visión del producto para el año siguiente. Se completa a mitad de año (típicamente junio). Es un documento de trabajo constante con seguimiento periódico, no un formulario que se llena una vez y se cierra. Hereda campos de F3 VF o del F4 del año anterior (carry-over inter-anual). Secciones: Info General, Propósito, Necesidad, Prioridades estratégicas del año, Descripción solución/entregables del año, Planificación implementación (equipo, alineación, interesados, consideraciones digitales, interdependencias, desafíos/riesgos, plan de acción, journey/hitos), Costos, Impacto económico. No tiene gateway: el sponsor marca "reviewed" con comentario. Se repite cada año (F4 junio 2026, F4 junio 2027...).

### Formulario 5 — Planificación Anual (sin gateway formal)
Complementa el F4 con entregables concretos e indicadores de seguimiento. Se completa después del F4 del mismo ciclo (típicamente diciembre). También es un documento de trabajo constante — los indicadores y estados de entregables se actualizan durante el año como parte del seguimiento. Hereda campos de F4 del mismo ciclo (carry-over). Agrega: Entregables del año con tabla de seguimiento (responsable, fecha plan, estado, avance), Indicadores de seguimiento (tipo, baseline, target, actual, trend). No tiene gateway: el sponsor marca "reviewed" con comentario. Se repite cada año.

## Gateways — detalle completo (solo F1, F2, F3)

Cada gateway requiere unanimidad de todos los aprobadores. 5 estados posibles para cada voto: approved, feedback, pause, reject, area_change.

Prioridad de resolución (de mayor a menor): reject > pause > area_change > feedback > pending > approved.

- **approved:** Si TODOS votaron approved → formulario pasa a Versión Final (VF), se generan documentos, se habilita el siguiente formulario con carry-over.
- **feedback:** Vuelve al editor. Ve feedback unificado, edita, re-envía. TODOS los votos se resetean a pending (ronda limpia).
- **pause:** Iniciativa en espera. Solo el Sponsor o Área Transformación pueden reactivar.
- **reject:** Iniciativa cerrada (queda en historial, no se borra).
- **area_change:** Re-asigna BO y/o Sponsor. Sigue en gateway.

### Minuta y versión final post-reunión

Después de la reunión de aprobación (gateway), se puede draftear una minuta del gateway (Minuta_gateway_N.docx). Independientemente del resultado formal del gateway, el PO o encargado puede draftear la versión final del formulario y subirla. En ese caso:
- El archivo se guarda como VF (versión final) en la carpeta de la etapa.
- Si no existe un archivo con nombre VF en la carpeta, se toma el último archivo disponible como versión vigente.

## F4 y F5 — Ciclo anual (sin gateway)

F4 y F5 no tienen gateway formal. Su flujo de estados es: draft → submitted → reviewed → closed.

- El sponsor marca "reviewed" con un comentario. No hay unanimidad ni votación múltiple.
- Se repiten cada año: F4 junio 2026, F5 diciembre 2026, F4 junio 2027, F5 diciembre 2027...
- Cada instancia es independiente (no se pisan entre sí).
- Son documentos de trabajo vivo — se actualizan periódicamente como parte del seguimiento.

## Carry-over entre formularios

El carry-over copia campos del formulario anterior VF al siguiente formulario como punto de partida. Los campos heredados aparecen con fondo gris y badge "Heredado de [origen]". Son editables.

| Origen | Destino | Condición |
|---|---|---|
| F1 VF | F2 | Gateway 1 aprobado |
| F2 VF | F3 | Gateway 2 aprobado |
| F3 VF | F4 (primer ciclo) | Gateway 3 aprobado |
| F4 año N | F5 mismo año | F4 marcado como reviewed |
| F4 año N | F4 año N+1 | Inicio de nuevo ciclo anual |
| F5 año N | F5 año N+1 | Inicio de nuevo ciclo anual (hereda para comparar planificado vs real) |

## Seed data y mock auth

Los datos de ejemplo y los usuarios mock se definen en: **PAE_Seed_Data_Completo.md** (documento del proyecto).

El seed incluye:
- 8 iniciativas de ejemplo con datos verosímiles de Oil & Gas, cada una en una etapa distinta del ciclo de vida.
- Usuarios mock con distintos roles para demostrar todas las vistas en la demo al VP.
- El seed se carga en localStorage la primera vez que se abre la app (si no hay datos previos).

El mock auth permite seleccionar un usuario al inicio sin password. Cada usuario ve un subconjunto distinto de iniciativas según su rol.

## Stack Fase 5 (futura — no usar hasta indicación)

| Componente | Tecnología |
|---|---|
| Backend / API | Next.js API Routes (Node.js runtime) |
| Base de datos | PostgreSQL 16 vía Prisma ORM |
| Autenticación | Auth.js (next-auth) con provider Microsoft Entra ID |
| Integración SharePoint | Microsoft Graph API v1.0 (SDK para Node.js) |
| Generación PPTX | pptxgenjs (server-side) |
| Generación XLSX | ExcelJS (server-side) |
| Generación PDF | Puppeteer (render HTML a PDF, server-side) |
| Generación DOCX | docx (librería Node.js) |
| Notificaciones | In-app con polling cada 30s |
| Containerización | Docker + Docker Compose |

Comandos Fase 5:
```bash
docker compose up -d          # Levantar PostgreSQL
npx prisma db push            # Aplicar cambios del schema a la DB
npx prisma studio             # Ver y editar datos en browser
npx prisma db seed            # Cargar datos de prueba
npx prisma generate           # Regenerar el cliente Prisma después de cambios
```
