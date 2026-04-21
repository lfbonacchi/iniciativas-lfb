# frontend.md — Especificación de diseño y UX

> Guía de diseño para Claude Code. Define design tokens, componentes, estructura de cada pantalla y comportamientos UX.
> Los datos (usuarios, iniciativas, métricas) vienen del seed — NO se hardcodean acá.
> Stack: Next.js 15 + App Router + TypeScript + Tailwind CSS. Fase: frontend-first con localStorage.

---

## 1. Design System

### 1.1 Colores

| Token Tailwind | Hex | Uso |
|----------------|-----|-----|
| `pae-red` | `#C8102E` | Acciones urgentes, gates, alertas, rechazos, acciones pendientes |
| `pae-blue` | `#003DA5` | Navegación activa, etapas, campos nuevos (carry-over), botones primarios |
| `pae-green` | `#00843D` | Completado, aprobado, en progreso positivo, métricas positivas |
| `pae-amber` | `#F59E0B` | Warnings, estado pausa, pendientes amarillos |
| `pae-bg` | `#EBF0F7` | Fondo general (azul PAE al ~9% sobre blanco, tono azulado suave) |
| `pae-surface` | `#FFFFFF` | Cards, sidebar, header, modales |
| `pae-border` | `#DDDDDD` | Bordes de cards, inputs, separadores, líneas de tabla |
| `pae-text` | `#333333` | Texto primario — títulos, nombres, valores numéricos |
| `pae-text-secondary` | `#666666` | Texto secundario — descripciones, labels, roles |
| `pae-text-tertiary` | `#999999` | Texto terciario — placeholders, hints, metadata, timestamps |

NUNCA hardcodear hex — siempre usar tokens del theme de Tailwind.

Badges/pills: fondo = color al 8% de opacidad, texto = color sólido.

### 1.2 Tipografía

Familia: `Inter` (fallback: `-apple-system, BlinkMacSystemFont, sans-serif`).

| Nivel | Tamaño | Weight | Notas |
|-------|--------|--------|-------|
| Título de página | 20px | 600 | |
| Título de card/sección | 13–14px | 600 | |
| Body | 11–12px | 400 | |
| Labels de tabla | 9px | 600 | MAYÚSCULAS, letter-spacing 0.5px, `pae-text-tertiary` |
| Badges/pills | 10px | 500 | |
| Metadata | 9–10px | 400 | `pae-text-tertiary` |

### 1.3 Espaciado y radios

| Elemento | Valor |
|----------|-------|
| Header | 48px alto, fijo, z-index 100 |
| Sidebar | 200px ancho, colapsable en mobile |
| Cards | border-radius 10px, sombra `0 1px 3px rgba(0,0,0,0.06)` |
| Inputs | border-radius 8px, fondo `pae-bg`, borde `pae-border` |
| Botones primarios | border-radius 8px, fondo `pae-blue`, texto blanco |
| Badges/pills | border-radius 11px (full pill) |

### 1.4 Iconografía

Emojis para MVP: 🔔 📁 📄 📊 📎 📝 ✓ ⏳. No instalar librería de iconos pesada.

---

## 2. Componentes compartidos

### 2.1 `<AppShell>`

```
┌──────────────────────────────────────────────────────┐
│ HEADER (48px) — logo + pipeline + notif + avatar     │
├──────────┬───────────────────────────────────────────┤
│ SIDEBAR  │ CONTENIDO (flex-1)                        │
│ (200px)  │                                           │
└──────────┴───────────────────────────────────────────┘
```

Excepción: Wizard y Gateway → pantalla completa sin sidebar.

### 2.2 `<PipelineHeader>`

- **Izquierda:** Logo PAE (barra roja 4px + "PAE" bold + "Gestión de Portfolio")
- **Centro:** 4 chips clickeables — Propuesta › Dimensionamiento › MVP › Delivery. Click → tooltip. Dentro de iniciativa → etapa actual en azul con underline.
- **Derecha:** 🔔 con contador rojo + avatar con iniciales

### 2.3 `<Sidebar>`

Tres bloques con títulos MAYÚSCULAS (9px, weight 600, `pae-text-tertiary`, letter-spacing 0.8):

**ACCIONES:** "+ Nueva propuesta" (azul, solo PO/LD/AT) · "Subir documento" · "Aprob. pendientes N" (rojo, solo si tiene)

