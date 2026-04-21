# Funcionamiento completo de la app — Plataforma de Gestión de Portfolio PAE

> Este documento describe pantalla por pantalla cómo funciona la aplicación.
> Es la fuente de verdad para Claude Code sobre el comportamiento esperado de cada vista.
> Se construye iterativamente — cada sección fue validada antes de incluirse.
> Referencia visual: wireframes SVG en la carpeta del proyecto (pae_01 a pae_18).

---

## 1. Entrada a la app

### Pantalla 0 — Mock SSO

Pantalla decorativa que simula el login corporativo de Microsoft Entra ID. No es funcional: no valida credenciales, no autentica. Muestra campos de email y contraseña con estilo visual de Microsoft pero sin lógica de autenticación. No es responsive.

**Elementos:**
- Campos de email y contraseña (decorativos, sin validación).
- Botón "Ir a MVP →" abajo a la derecha. Navega a Pantalla 1 (Selector de usuario).
- Bloque estático debajo del formulario con borde punteado: "Post-MVP: Este login se conecta automáticamente con Microsoft Entra ID. El rol del usuario se asigna según su perfil corporativo de PAE." Sin interacción, solo informativo.

### Pantalla 1 — Selector de usuario

Dos pasos en la misma pantalla:

**Paso 1 — Elegir rol:** 4 opciones presentadas como botones o cards:
- Product Owner (PO)
- Business Owner (BO)
- VP / Sponsor (VP)
- Área Transformación (AT)

**Paso 2 — Elegir usuario:** Dropdown filtrado según el rol elegido. Si el rol tiene un solo usuario posible, se autoselecciona sin mostrar dropdown.

| Rol | Usuarios disponibles en el dropdown |
|---|---|
| Product Owner | Juan García (u3), Fernando Álvarez (u5), Lucía Martínez (u6) |
| Business Owner | Ana Torres (u4) — se autoselecciona, sin dropdown |
| VP / Sponsor | Roberto Méndez (u1), Diego González (u7) |
| Área Transformación | María López (u2), Pablo Díaz (u9) |

**Botón "Cargar datos demo":** Ubicado debajo del selector. Carga el seed completo (8 iniciativas + 10 usuarios definidos en `docs/PAE_Seed_Data_Completo.md`) en localStorage. Es opcional — se puede elegir un usuario sin cargar datos demo.

**Acción al confirmar usuario:** Se guarda el usuario actual en localStorage y se redirige según el rol:
- PO → `/mis-iniciativas`
- BO, VP, AT → `/dashboard`

Todos los roles pueden navegar a cualquier sección desde el sidebar después del ingreso inicial.

### Estado vacío (sin datos demo cargados)

Si el usuario entra sin haber cargado datos demo, la landing (sea dashboard o mis-iniciativas) muestra la estructura completa de la app (header, sidebar, área de contenido) pero sin datos. Aparece un popup/modal informativo con el mensaje: **"Todavía no hay propuestas."** El usuario puede crear una iniciativa desde "+ Nueva propuesta" en el sidebar.

---

## 2. Navegación general (Shell)

Toda la app comparte la misma estructura: header fijo arriba, sidebar fijo a la izquierda (200px), área de contenido al centro sobre fondo `#F7F8FA`.

### Header

Barra superior blanca con sombra sutil. De izquierda a derecha:

1. **Logo PAE:** Barra roja vertical + "PAE" en bold + "Gestión de Portfolio" en gris.
2. **Indicador de etapas:** Cuatro textos en gris: Propuesta › Dimensionamiento › MVP › Delivery. Ninguna seleccionada por defecto en dashboards ni en listados. Solo se resalta la etapa activa (azul) cuando el usuario está dentro del detalle de una iniciativa específica.
3. **Notificaciones:** Ícono de campana con badge rojo que muestra la cantidad de notificaciones sin leer. Click abre el panel de notificaciones.
4. **Avatar del usuario:** Círculo con las iniciales del usuario logueado. El color del círculo varía según el rol (azul para PO, verde para BO, rojo para VP/AT).

### Sidebar

Barra lateral izquierda blanca, dividida en tres secciones:

