---

paths:

- "src/app/api/\*\*"  
- "src/lib/\*\*"

---

# Reglas de API / Capa de datos — PAE

## Contexto de fase

En Fase 2-4 (actual) no existen endpoints REST reales. La lógica de negocio se implementa como funciones TypeScript en `src/lib/storage/` que leen/escriben localStorage. Estas funciones replican la interfaz que tendrán los endpoints REST en Fase 5\.

Las reglas de este archivo aplican a ambas fases: a las funciones de `src/lib/storage/` ahora, y a los endpoints `src/app/api/` en Fase 5\.

## Ubicación y estructura

### Fase 2-4 (actual)

- Funciones de acceso a datos en `src/lib/storage/`.  
- Un archivo por recurso: `initiatives.ts`, `forms.ts`, `gateways.ts`, `notifications.ts`, `documents.ts`, `auth.ts`.  
- Cada función replica la firma del endpoint futuro (mismos parámetros de entrada, misma estructura de respuesta).

### Fase 5 (futura)

- Endpoints en `src/app/api/`.  
- Cada recurso en su carpeta: `/api/initiatives/`, `/api/forms/`, `/api/gateways/`, `/api/notifications/`, `/api/documents/`, `/api/portfolio/`.  
- Archivo `route.ts` en cada carpeta con los métodos HTTP (GET, POST, PATCH, DELETE).

## Formato de respuestas

Todas las funciones/endpoints devuelven esta estructura:

// Éxito

{ success: true, data: { ... } }

// Error

{ success: false, error: { code: "VALIDATION\_ERROR", message: "Descripción en español" } }

Códigos de error (en Fase 5 se mapean a HTTP): VALIDATION\_ERROR (400), AUTH\_REQUIRED (401), FORBIDDEN (403), NOT\_FOUND (404), RATE\_LIMITED (429), INTERNAL\_ERROR (500).

## Validación

- SIEMPRE validar con Zod al inicio de cada función/endpoint.  
- Definir schemas Zod en archivos separados: `src/lib/validations/`.  
- Nunca confiar en datos del frontend — validar tipos, longitudes, formatos, enums.  
- En Fase 2-4: validar también datos leídos de localStorage (pueden estar corruptos o manipulados desde DevTools).

## Acceso a datos

- En Fase 2-4: leer/escribir localStorage a través de `src/lib/storage/`. Nunca acceder a localStorage directamente.  
- En Fase 5: usar Prisma Client. Nunca queryRaw ni SQL directo. Usar transacciones ($transaction) cuando se modifican varias tablas. Incluir select/include explícito.

## Funciones principales (Fase 2-4) / Endpoints (Fase 5\)

### Autenticación (mock)

getCurrentUser()                         → usuario logueado actual

switchUser(userId)                       → cambiar usuario mock (solo Fase 2-4)

getAvailableUsers()                      → lista de usuarios mock para selector

### Iniciativas

createInitiative(name)                   → crear iniciativa \+ form F1 draft \+ asignar promotor

importInitiative(name, stage)            → importar iniciativa existente directo a F4 (sin etapas 1-3)

getInitiative(id)                        → detalle de iniciativa (verificar acceso)

listInitiatives(filters)                 → lista filtrada por rol, etapa, estado, VP, BO

### Formularios

getForm(formId)                          → definición \+ respuestas \+ carry-over \+ completitud

saveFormResponses(formId, fields)         → auto-save parcial (campos modificados)

submitForm(formId)                        → valida obligatorios, cambia estado

  \- F1/F2/F3: cambia a 'submitted', crea gateway, notifica aprobadores

  \- F4/F5: cambia a 'submitted', notifica sponsor

markFormReviewed(formId, comment)         → solo F4/F5: sponsor marca 'reviewed' con comentario

generateDocument(formId, type)            → genera PPTX, PDF, XLSX, DOCX (nota de prensa) o minuta

uploadFinalVersion(formId, file)          → PO sube VF manualmente (independiente del resultado del gateway)

### Gateways (solo F1, F2, F3)

getGateway(gatewayId)                    → estado del gateway \+ votos \+ feedback

submitVote(gatewayId, vote, feedback)     → registrar voto (approved/feedback/pause/reject/area\_change)

generateMinuta(gatewayId)                → draftear minuta del gateway (Minuta\_gateway\_N.docx)

### Notificaciones

getNotifications(userId)                 → notificaciones del usuario

markAsRead(notificationId)               → marcar como leída

### Dashboard y portfolio

getDashboard(role, filters)              → datos agregados para el dashboard del rol

getPortfolioSummary()                    → KPIs consolidados (solo VP/Área Transf.)

### Documentos y archivos

listDocuments(initiativeId, stage?)       → lista de documentos de la iniciativa

uploadDocument(initiativeId, stage, file) → subir documento adicional

getDocumentUrl(documentId)               → URL/datos para descarga

## Row-level security

En CADA función de acceso a datos:

1. Obtener usuario actual (mock en Fase 2-4, getServerSession en Fase 5).  
2. Si no hay usuario → error AUTH\_REQUIRED.  
3. Verificar que el usuario tiene acceso a la iniciativa vía initiative\_members.  
4. Si no tiene acceso → error FORBIDDEN.  
5. Verificar que el rol del usuario permite la acción solicitada.

Excepción: VP y Área Transformación pueden ver todas las iniciativas (filtradas por su vicepresidencia en el caso del VP).

## Carry-over entre formularios

Cuando se aprueba un gateway (F1-F3) o se inicia un nuevo ciclo (F4/F5):

1. Identificar el formulario origen según la tabla de carry-over (ver modelo-y-datos.md).  
2. Copiar respuestas del formulario origen para campos con `carry_over_from` definido en el `sections_config`.  
3. Los campos nuevos (sin `carry_over_from`) quedan vacíos.  
4. Los campos heredados son editables pero se guardan solo en el formulario destino (no modifican el origen).

### Carry-over inter-anual (F4 y F5)

- Al crear F4 de un nuevo año: copiar campos del F4 del año anterior.  
- Al crear F5 de un nuevo año: copiar campos del F5 del año anterior (permite comparar planificado vs real año a año).  
- Al crear F5 del mismo ciclo: copiar campos del F4 del mismo ciclo.

## Versión final (VF) de documentos

- Cuando un gateway se aprueba, el sistema genera automáticamente la VF (xlsx, pdf, pptx, nota de prensa).  
- Independientemente del resultado del gateway, el PO o encargado puede draftear y subir manualmente una VF.  
- Si no existe un archivo con nombre VF en la carpeta de la etapa, se toma el último archivo disponible como versión vigente.

## Control de cambios

Cada modificación de un campo se registra en form\_change\_log:

- form\_id, field\_key, old\_value, new\_value, changed\_by (user\_id), changed\_at (timestamp).  
- No se registran: guardados sin cambio real (comparar old vs new antes de guardar), ni cambios del sistema (carry-over automático, marcados con changed\_by: 'system').

