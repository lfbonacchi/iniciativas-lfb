// Completa la seed: para cada (form, sección) que no tiene respuesta cargada
// manualmente, genera un valor placeholder shape-aware con contenido
// iniciativa-aware. Objetivo: que cualquier gateway/wizard/preview de
// cualquier formulario muestre datos consistentes.
//
// No pisa datos existentes. Solo llena huecos.

import { F1_SECTIONS } from "./form_definitions/f1";
import { F2_SECTIONS } from "./form_definitions/f2";
import { F3_SECTIONS } from "./form_definitions/f3";
import { F4_SECTIONS } from "./form_definitions/f4";
import { F5_SECTIONS } from "./form_definitions/f5";
import type { WizardSection } from "./form_definitions/_shared";
import type {
  Form,
  FormFieldValue,
  FormResponse,
  FormType,
  Id,
  Initiative,
} from "@/types";

const SECTIONS_BY_TYPE: Record<FormType, readonly WizardSection[]> = {
  F1: F1_SECTIONS,
  F2: F2_SECTIONS,
  F3: F3_SECTIONS,
  F4: F4_SECTIONS,
  F5: F5_SECTIONS,
};

function newId(prefix: string): string {
  // ID determinístico para el filler (evita diff ruidoso en localStorage).
  return `${prefix}-fill-${Math.random().toString(36).slice(2, 10)}`;
}

// Pools de texto plausible reutilizable según la sección.
function placeholderString(
  initiative: Initiative | undefined,
  section: WizardSection,
): string {
  const name = initiative?.name ?? "la iniciativa";
  const k = section.key.toLowerCase();
  if (k.includes("proposito")) {
    return `Para los usuarios afectados por ${name}, la iniciativa apunta a mejorar eficiencia operacional mediante digitalización del proceso, con foco en reducir tiempos de ciclo, minimizar errores y aumentar visibilidad del estado en tiempo real.`;
  }
  if (k.includes("alineacion") || k.includes("alineación")) {
    return `La iniciativa se alinea con el pilar de transformación digital de PAE y con los objetivos de excelencia operacional. Contribuye directamente a los KPIs de productividad y confiabilidad operativa.`;
  }
  if (k.includes("necesidad")) {
    return `El proceso actual depende de registros manuales y revisiones periódicas, lo que introduce latencia y riesgo de inconsistencia. ${name} resuelve estas brechas con una solución digital integrada.`;
  }
  if (k.includes("sintesis") || k.includes("síntesis")) {
    return `Existe una brecha clara entre la capacidad actual y el estándar requerido. La solución propuesta cubre esa brecha con impacto medible en el corto plazo.`;
  }
  if (k.includes("conclus")) {
    return `El MVP/piloto demostró viabilidad técnica y económica. Se recomienda avanzar a rollout con los ajustes identificados en los aprendizajes.`;
  }
  if (k.includes("cambio") || k.includes("gestion_cambio")) {
    return `Plan de gestión del cambio con comunicación a usuarios clave, capacitación en dos etapas y acompañamiento de los líderes funcionales durante los primeros 3 meses post go-live.`;
  }
  return `Información cargada como referencia para ${name} — sección ${section.title}.`;
}

function rowsStakeholder(initiativeName: string): Record<string, string>[] {
  return [
    {
      stakeholder: "Operadores de planta",
      dolor:
        "Carga manual de datos en planillas sueltas, sin trazabilidad de cambios",
      metrica: "Tiempo de carga por turno",
      dato_inicio: "45 min",
      target: "10 min",
      prioridad: "Alta",
    },
    {
      stakeholder: "Supervisores",
      dolor:
        "No hay visibilidad en tiempo real del estado de los equipos e indicadores clave",
      metrica: "Latencia de información",
      dato_inicio: "24 hs",
      target: "<1 hs",
      prioridad: "Alta",
    },
    {
      stakeholder: "Management",
      dolor: `Falta de tablero consolidado para ${initiativeName}`,
      metrica: "Reportes manuales por mes",
      dato_inicio: "12",
      target: "0",
      prioridad: "Media",
    },
  ];
}

function rowsCorrientes(): Record<string, string>[] {
  return [
    {
      corriente: "OPEX",
      con_impacto: "Sí",
      detalle: "Reducción de HH en tareas manuales y reprocesos",
    },
    {
      corriente: "CAPEX",
      con_impacto: "No",
      detalle: "Sin impacto de capital en esta iniciativa",
    },
    {
      corriente: "PRODUCTIVIDAD",
      con_impacto: "Sí",
      detalle: "Aumento de output por turno por menor tiempo de parada",
    },
    {
      corriente: "SEGURIDAD",
      con_impacto: "Sí",
      detalle: "Menor intervención manual en zonas de riesgo",
    },
    {
      corriente: "CONFIABILIDAD",
      con_impacto: "Sí",
      detalle: "Mejor detección temprana de desvíos",
    },
  ];
}