**NAVEGACIÓN:** Dashboards · Mis iniciativas · Gateways

Item activo: fondo `pae-blue/6%`, barra izquierda 3px, texto `pae-blue` weight 600.

**ESTADO:** Chips toggle — En progreso · Pendiente · Pausada · Rechazada · Cambio área

### 2.4 `<Badge>` — Pill con `label` y `color`. Fondo 8%, texto sólido.

### 2.5 `<InitiativeCard>`

Barra lateral color etapa (4px) · Nombre (14px) · Badges etapa + estado · Roles · 3 métricas en row · Acción pendiente (punto rojo + texto, si existe) · Botón "Ir a →"

La tercera métrica varía por iniciativa — viene del seed.

### 2.6 `<DataTable>` — Headers MAYÚSCULAS 9px. Filas 11px. Separador 1px. Hover `pae-bg`.

### 2.7 `<TabBar>` — Activo: `pae-blue` weight 600 + underline 3px. Inactivo: `pae-text-secondary`. Línea 1px debajo.

### 2.8 `<AddEventPopup>` — Modal: nombre, tipo (dropdown), iniciativa (dropdown), invitados (multi-select), botón Guardar.

---

## 3. Pantallas

### 3.0 Login — `pae_01`

Mock SSO (card con campos email/password) + Selector de rol (4 cards con barra de color, botón demo).

### 3.1 Mis iniciativas — `pae_02`

Búsqueda + filtros (Etapa ▼, VP ▼, Ordenar ▼) + tabs "Propias" / "Que me impactan" + grid 2col de `<InitiativeCard>`.

### 3.2 Dashboard AT — `pae_03`

KPIs row + distribución por etapa (barras) + corrientes de valor (barras) + ranking (tabla sorteable) + eventos (timeline) + agregar evento.

### 3.3 Dashboard VP — `pae_04`

Como AT pero filtrado por VP del usuario. Landing del VP. Corrientes cruzadas en tabla. "Tu voto" en gates.

### 3.4 Dashboard BO — `pae_05`

Sin "+ Nueva propuesta". KPIs + distribución + corrientes + ranking + eventos.

### 3.5 Dashboard PO — `pae_06`

Landing default = Mis iniciativas (no este dashboard). KPIs + ranking + eventos + popup agregar evento.

### 3.6 Nueva propuesta — `pae_07`

Input combo buscar/crear. Resultados existentes con "Abrir F[N]". Sección crear nueva con "Crear". Notas SharePoint.

### 3.7 Detalle — Tab Resumen (etapas 1-3) — `pae_08`

**Header detalle (compartido todos los tabs):** Breadcrumb · Título + badges · Roles · Botones PPTX/Nota prensa · Tabs (Mesa de trabajo 🔒 hasta etapa 4)

**Contenido:** Propósito · KPIs row · Corrientes 5 años (tabla) · Indicadores de impacto (col ACTUAL vacía en 1-2) · Desafíos/riesgos · Interdependencias

**▼ Solo VP/AT:** Objetivos vs iniciativas · Corrientes cruzadas · Vision House (placeholder) · Eventos

### 3.8 Detalle — Tab Resumen (etapa 4) — `pae_09`

Todo lo de 3.7 + col ACTUAL llena + Mesa desbloqueada + **bloques Delivery:** Entregables priorizados · Indicadores adopción/asertividad · Presupuesto OPEX/CAPEX

### 3.9 Mesa de trabajo (tab, etapa 4) — `pae_10`

KPIs target vs actual con trend · Barras de avance · Bloqueantes (tabla + popup agregar) · Brainstorm (notas) · Temas pendientes (checklist) · Placeholders post-MVP

### 3.10 Tab Eventos — `pae_11`

Gantt horizontal (meses, barras etapas, líneas gates, marcador Hoy) + historial + agregar evento.

### 3.11 Tab Equipo — `pae_12`

3 tablas: Equipo de trabajo (con INT/EXT, costo) · Alineación estratégica · Interesados. Botones agregar/sacar solo AT.

### 3.12 Tab Documentos — `pae_13`

Árbol de carpetas SharePoint. Distinción Auto/Manual con badge. Botón Regenerar en generados. Subir archivo.

### 3.13 Tab Formularios — `pae_14`

Tabs F1-F5 con estado. Info de completitud + secciones con estado/autor/fecha. Botones: Editar / Ya tengo arch. / XLSX.