**Sección ACCIONES (arriba):**
- **"+ Nueva propuesta"** — Botón azul (`#003DA5`), ancho completo. Navega a la pantalla de Nueva propuesta. Solo visible para roles que pueden crear iniciativas (PO, AT). No aparece para BO ni VP.
- **"Subir documento"** — Link de texto. Abre flujo de subida de archivo a una iniciativa.
- **"Aprob. pend. N"** — Texto rojo con badge numérico. Muestra la cantidad de gateways donde el usuario tiene voto pendiente. Click navega a la lista de Aprobaciones pendientes. Solo visible si N > 0.

**Sección NAVEGACIÓN:**
- **Dashboards** — Navega al dashboard del rol.
- **Mis iniciativas** — Navega a la lista de iniciativas del usuario.
- **Gateways** — Navega a la lista de gateways (aprobaciones pendientes).

El ítem activo tiene fondo azul sutil, barra lateral azul a la izquierda y texto en azul bold.

**Sección ESTADO:**
Pills toggle que filtran las iniciativas mostradas en cualquier vista (dashboard, mis iniciativas). Son filtros globales que persisten mientras se navega:
- En progreso (verde)
- Pendiente (rojo)
- Pausada (gris)
- Rechazada (gris)
- Cambio área (gris)

Cada pill es un toggle: click activa/desactiva ese filtro. Se pueden combinar múltiples filtros. Por defecto todas están desactivadas (se muestran todas las iniciativas).

---

## 3. Dashboards (Pantallas 2-5)

Cuatro variantes del mismo dashboard, filtrado automáticamente por el rol del usuario logueado. La estructura es idéntica; cambian los datos que se muestran y algunos elementos exclusivos de ciertos roles.

### Título y controles

- **Título:** "Dashboards — [Nombre del rol]: [Nombre usuario] (N inic.)"
- **Filtro VP (solo AT):** Dropdown "Filtro VP: ▼ Todas" para que Área Transformación filtre por vicepresidencia.
- **Botón "Descargar PPTX"** arriba a la derecha. Genera y descarga un PPTX resumen del dashboard (pendiente definir contenido exacto del PPTX).

### Bloque 1 — Métricas resumen

4 cards en fila horizontal, cada una con borde de color superior:

| Card | Borde | Contenido |
|---|---|---|
| Iniciativas activas | Azul `#003DA5` | Cantidad total de iniciativas visibles para el rol |
| Valor total | Verde `#00843D` | Suma del valor esperado de todas las iniciativas (USD) |
| Gasto total | Gris `#5A6070` | Suma del gasto esperado (USD) |
| Gates pendientes | Rojo `#C8102E` | Cantidad de gateways con votos pendientes. Si es 0, el borde no es rojo |

### Bloque 2 — Distribución por etapa

Card con barras verticales. Una barra por etapa: Propuesta, Dimensionamiento, MVP, Delivery. Cada barra muestra la cantidad de iniciativas en esa etapa. La altura de la barra es proporcional. Al pie: "Pausadas: N | Rechazadas: N".

### Bloque 3 — Corrientes de valor (beneficio bruto)

Card con barras verticales: Producción, OPEX, CAPEX, HH, Intangible. Muestra la proyección consolidada de año 1. Cada barra tiene su valor encima.

### Bloque 4 — Ranking de iniciativas

Tabla sorteable con columnas: Iniciativa, Etapa (chip de color), Valor esperado, Gasto esperado, ROI, Estado. Predeterminado: ordenado por ROI descendente. La columna Estado muestra pill verde "OK" o pill roja "Gate" si tiene un gateway pendiente. Click en una fila navega al detalle de la iniciativa.

### Bloque 5 — Próximos eventos

Timeline horizontal con dots de color alineados en una línea temporal:
- Rojo = gateway
- Azul = sprint review, seguimiento
- Verde = LTP plan, entrega

Cada dot muestra debajo: nombre del evento, nombre de la iniciativa, fecha. Si el usuario tiene voto pendiente en un gateway, aparece "Tu voto" en rojo debajo del dot.