function rowsJourney(): Record<string, string>[] {
  return [
    { hito: "Kick-off y diseño funcional", fecha: "Mes 1" },
    { hito: "Desarrollo piloto", fecha: "Mes 2-3" },
    { hito: "Despliegue MVP", fecha: "Mes 4" },
    { hito: "Escalamiento", fecha: "Mes 5-6" },
    { hito: "Cierre y transición a operación", fecha: "Mes 7" },
  ];
}

function rowsParticipacion(): Record<string, string>[] {
  return [
    { area: "Operaciones", tipo: "Responsable operativo" },
    { area: "Mantenimiento", tipo: "Consultado" },
    { area: "IT", tipo: "Implementador" },
    { area: "Seguridad industrial", tipo: "Informado" },
  ];
}

function rowsEquipo(): Record<string, string>[] {
  return [
    {
      rol: "Product Owner",
      nombre: "Por definir",
      posicion: "PO",
      vp: "VP Operaciones",
      area: "Transformación",
      asignacion: "60%",
    },
    {
      rol: "Líder de Dimensión",
      nombre: "Por definir",
      posicion: "LD",
      vp: "VP Operaciones",
      area: "Transformación",
      asignacion: "40%",
    },
    {
      rol: "Scrum Master",
      nombre: "Por definir",
      posicion: "SM",
      vp: "VP Transformación",
      area: "Transformación",
      asignacion: "30%",
    },
    {
      rol: "Data Engineer",
      nombre: "Externo (consultoría)",
      posicion: "DE",
      vp: "VP Transformación",
      area: "IT",
      asignacion: "100%",
    },
  ];
}

function rowsIndicadores(): Record<string, string>[] {
  return [
    {
      indicador: "Disponibilidad del sistema",
      tipo: "Adopción",
      baseline: "N/A",
      target: ">99%",
      resultado: "99.4%",
    },
    {
      indicador: "Tiempo de respuesta",
      tipo: "Asertividad",
      baseline: "N/A",
      target: "<2s",
      resultado: "1.2s",
    },
    {
      indicador: "Usuarios activos / semana",
      tipo: "Adopción",
      baseline: "0",
      target: "40",
      resultado: "35",
    },
    {
      indicador: "Incidentes reportados",
      tipo: "Resultado",
      baseline: "N/A",
      target: "<5/mes",
      resultado: "2/mes",
    },
  ];
}

function rowsEntregables(): Record<string, string>[] {
  return [
    {
      entregable: "Módulo de ingesta",
      responsable: "Equipo dev",
      fecha_plan: "Jun 2026",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Dashboard operacional",
      responsable: "Equipo dev",
      fecha_plan: "Ago 2026",
      estado: "En progreso",
      avance: "65%",
    },
    {
      entregable: "Integración ERP",
      responsable: "IT",
      fecha_plan: "Oct 2026",
      estado: "Planificado",
      avance: "0%",
    },
    {
      entregable: "Capacitación usuarios",
      responsable: "PO + RRHH",
      fecha_plan: "Nov 2026",
      estado: "Planificado",
      avance: "0%",
    },
  ];
}

function placeholderForTable(section: WizardSection): Record<string, string>[] {
  const k = section.key.toLowerCase();
  if (k.includes("stakeholder") || k.includes("necesidad"))
    return rowsStakeholder("");
  if (k.includes("corriente") || k.includes("impacto_economico"))
    return rowsCorrientes();
  if (k.includes("journey") || k.includes("hito")) return rowsJourney();
  if (k.includes("participacion") || k.includes("participación"))
    return rowsParticipacion();
  if (k.includes("equipo")) return rowsEquipo();
  if (k.includes("indicador")) return rowsIndicadores();
  if (k.includes("entregable")) return rowsEntregables();
  // Default: fila genérica de 2 columnas basadas en las keys de columna.
  return [];
}