### 3.14 F4 y F5 ciclos anuales — `pae_15`

F4 = Visión Anual, F5 = Planificación Anual (NO usar LTP_PLAN/LTP_REVIEW). Tabs por año. Anteriores read-only. Carry-over del año anterior. F5 synced con F4.

### 3.15 Wizard F1 — `pae_16`

Sin sidebar. Stepper vertical 9 secciones (✓ verde / N azul / N gris). Campos: textareas, tablas con "+ Agregar fila", dropdowns. Historial inline. Autoguardado. Barra fija: Previsualizar / Generar PPTX / Enviar a aprob. (disabled hasta 100%).

### 3.16 Wizard F2 carry-over — `pae_17`

Stepper 12 secciones con indicador Heredado/Nuevo. Leyenda: pill gris = Heredado F1, pill azul = Nuevo F2.

| Aspecto | Heredado | Nuevo |
|---------|----------|-------|
| Fondo | Gris claro | Blanco + borde azul |
| Badge | "Heredado F1" (gris) | "Nuevo" (azul) |
| Editable | Sí, al click | Sí, directo |

Warning: "⚠ Revisar y profundizar los textos heredados"

### 3.17 Aprobaciones + Gateway — `pae_18`

**Listado:** Cards de gateway con nombre, etapa, promotor, votos, fecha. Barra roja + "Tu voto pendiente" + "Ir al Gateway".

**Gateway (sin sidebar):** Breadcrumb ← · Header + badge estado · Panel votos (avatares con ✓/⏳) · Formulario read-only · Feedback por sección · 5 botones: Aprobar / Feedback / Pausa / Rechazar / Cambio área.

Prioridad: REJECT > PAUSE > AREA CHANGE > FEEDBACK > PENDING > APPROVED

---

## 4. Navegación por rol

| Elemento | PO/Promotor/LD | BO | VP | AT |
|----------|----------------|----|----|----|
| Landing | Mis iniciativas | Mis iniciativas | Dashboards | Dashboards |
| + Nueva propuesta | ✅ | ❌ | ✅ | ✅ |
| Gestión equipo | ❌ | ❌ | ❌ | ✅ |

**Camino B:** Muchas iniciativas no pasan por F1→F2→F3. Entran directo a F4. La UI debe soportar inicio en cualquier etapa.

---

## 5. Comportamientos UX

**Autoguardado:** on blur (debounce 1s) + cada 30s. Indicador verde. Badge % completitud. Navegación libre entre secciones. "Enviar a aprobación" disabled hasta 100%.

**Control de cambios:** Registro por campo (quién, cuándo, old→new). Inline en wizard. Tab Historial filtrable. En gateway: campos modificados resaltados con borde azul.

**Notificaciones MVP:** Badge en 🔔. Acción pendiente en cada card. Sin inbox. Sin emails.

**Responsive:** Desktop-first (+1024px). Sidebar colapsable. Cards 2col→1col. Tablas scroll horizontal. Stepper→dropdown en mobile.

---

## 6. Generación de documentos (browser-side)

| Tipo | Librería | Formato |
|------|----------|---------|
| PPTX | `pptxgenjs` | 16:9, colores PAE, Inter |
| XLSX | `SheetJS` | Tab por sección, headers azul PAE |
| PDF | `html2pdf.js` | Portada PAE + índice |
| DOCX | `docx` | Notas de prensa, minutas |

---

## 7. Wireframes

| Archivo | Pantalla |
|---------|----------|
| `pae_01` | Login + selector de rol |
| `pae_02` | Mis iniciativas |
| `pae_03` | Dashboard AT |
| `pae_04` | Dashboard VP |
| `pae_05` | Dashboard BO |
| `pae_06` | Dashboard PO |
| `pae_07` | Nueva propuesta |
| `pae_08` | Detalle Resumen (etapas 1-3) |
| `pae_09` | Detalle Resumen (etapa 4) |
| `pae_10` | Bloques extra + Mesa de trabajo |
| `pae_11` | Tab Eventos (Gantt) |
| `pae_12` | Tab Equipo |
| `pae_13` | Tab Documentos |
| `pae_14` | Tab Formularios (general) |
| `pae_15` | F4/F5 ciclos anuales |
| `pae_16` | Wizard F1 |
| `pae_17` | Wizard F2 carry-over |
| `pae_18` | Aprobaciones + Gateway |
| `pae_19` | Popup agregar evento |
