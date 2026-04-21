# Plataforma de Gestión de Portfolio — Pan American Energy

## Qué es este proyecto

Aplicación web interna para PAE que centraliza la propuesta, evaluación, aprobación, desarrollo y seguimiento de todas las iniciativas de transformación digital de la compañía. Reemplaza el proceso actual basado en documentos Word sueltos, emails y reuniones sin registro estandarizado.

- **Usuarios:** ~200 empleados internos PAE
- **Idioma de la app:** Español (toda la interfaz, mensajes de error, labels, botones)
- **Acceso:** Solo red interna PAE o VPN. Nada expuesto a internet público.

## Fase actual: Frontend-first (Fase 2-4)

El frontend es completamente funcional: los datos persisten en localStorage, los documentos se generan y descargan en el browser. No hay backend, no hay base de datos, no hay Docker. En Fase 5 (futura) se migra a PostgreSQL vía Prisma, SSO con Entra ID, SharePoint y AWS.

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 15+ con App Router, TypeScript estricto, Tailwind CSS |
| Persistencia | localStorage (estructura de objetos que replica el modelo de datos) |
| Autenticación | Mock auth: selector de usuario sin password (ver PAE_Seed_Data_Completo.md) |
| Generación PPTX | pptxgenjs (browser-side) |
| Generación XLSX | SheetJS (browser-side) |
| Generación PDF | html2pdf.js o equivalente (browser-side) |
| Generación DOCX | docx (librería JS, browser-side — para notas de prensa y minutas) |
| Notificaciones | In-app con datos en localStorage |

**Un solo lenguaje:** Todo es TypeScript.

## Estructura de carpetas del código

```
src/
  app/            → Rutas Next.js (App Router). Cada carpeta = una ruta.
    (auth)/       → Páginas de login / selector de usuario mock
    dashboard/    → Dashboards por rol
    initiatives/  → Detalle de iniciativas, wizard, gateway
  components/     → Componentes UI reutilizables (botones, cards, stepper, etc.)
  lib/            → Utilidades, helpers, servicios de localStorage, auth mock
    storage/      → Capa de abstracción sobre localStorage (se reemplaza por Prisma en Fase 5)
  data/           → Seed data: definiciones de formularios, iniciativas de ejemplo, usuarios mock
  types/          → Interfaces TypeScript (User, Initiative, Form, Gateway, etc.)
docs/
  formularios-referencia/  → Los 5 Word originales de PAE (fuente de verdad para campos)
```

## Brandbook PAE — Colores y tipografía

SIEMPRE usar estos colores del theme de Tailwind. Nunca colores arbitrarios.

- **Rojo PAE** `#C8102E` — acciones urgentes, alertas, gates, rechazos
- **Azul PAE** `#003DA5` — navegación activa, etapas, campos nuevos, links
- **Verde PAE** `#00843D` — completado, aprobado, progreso positivo
- **Fondo general** `#EBF0F7` — azul PAE al ~9% de opacidad sobre blanco (tono azulado suave, no gris puro)
- **Fondo cards/sidebar** `#FFFFFF`
- **Texto primario** `#333333`
- **Texto secundario** `#666666`
- **Texto terciario/placeholder** `#999999`
- **Bordes** `#DDDDDD`
- **Tipografía:** Inter (fallback web de Flama). Ya configurado en Tailwind.

**Principio de diseño:** Gráficos claros tipo PMO pero entendibles para VPs. Profesional y limpio, sin decoración innecesaria pero con todos los indicadores de valor visibles. Fácil e intuitiva de usar. Espacio blanco generoso — claridad sobre densidad.

## Los 5 formularios

3 etapas secuenciales con gateway formal + 2 ciclos anuales sin gateway:

- **F1 — Propuesta (Gateway 1):** Problema/oportunidad, valor estratégico, alineación. 9 secciones. Al aprobarse → F1 VF → habilita F2.
- **F2 — Dimensionamiento (Gateway 2):** Factibilidad técnica, costos, equipo, riesgos. Hereda de F1 VF. Al aprobarse → F2 VF → habilita F3.
- **F3 — MVP (Gateway 3):** Planifica y documenta el MVP, resultados vs esperados. Hereda de F2 VF. Al aprobarse → F3 VF → habilita F4.
- **F4 — Visión Anual (sin gateway):** Visión del producto para el año siguiente. Trabajo constante con seguimiento. Hereda de F3 VF o F4 del año anterior. Sponsor marca "reviewed". Ciclo anual.
- **F5 — Planificación Anual (sin gateway):** Entregables concretos + indicadores de seguimiento. Trabajo constante con actualizaciones periódicas. Hereda de F4 del mismo ciclo. Sponsor marca "reviewed". Ciclo anual.