**Botón "+ Agregar evento":** Abre popup/modal con campos:
- Nombre del evento (texto libre)
- Tipo (selector predeterminado con opciones: Gate, Sprint Review, Seg. Q, Seg. mensual, LTP Plan, Entrega, Otro — si elige Otro, campo de texto para tipear)
- Iniciativa (selector de las iniciativas visibles)
- Invitados (multi-select de usuarios)

### Diferencias por rol

| Rol | Qué ve | Extras |
|---|---|---|
| Área Transformación | Todas las iniciativas | Filtro dropdown por VP |
| VP / Sponsor | Solo iniciativas de su vicepresidencia | Sección extra: corrientes de valor cruzadas (qué iniciativas aportan a cada corriente con montos), "Tu voto" en rojo en eventos de gateways pendientes |
| Business Owner | Solo iniciativas donde es BO | — |
| PO / Promotor | Solo sus iniciativas | Su landing no es el dashboard sino Mis iniciativas, pero puede navegar al dashboard desde el sidebar |

### Dashboard VP — Elementos exclusivos

Además de los 5 bloques estándar, el dashboard del VP incluye:

- **Ranking por ROI:** Tabla simplificada con Iniciativa, Etapa, ROI estimado. Ordenada por ROI descendente.
- **Corrientes de valor cruzadas:** Tabla con Corriente, Total, Iniciativas que contribuyen (con montos individuales). Ejemplo: "Producción | +22K m³ | Opt(+8K) Mon(+6K)".

---

## 4. Mis iniciativas (Pantalla 6)

Landing predeterminada del PO. Todos los roles acceden desde el sidebar.

### Controles superiores

- **Título:** "Mis iniciativas"
- **Barra de búsqueda:** Campo de texto con placeholder "Buscar iniciativa..."
- **Filtros:** Dropdowns de Etapa, VP, Ordenar.

### Tabs

Dos tabs debajo de los filtros:
- **"Iniciativas propias":** Iniciativas donde el usuario es PO, Promotor o Líder de Dimensión. Tab activa por defecto con subrayado azul.
- **"Que me impactan":** Iniciativas donde el usuario participa en un gate, es BO de un área involucrada, o está en el equipo.

### Cards de iniciativas

Cada iniciativa se muestra como card blanca con sombra sutil. Borde izquierdo de color (azul para etapas 1-2, verde para etapas 3-4). Contenido de cada card:

1. **Nombre de la iniciativa** (bold, clickeable → navega al detalle)
2. **Chips:** Etapa (azul) + Estado (verde "En progreso", rojo "Pend. aprob.", gris "Pausada", etc.)
3. **Roles:** Texto con PO, LD, BO, SM según corresponda
4. **3 métricas en fila:** Valor esperado, Gasto esperado, y una tercera métrica variable según la iniciativa (HH ahorro, OPEX reducción, Producción m³, etc.)
5. **Acción pendiente (si existe):** Punto rojo + texto rojo. Ejemplos: "Completar sección 4", "Gateway 2: tu voto pendiente"
6. **Botón "Ir a iniciativa →"** al pie derecho de la card. Navega al detalle.

Las cards se muestran en grilla de 2 columnas en desktop.

---

## 5. Nueva propuesta (Pantalla 7)

Se accede desde "+ Nueva propuesta" en el sidebar.

### Campo de búsqueda combo (tipo Slack/Notion)

Campo de texto con borde azul activo. A medida que el usuario escribe, se filtran dos zonas:

**Zona 1 — Resultados existentes:** Lista de iniciativas cuyo nombre matchea con lo que se escribió. El texto matcheado se resalta. Cada resultado muestra:
- Nombre de la iniciativa
- PO y estado actual
- Chip de etapa
- Botón "Abrir FX" que navega al formulario de la etapa actual (F1, F2, F3, etc.)

**Zona 2 — Crear nueva:** Siempre visible al fondo. Card con borde punteado azul:
- Texto: "Crear '[lo que escribió]' como nueva iniciativa"
- Subtexto: "Se crea carpeta en SharePoint y se abre Formulario 1 en blanco"
- Botón azul "Crear"

**Acción "Crear":** Crea la iniciativa en localStorage (y en producción, crea carpeta en SharePoint), asigna al usuario como Promotor, y abre el wizard de F1 en blanco.