function placeholderForObjectFields(
  section: WizardSection,
  initiative: Initiative | undefined,
): Record<string, string> {
  if (section.shape !== "object" && section.shape !== "object_with_table") {
    return {};
  }
  const obj: Record<string, string> = {};
  for (const f of section.fields) {
    const key = f.key.toLowerCase();
    if (key === "nombre" && initiative) {
      obj[f.key] = initiative.name;
    } else if (key.includes("estrategia") || key.includes("beneficio")) {
      obj[f.key] =
        "Alineación con la estrategia de transformación digital; beneficios directos en eficiencia operacional, visibilidad y reducción de riesgos.";
    } else if (key.includes("alcance")) {
      obj[f.key] =
        "Implementación inicial en una planta piloto, con escalamiento posterior a las unidades restantes. Cobertura funcional: captura de datos, visualización y alertas.";
    } else if (key.includes("interdepend")) {
      obj[f.key] =
        "Depende de la plataforma de datos centralizada y del servicio de autenticación corporativo. Integraciones previstas con ERP y sistema de mantenimiento.";
    } else if (key.includes("escalab")) {
      obj[f.key] =
        "Arquitectura cloud-native que permite escalar horizontalmente según carga. Modelo de datos multi-tenant preparado para onboarding de nuevas unidades.";
    } else if (key.includes("desafios") || key.includes("desafíos")) {
      obj[f.key] =
        "Resistencia inicial al cambio, aprendizaje de nuevas herramientas y coordinación entre áreas. Mitigamos con plan de comunicación y champions locales.";
    } else if (key.includes("arquitect")) {
      obj[f.key] =
        "Arquitectura de microservicios con bus de eventos, capa de persistencia en PostgreSQL y frontend SPA. Integración vía APIs REST.";
    } else if (key.includes("capex") || key.includes("costos")) {
      obj[f.key] =
        "CAPEX: USD 180K (desarrollo, integración, hardware). OPEX: USD 30K/año (licencias, soporte).";
    } else if (key.includes("opex")) {
      obj[f.key] = "USD 30K/año en licencias, mantenimiento y soporte.";
    } else if (key.includes("roles") || key.includes("conocim")) {
      obj[f.key] =
        "Equipo core multidisciplinario: PO con conocimiento del negocio, LD técnico, Scrum, 2 devs full-stack, 1 data engineer.";
    } else if (key.includes("eficiencia") || key.includes("estructur")) {
      obj[f.key] =
        "Equipo dimensionado para delivery continuo con ceremonias Scrum semanales. 70% asignación promedio, con foco en autonomía y ownership.";
    } else if (key.includes("tipo")) {
      obj[f.key] = "Transformación";
    } else if (key.includes("unidad") || key.includes("dimension")) {
      obj[f.key] = "Transformación";
    } else if (key.includes("areas") || key.includes("áreas")) {
      obj[f.key] = "Operaciones, IT, Transformación Digital";
    } else {
      obj[f.key] = placeholderString(initiative, section);
    }
  }
  return obj;
}

function buildValueForSection(
  section: WizardSection,
  initiative: Initiative | undefined,
): FormFieldValue {
  if (section.shape === "string") {
    return placeholderString(initiative, section);
  }
  if (section.shape === "object") {
    return placeholderForObjectFields(section, initiative) as FormFieldValue;
  }
  if (section.shape === "array_rows") {
    const rows = placeholderForTable(section);
    if (rows.length === 0) {
      // Fila por default con las columnas de la sección.
      const r: Record<string, string> = {};
      for (const c of section.columns) r[c.key] = "—";
      return [r] as FormFieldValue;
    }
    return rows as FormFieldValue;
  }
  if (section.shape === "multi_table") {
    const obj: Record<string, unknown> = {};
    for (const t of section.tables) {
      obj[t.key] = rowsEquipo().slice(0, 2);
    }
    return obj as FormFieldValue;
  }
  if (section.shape === "object_with_table") {
    const obj = placeholderForObjectFields(section, initiative) as Record<
      string,
      unknown
    >;
    obj[section.table.key] = placeholderForTable(section);
    return obj as FormFieldValue;
  }
  if (section.shape === "multi_block") {
    const obj: Record<string, unknown> = {};
    for (const b of section.blocks) {
      if (b.type === "text") {
        obj[b.key] = placeholderString(initiative, section);
      } else {
        obj[b.key] = placeholderForTable(section);
      }
    }
    return obj as FormFieldValue;
  }
  return null;
}

// Devuelve las respuestas faltantes para todos los forms. No pisa existentes.
export function generateMissingResponses(
  forms: readonly Form[],
  initiatives: readonly Initiative[],
  existing: readonly FormResponse[],
): FormResponse[] {
  const iniById = new Map<Id, Initiative>();
  for (const i of initiatives) iniById.set(i.id, i);

  // Index: (form_id -> Set<field_key>) que ya existen en el seed
  const byForm = new Map<Id, Set<string>>();
  for (const r of existing) {
    const set = byForm.get(r.form_id) ?? new Set<string>();
    set.add(r.field_key);
    byForm.set(r.form_id, set);
  }

  const out: FormResponse[] = [];
  for (const form of forms) {
    const sections = SECTIONS_BY_TYPE[form.form_type];
    if (!sections) continue;
    const filled = byForm.get(form.id) ?? new Set<string>();
    const initiative = iniById.get(form.initiative_id);
    for (const section of sections) {
      // Si ya hay una respuesta con la section.key exacta, skip.
      if (filled.has(section.key)) continue;
      // Si ya existe una respuesta "equivalente" (match por prefijo/contains
      // usado por el normalizer del gateway), también skip para no duplicar
      // contenido real en el seed.
      if (hasEquivalentResponse(section, filled)) continue;

      const value = buildValueForSection(section, initiative);
      if (value === null) continue;
      out.push({
        id: newId("resp"),
        form_id: form.id,
        field_key: section.key,
        value,
      });
    }
  }
  return out;
}

function hasEquivalentResponse(
  section: WizardSection,
  existingKeys: Set<string>,
): boolean {
  const target = section.key.toLowerCase();
  const clean = target.replace(/^seccion_\d+_?/i, "");
  for (const k of existingKeys) {
    const kl = k.toLowerCase();
    if (kl === clean) return true;
    if (kl.startsWith(clean + "_")) return true;
    if (clean.length >= 4 && kl.endsWith("_" + clean)) return true;
  }
  return false;
}