**REGLA CRÍTICA:** Los formularios digitales deben incluir exactamente todos los campos y preguntas de los documentos Word originales de PAE (en `docs/formularios-referencia/`). No inventar campos nuevos ni omitir campos existentes.

## Ciclo de vida — resumen

**Camino A (iniciativa nueva):** F1 → G1 → F1 VF → F2 → G2 → F2 VF → F3 → G3 → F3 VF → F4 (ciclo anual) → F5 (ciclo anual)

**Camino B (iniciativa existente):** Importar → F4 (ciclo anual) → F5 (ciclo anual). Muchas iniciativas no tienen Etapa 1/2/3.

Gateways requieren unanimidad. 5 estados: approved, feedback, pause, reject, area_change. Prioridad: reject > pause > area_change > feedback > pending > approved.

F4 y F5: draft → submitted → reviewed → closed. Sin gateway, sin votación.

Ver detalles completos en `.claude/rules/modelo-y-datos.md`.

## Roles y permisos

**Capa 1 — Perfil global:** user (default), area_transformacion, admin. VP/Sponsor se detecta automáticamente.

**Capa 2 — Rol por iniciativa:** promotor, lider_dimension, product_owner, business_owner, sponsor, scrum_master, equipo.

Row-level security en cada función de acceso a datos.

## Comandos de desarrollo

```bash
npm install                   # Instalar dependencias
npm run dev                   # Levantar app en localhost:3000
# Resetear datos: DevTools → Application → Local Storage → Clear All
git add . && git commit -m "" # Guardar cambios (mensajes en español)
```

## Reglas que SIEMPRE debes seguir

1. **TypeScript estricto** — nunca usar `any`. Usar `unknown` si es necesario.
2. **Zod para validar inputs** — nunca confiar en datos del frontend (aplica también a datos leídos de localStorage).
3. **Variables de entorno para secrets** — nunca hardcodear claves, tokens o passwords.
4. **App en español** — toda la interfaz, mensajes de error, labels, botones.
5. **Row-level security** — verificar permisos del usuario sobre cada iniciativa en cada función de acceso a datos.
6. **Auto-save en wizards** — cada 30 segundos + on blur con debounce 1 segundo.
7. **Nunca dangerouslySetInnerHTML** — previene XSS.
8. **Capa de abstracción para datos** — toda lectura/escritura pasa por `src/lib/storage/`. Nunca acceder a localStorage directamente desde componentes.
9. **5 formularios, 3 gateways** — F1 (G1), F2 (G2), F3 (G3), F4 (sin gateway), F5 (sin gateway). Nunca usar "LTP_PLAN" ni "LTP_REVIEW".
10. **Formularios = Word originales** — no inventar campos. Consultar `docs/formularios-referencia/`.

## Documentación de referencia en docs/

Estos archivos contienen especificaciones detalladas. Leelos cuando necesites contexto sobre una pantalla, un formulario o la generación de documentos.

- `docs/FUNCIONAMIENTO_APP.md` — Descripción funcional de todas las pantallas (comportamiento, elementos, flujos)
- `docs/PAE_Seed_Data_Completo.md` — Datos seed: 8 iniciativas con formularios completos, 10 usuarios mock
- `docs/wireframes/` — SVGs exportados de Canva (referencia visual por pantalla, pae_01 a pae_19)
- `docs/formularios-referencia/` — Los 5 Word originales de PAE (F1 a F5, fuente de verdad para campos)
- `docs/specs/` — Specs y scripts de referencia para generación de PPTX, XLSX, DOCX

## Qué NO hacer (IMPORTANTE)

- NO usar Pages Router — solo App Router de Next.js.
- NO instalar librerías nuevas sin confirmar conmigo primero.
- NO cambiar el modelo de datos sin confirmar conmigo primero.
- NO exponer stack traces ni detalles de errores internos.
- NO crear archivos CSS separados — usar Tailwind exclusivamente.
- NO hardcodear colores — siempre usar el theme de Tailwind (pae-red, pae-blue, pae-green, etc).
- NO usar Docker, Prisma, PostgreSQL ni next-auth en Fase 2-4.
- NO acceder a localStorage directamente desde componentes — siempre usar `src/lib/storage/`.
- NO usar los nombres "LTP_PLAN" o "LTP_REVIEW" — usar F4 y F5.
- NO asumir que toda iniciativa pasa por F1→F2→F3. Muchas entran directo a F4.