**Nota post-MVP:** "Post-MVP: se conecta con nombres de carpetas SharePoint o SAP para autocompletar iniciativas existentes."

---

## 6. Detalle de iniciativa

Al hacer click en una card o en "Ir a iniciativa →", se abre el detalle de la iniciativa. La etapa activa se resalta en azul en el header.

### Header del detalle

- Breadcrumb: "Mis iniciativas > [Nombre de la iniciativa]"
- Nombre de la iniciativa (h1)
- Chips: Etapa + Estado
- Roles en línea: PO, LD, BO, Sponsor
- Botones: "Descargar PPTX" y "Nota de prensa" (generan/descargan los documentos correspondientes)

### Barra de tabs

6 tabs horizontales: **Resumen**, **Eventos**, **Formularios**, **Documentos**, **Equipo**, **Mesa de trabajo**.

La tab "Mesa de trabajo" tiene un ícono de candado y está bloqueada hasta que la iniciativa llega a etapa 4 (Delivery) — es decir, hasta que F3 está completo o F4 existe.

---

### 6.1 Tab Resumen (Pantalla 8-9)

#### Siempre visible (etapas 1-4)

- **Propósito:** Texto extraído del formulario (sección Propósito).
- **4 métricas grandes:** Valor esperado, Gasto esperado, ROI, HH optimizadas.

**Bloque ① Corrientes de valor a 5 años:** Tabla con columnas Corriente (Producción, OPEX, CAPEX, HH) × Año 1, Año 3, Año 5.

**Bloque ② Indicadores de impacto:** Tabla con Indicador, Dato inicio, Dato target, Dato actual (vacío en etapas 1-2, se llena a partir de etapa 3), Prioridad. Los datos vienen de la tabla de dolores/oportunidades de los formularios.

**Bloque ③ Desafíos y riesgos:** Lista con bullets rojos. Datos del formulario.

**Bloque ④ Interdependencias:** Lista clickeable. Cada ítem es un link a otra iniciativa.

#### Solo VP y Área Transformación (cualquier etapa)

Sección adicional debajo con:
- **Tabla Objetivos Upstream vs iniciativas:** Objetivo, Iniciativa vinculada, Etapa, Entregable clave.
- **Corrientes de valor cruzadas:** Qué iniciativas aportan a cada corriente, con montos individuales.
- **Vision House:** Placeholder post-MVP con borde punteado. Texto: "Post-MVP: Visualización Vision House".
- **Próximos eventos:** Timeline con "Tu voto" en rojo para gateways donde el VP tiene voto pendiente.

#### Bloques adicionales en etapa 4 (Delivery)

**Bloque ⑤ Entregables priorizados:** Tabla con Entregable, Responsable, Quarter, Estado, % Avance. Datos de F4/F5.

**Bloque ⑥ Indicadores de adopción/asertividad:** Tabla con Indicador, Tipo (Resultado, Adopción, Asertividad, Impacto), Inicio, Target, Actual, Trend (↑/→/↓). Datos de F5.

**Bloque ⑦ Presupuesto del año:** Desglose OPEX (consultoría, licencias, infraestructura) y CAPEX (desarrollo). Datos de F4/F5.

---

### 6.2 Tab Eventos (Pantalla 11)

Gantt liviano con filas por tipo de evento:
- Etapa 1 Propuesta (barra + marker de gateway)
- Etapa 2 Dimensionamiento
- Etapa 3 MVP
- LTP
- Plan anual
- Seguimientos Q (dots periódicos trimestrales)
- Sprint Review (dots más frecuentes)
- Revisión ad-hoc (dots esporádicos)

**Leyenda de colores:**
- Verde = completado
- Azul = en curso
- Gris = pendiente
- Rojo = gateway

Línea roja punteada vertical marcando "Hoy".

Debajo del Gantt: lista de próximos eventos con botón "+ Agregar evento" (misma lógica de popup que en el dashboard).

---

### 6.3 Tab Formularios (Pantallas 14-15)

#### Carpetas de formularios

5 carpetas en fila horizontal arriba: F1 Propuesta, F2 Dimensionamiento, F3 MVP, F4 Visión LTP, F5 Plan Anual.

- La carpeta activa (la del formulario actual o último completado) tiene borde azul sólido.
- Las carpetas futuras (formularios aún no habilitados) tienen borde gris punteado con texto "Post Gateway X" indicando qué gateway debe aprobarse para habilitarlas.

**F4 y F5 — Selector de año:** Estas carpetas tienen un selector de año (2027, 2026, 2025...) porque se completan múltiples veces (ciclo anual). Los ciclos de años anteriores quedan read-only. F5 está synced con F4: los campos heredados de F4 se reflejan en F5 del mismo ciclo como carry-over.

#### Contenido al expandir una carpeta

Al clickear una carpeta se expande mostrando:
- Título del formulario
- Barra de progreso: "N de M secciones completas" con porcentaje
- Último editor: "Última edición: [nombre], [fecha]"
- Lista de secciones con estado: número + nombre + ícono (verde si completa, rojo si pendiente)
- **3 botones:**
  - "Editar formulario" (azul) — abre el wizard de formulario
  - "Ya tengo archivo" — flujo de subida de archivo como alternativa al wizard
  - "Descargar XLSX" (verde) — genera y descarga Excel con una tab por sección

#### Box de permisos

Bloque informativo al pie que explica quién puede hacer qué:
- **Editan:** PO/Promotor/LD + miembros del equipo con control de cambios + SM/Agile Coach
- **Comentan:** Sponsors y participantes del gate
- **Aprueban:** Miembros del gate en la pantalla Gateway

---

### 6.4 Tab Documentos (Pantalla 13)

Todos los archivos de la iniciativa organizados por carpetas (replica la estructura de SharePoint). Botón "+ Subir archivo" arriba a la derecha.

#### Estructura de carpetas

```
📁 Etapa 1 — Propuesta
   formulario.xlsx + .pdf (badge "Auto")
   VF formulario.xlsx + .pdf (badge "Auto")
   Presentación VF.pptx (badge "Auto")
   Nota de prensa VF.docx (badge "Auto")
   Minuta gateway.docx
   📁 archivos adicionales (subidos manualmente)

📁 Etapa 2 — Dimensionamiento (misma estructura)
📁 Etapa 3 — MVP (misma estructura)

📁 LTP y Seguimiento
   📁 2027
      📁 Junio
         📁 F4 Visión Anual (formulario + VF + presentación + nota prensa)
         📁 F5 Planificación Anual (misma estructura)
      📁 Diciembre (mismo esquema)
   📁 2026 (se repite año a año)

📁 Reuniones y minutas (archivos manuales: videos, minutas)
📁 Feedback de gateways (generado automáticamente post-gateway)
```

**Badges:** Cada archivo auto-generado tiene badge "Auto" y botón "Regenerar". Los subidos manualmente tienen badge "Manual". Todos tienen botón de descarga.

---

### 6.5 Tab Equipo (Pantalla 12)

Tres tablas:

1. **Equipo de trabajo:** Nombre, Rol, % Asignación, Interno/Externo, VP, Costo/mes.
2. **Alineación estratégica:** Sponsor, BO, Portfolio, LD.
3. **Interesados y consultados:** Nombre, Posición, VP.

Botones "+ Agregar al equipo" y "Sacar del equipo" solo visibles para Área Transformación.

---

### 6.6 Tab Mesa de trabajo (Pantalla 10)

Se desbloquea cuando F3 está completo o F4 existe (etapa 4, Delivery). La información se guarda en carpetas dentro de LTP.

**Indicadores de impacto — target vs actual:** Tabla con KPI, Target, Actual, Trend. Los dolores/oportunidades del formulario se convierten en KPIs.

**Indicadores de avance:** Barras de progreso. Nota: "MVP no incluye graficador — posibilidad futura".

**Identificación de bloqueantes:** Botón "+ Agregar bloqueante" abre popup con:
- Nombre del bloqueante
- Involucrados (multi-select)
- ¿Es prioridad? (sí/no)

Lista de bloqueantes con checkbox: tickear = marcar como desbloqueado.

**Brainstorm de ideas:** Botón "Abrir notas" abre un block de notas (textarea) que se guarda como documento en la carpeta LTP.

**Temas pendientes:** Lista tickeable (☐/☑) con botón "+ Agregar tema".

**Plan de gestión del cambio:** Placeholder "MVP no incluye — post-MVP".

**Seguimiento presupuesto (SAP):** Placeholder "MVP no incluye — conexión SAP futura". Botón placeholder "Conectar con SAP" (deshabilitado).

---

## 7. Wizard de formulario (Pantallas 16-17)

Pantalla completa que reemplaza la vista normal. No hay sidebar ni dashboard visible — el usuario está enfocado en completar el formulario.

### Stepper vertical (izquierda)

- Nombre del formulario arriba (ej: "F1 — Propuesta")
- Botón "Salir" que vuelve al detalle de la iniciativa
- Barra de progreso con porcentaje (ej: "70%")
- Lista de secciones numeradas con colores:
  - Verde = sección completa
  - Azul = sección activa (la que se está editando)
  - Rojo = sección pendiente (incompleta)
- Click en una sección navega directamente a ella

### Contenido del formulario (centro)

Cada sección muestra:
- Título de la sección
- Descripción/instrucciones
- Campos del formulario:
  - Textareas para descripciones largas
  - Tablas editables con botón "+ Agregar fila" para datos estructurados (dolores/oportunidades, equipo, riesgos, hitos)
  - Selectores, checkboxes, campos numéricos según la sección

**Principio de diseño:** Se priorizan tablas sobre texto libre siempre que sea posible, para limitar la variabilidad y facilitar la generación de documentos.

**Historial de cambios inline:** Debajo de cada sección, texto gris con los últimos cambios: "[Nombre] editó [campo] — [fecha] [hora]".

### Carry-over (F2 en adelante)

Cuando un formulario hereda campos del formulario anterior (carry-over):

- **Campos heredados:** Fondo gris con pill "Heredado F1" (o F2, F3, etc.). Son editables al hacer click.
- **Campos nuevos:** Borde azul con pill "Nuevo".
- **Divider:** Línea punteada azul separa visualmente campos heredados de campos nuevos.
- **Box de advertencia amarillo:** "⚠ Revisar y profundizar los textos grises heredados con los resultados del [etapa actual]."
- **En tablas:** Filas heredadas en gris + filas nuevas con borde azul.

### Barra inferior fija

Fija al pie de la pantalla:
- **Indicador de guardado:** "✓ Guardado automáticamente — hace 2 min" (verde). Auto-save cada 30 segundos + on blur con debounce 1 segundo.
- **Botón "Previsualizar":** Muestra vista read-only del formulario completo.
- **Botón "Generar PPTX":** Genera y descarga el PPTX con los datos actuales.
- **Botón "Enviar a aprobación":** Deshabilitado hasta que el formulario esté 100% completo (todas las secciones en verde). Al activarse, envía a gateway (F1-F3) o a revisión del sponsor (F4-F5).

---

## 8. Gateway de aprobación (Pantalla 18)

### 8.1 Lista de aprobaciones pendientes

Se accede desde "Gateways" o "Aprob. pend. N" en el sidebar. Muestra una lista de gateways que requieren el voto del usuario logueado.

Cada card de gateway muestra:
- "Gateway N" + nombre de la iniciativa
- Chip de etapa
- Promotor que envió
- Fecha de envío
- Progreso de votos: "N de M votos recibidos"
- Texto rojo: "Tu voto pendiente"
- Botón rojo "Ir al Gateway"

### 8.2 Pantalla de Gateway

Header con fondo rojo sutil:
- Nombre de la iniciativa, promotor, LD, dimensión
- Estado: "Esperando votos" (pill amarilla)
- Fecha de envío

**Panel de votos:** Avatares en fila horizontal, cada uno con estado visual:
- Verde con ✓ = aprobado
- Rojo = "Tu voto pend."
- Amarillo con ⏳ = pendiente de otro aprobador
- Texto: "Unanimidad requerida — X de Y votos recibidos"

**Documentos descargables:** Links para descargar PPTX estándar, PDF formulario, Nota de prensa, XLSX.

**Formulario read-only:** Las secciones del formulario se muestran como acordeones expandibles (click para abrir/cerrar). Debajo de cada sección: feedback existente de otros aprobadores (avatar + nombre + comentario), y campo "Tu feedback" para escribir.

**5 botones de decisión:**

| Botón | Color | Efecto |
|---|---|---|
| Aprobar | Verde `#00843D` | Voto positivo. Si todos aprueban → formulario pasa a VF |
| Feedback | Azul `#003DA5` | Vuelve al promotor con comentarios. Todos los votos se resetean |
| Pausa | Amarillo `#F59E0B` | Iniciativa en espera. Solo Sponsor o AT pueden reactivar |
| Rechazar | Rojo `#C8102E` | Iniciativa cerrada. Queda en historial, no se borra |
| Cambio de área | Gris `#5A6070` | Re-asignar BO y/o Sponsor. Sigue en gateway |

**Resolución por unanimidad con prioridad:** Reject > Pause > Area Change > Feedback > Pending > Approved. Si alguien rechaza, se rechaza independientemente de los demás votos. Si alguien pausa y nadie rechazó, se pausa. Cuando el editor re-envía después de feedback, TODOS los votos se resetean a pending (ronda limpia).

### 8.3 Acciones post-gateway

3 botones disponibles después de que el gateway se resuelve:
- **"Asignar rol":** Abre popup para asignar quién lidera la siguiente etapa (ej: Líder de Dimensión) con selector de persona + rol.
- **"Stakeholders":** Sponsor o LD agrega personas al equipo de la iniciativa.
- **"Minuta":** PO completa un documento de minuta que se guarda en la carpeta de la etapa.

**Importante — VF pendiente:** La gateway no se cierra para el PO aunque todos aprueben — queda pendiente hasta que suba la Versión Final del formulario. Box amarillo con botón "Ir al formulario (editar VF) →" que redirige al wizard para editar incorporando los acuerdos de la minuta.

---

## 9. Generación de documentos (transversal)

En todas las etapas se pueden generar y descargar:
- **PPTX** estandarizado con brandbook PAE (colores, logo, tipografía)
- **PDF** del formulario completo
- **XLSX** con una tab por sección del formulario
- **DOCX** de nota de prensa tipo Working Backwards
- **DOCX** de feedback unificado post-gateway

Todos se guardan en la estructura de carpetas de la iniciativa y se pueden descargar localmente. En la fase frontend los genera el browser con pptxgenjs, SheetJS, html2pdf.js y docx.

---

## 10. Control de cambios (transversal)

- Log por sección con autor y fecha: "[Nombre] editó [campo] — [fecha] [hora]".
- Sin diff inline en MVP — solo quién cambió qué y cuándo.
- El historial se muestra debajo de cada sección en el wizard y en la tab Formularios del detalle.
- Autoguardado continuo: cada 30 segundos + on blur con debounce 1 segundo.
- No se registran guardados sin cambio real (se compara old vs new antes de registrar).

---

## 11. Ciclo de vida completo de una iniciativa

1. Login SSO (mock en MVP)
2. Crear o seleccionar iniciativa (pantalla Nueva propuesta)
3. Completar F1 Propuesta (wizard por secciones)
4. Enviar a Gateway 1 (valida campos obligatorios)
5. Aprobadores votan (unanimidad requerida)
6. Si feedback: editar y re-enviar (votos se resetean a cero)
7. Si aprobado: generar VF, definir quién lidera etapa 2, asignar PO y editores
8. Carry-over F1 VF → F2 Dimensionamiento (campos heredados + nuevos)
9. Gateway 2 (misma lógica, confirmar PO)
10. Carry-over F2 VF → F3 MVP
11. Gateway 3 (aprobación final)
12. Pasa a Delivery (etapa 4)
13. F4 Visión anual LTP + F5 Planificación anual (ciclo anual, se repite cada año)
14. Mesa de trabajo activa (indicadores, bloqueantes, brainstorm, temas pendientes)
15. Dashboards + seguimiento continuo filtrable por etapa, VP, BO, dimensión

**Camino alternativo (iniciativa existente):** Muchas iniciativas no tienen etapas 1-3. Se importan directo a F4 → F5 → Mesa de trabajo.
