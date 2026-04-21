# SPEC_NOTA_PRENSA.md

## Generador de Nota de Prensa (Working Backwards) — Plataforma PAE

**Versión:** 1.0  
**Última actualización:** Abril 2026  
**Propósito:** Especificación técnica para implementar el generador de notas de prensa tipo Working Backwards que se activa desde el botón "Generar Nota de Prensa" en el wizard y en el gateway.

---

## 1. Contexto y Concepto

### ¿Qué es Working Backwards?

Es una técnica de Amazon donde se escribe una "nota de prensa ficticia" como si la iniciativa ya se hubiera implementado exitosamente. El documento describe el resultado final, el problema que resolvió, la solución, y el impacto logrado. Esto fuerza al equipo a pensar primero en el cliente/usuario y en el valor entregado, antes de definir cómo construirlo.

### ¿Para qué se usa en PAE?

Se genera automáticamente desde los datos del formulario de cada iniciativa. Sirve para alinear la visión del equipo y presentar en las reuniones de gateway como complemento del PPTX. No es un comunicado oficial — es un ejercicio de pensamiento estratégico.

### Dónde aparece el botón

| Ubicación | Botón | Momento |
|-----------|-------|---------|
| Wizard formulario — barra inferior | "Generar Nota de Prensa" | Con datos actuales (incluso borrador) |
| Gateway — acciones | "Nota de prensa" | Con datos del formulario enviado |
| Detalle iniciativa — tab Documentos | "Regenerar" | Con datos actualizados |
| Post-aprobación automática | Automático | Se genera junto con PPTX VF, PDF VF, XLSX VF |

### Endpoint (backend)

```
POST /api/forms/:formId/generate
Body: { type: 'press_note' }
Response: { url: string, fileName: string, documentId: string }
```

### Frontend-phase (localStorage)

```typescript
// Ubicación
src/lib/generators/nota-prensa.ts

// Función principal
export async function generateNotaPrensaDocx(formData: FormularioData): Promise<Blob>
```

---

## 2. Arquitectura de Archivos

```
src/
  lib/
    generators/
      nota-prensa.ts              ← Generador principal
      nota-prensa-sections.ts     ← Builders de cada sección del documento
      nota-prensa-templates.ts    ← Templates de texto por formType
      nota-prensa-helpers.ts      ← Helpers reutilizables (párrafos, tablas)
      pptx-constants.ts           ← Colores PAE (compartido con PPTX)
    types/
      nota-prensa.types.ts        ← Interfaces TypeScript específicas
      pptx-formulario.types.ts    ← Interfaces compartidas (FormularioData)
```

---

## 3. Interfaz TypeScript de Datos de Entrada

La nota de prensa reutiliza las mismas interfaces de `FormularioData` del PPTX de formulario (ver `SPEC_PPTX_FORMULARIO.md` §3). Los campos se mapean a las secciones del documento Working Backwards.

### Datos adicionales para la nota de prensa

```typescript
interface NotaPrensaData {
  // Campos extraídos automáticamente del formulario
  metadata: FormularioMetadata;
  proposito: string;
  
  // Campos derivados (generados por la función de mapeo)
  titular: string;              // = metadata.initiativeName
  bajada: string;               // Generado desde beneficio clave
  problemaResuelto: string;     // Narrativa desde dolores/indicadores
  solucionDescripcion: string;  // Desde descripcion.estrategia
  impactoEsperado: string[];    // Desde indicadores de impacto (dolores)
  alcance: string;              // Desde descripcion.alcance + escalabilidad
  corrientesImpactadas: string[]; // Solo las con S (F1) o >0 (F2+)
  citaSponsor: string;          // Template con nombre del sponsor
  proximosHitos: Hito[];        // Desde hitos del formulario
  contactoPromotor: { nombre: string; posicion: string };
  contactoSponsor: { nombre: string; posicion: string };
}
```

### Función de mapeo FormularioData → NotaPrensaData

```typescript
function mapFormToNotaPrensaData(formData: FormularioData): NotaPrensaData {
  const meta = formData.metadata;
  
  return {
    metadata: meta,
    titular: meta.initiativeName,
    proposito: formData.proposito.texto,
    
    // Bajada: primera oración del propósito + beneficio principal
    bajada: derivarBajada(formData),
    
    // Problema: narrativa construida desde los indicadores de impacto
    problemaResuelto: derivarProblema(formData.dolores),
    
    // Solución: desde estrategia
    solucionDescripcion: formData.descripcion.estrategia,
    
    // Impacto: lista de indicadores con inicio → target
    impactoEsperado: formData.dolores.map(d => 
      `${d.dolor}: de ${d.datoInicio} a ${d.metricaTarget}`
    ),
    
    // Alcance + escalabilidad
    alcance: `${formData.descripcion.alcance} ${formData.descripcion.escalabilidad}`,
    
    // Corrientes de valor impactadas
    corrientesImpactadas: derivarCorrientes(formData),
    
    // Cita del sponsor (template)
    citaSponsor: generarCitaSponsor(meta.initiativeName, formData),
    
    // Hitos top 3-5
    proximosHitos: formData.hitos.slice(0, 5),
    
    // Contactos desde equipo
    contactoPromotor: extraerPromotor(formData),
    contactoSponsor: extraerSponsor(formData),
  };
}
```

---

## 4. Estructura del Documento

### 4.1 Secciones (en orden)

| # | Sección | Contenido | Campo fuente |
|---|---------|-----------|--------------|
| 0 | Encabezado | Badge "NOTA DE PRENSA — WORKING BACKWARDS" + línea roja | Fijo |
| 0b | Metadata | "Pan American Energy — Transformación Digital", dimensión, UG, fecha, versión | `metadata.*` |
| 1 | Titular | Nombre de la iniciativa en grande (24pt bold) | `metadata.initiativeName` |
| 2 | Bajada | Frase resumen del beneficio clave, con borde izquierdo azul, itálica | Derivado de `dolores[]` |
| 3 | El Desafío | Narración del problema que la iniciativa resuelve | Derivado de `dolores[]` |
| 4 | La Solución | Propósito + descripción técnica de la solución | `proposito.texto` + `descripcion.estrategia` |
| 5 | Impacto Esperado | Lista con bullets: cada indicador con dato inicio → target | `dolores[]` mapeados |
| 6 | Alcance | Alcance inicial + potencial de escalabilidad | `descripcion.alcance` + `descripcion.escalabilidad` |
| 7 | Corrientes de Valor | Tabla con las corrientes impactadas | `corrientesDeValor[]` filtradas |
| 8 | Palabras del Sponsor | Cita en itálica con borde rojo, nombre y cargo | Template + `responsablesGate[sponsor]` |
| 9 | Próximos Hitos | Lista con fechas en azul bold | `hitos[]` (top 3-5) |
| 10 | Contacto | Promotor y sponsor con nombre y posición | `equipoPropuesta[promotor]` + `responsablesGate[sponsor]` |
| 11 | Disclaimer | Texto fijo explicando que es un ejercicio WB | Fijo |

### 4.2 Variaciones por formType

| formType | Variación |
|----------|-----------|
| F1 | Estructura base. Corrientes en tabla S/N. Impacto como indicadores con targets. |
| F2 | Agrega "Consideraciones Técnicas" (tipo solución, desafíos digitales). Corrientes con valores numéricos a 5 años. Agrega sección "Costos estimados" (CAPEX/OPEX resumido). |
| F3 | Agrega "Resultados del MVP" (obtenidos vs esperados). Agrega "Aprendizajes y Conclusiones". Bajada ajustada según si el MVP fue exitoso o no. |
| LTP_PLAN | Reemplaza "El Desafío" por "Prioridades del Año". Agrega "Entregables Planificados" (tabla). Agrega "Indicadores de Seguimiento" (tabla). |
| LTP_REVIEW | Agrega "Resultados del Período" (planificado vs real). Agrega "Lecciones Aprendidas". Bajada basada en resultados reales. |

---

## 5. Diseño Visual

### Formato

- Tamaño: US Letter (8.5" x 11")
- Márgenes: 1" a cada lado
- Ancho contenido: 6.5" (9360 DXA)
- Header: "Pan American Energy — Confidencial" alineado a la derecha
- Footer: "Plataforma de Gestión de Portfolio — Transformación Digital"

### Tipografía

- Font: Inter (fallback: Calibri)
- Titular: 24pt bold, color PAE.DARK (#1A1A2E)
- Sección header: 14pt bold uppercase, color según sección (RED/BLUE/GREEN)
- Body: 11pt, interlineado 1.5x, color #2D2D2D
- Metadata: 9pt, color #666666
- Cita: 11pt itálica, con borde izquierdo rojo 4pt
- Disclaimer: 8pt itálica, color #666666

### Colores por sección

| Sección | Color header | Color borde |
|---------|-------------|-------------|
| El Desafío | RED #C8102E | — |
| La Solución | BLUE #003DA5 | — |
| Impacto Esperado | GREEN #00843D | — |
| Alcance | BLUE #003DA5 | — |
| Corrientes de Valor | GREEN #00843D | — |
| Palabras del Sponsor | RED #C8102E | Borde izq. RED |
| Próximos Hitos | BLUE #003DA5 | — |
| Bajada | — | Borde izq. BLUE |

---

## 6. Template de Cita del Sponsor

La cita se genera automáticamente usando un template + datos del formulario. El promotor o editor puede editarla antes de generar.

### Templates por formType

```typescript
function generarCitaSponsor(formType: FormType, data: FormularioData): string {
  const nombre = data.initiativeName || 'esta iniciativa';
  
  switch (formType) {
    case 'F1':
      return `Esta iniciativa representa un paso importante en nuestra ` +
        `estrategia de transformación digital. ${nombre} nos permite ` +
        `abordar un desafío operativo clave con un enfoque basado en datos ` +
        `y orientado al valor.`;
    
    case 'F2':
      return `Tras el análisis de dimensionamiento, estamos convencidos de que ` +
        `${nombre} es técnicamente viable y genera un retorno significativo. ` +
        `El siguiente paso es validarlo con un MVP controlado.`;
    
    case 'F3':
      return `Los resultados del MVP de ${nombre} nos dan la confianza ` +
        `para avanzar con el despliegue completo. Los aprendizajes obtenidos ` +
        `nos permiten escalar con menor riesgo y mayor impacto.`;
    
    case 'LTP_PLAN':
      return `Para este año, ${nombre} es una prioridad estratégica. ` +
        `Los entregables planificados nos acercan a los objetivos de ` +
        `eficiencia y transformación que nos hemos propuesto.`;
    
    case 'LTP_REVIEW':
      return `La revisión del período demuestra el progreso de ${nombre}. ` +
        `Los resultados obtenidos validan nuestra inversión y nos dan ` +
        `claridad sobre los ajustes necesarios para el próximo ciclo.`;
  }
}
```

---

## 7. Derivación de Contenido desde Formulario

### 7.1 Bajada (subtítulo)

```typescript
function derivarBajada(data: FormularioData): string {
  // Tomar el indicador de mayor prioridad
  const topIndicador = data.dolores
    .sort((a, b) => prioridadOrder(a.prioridad) - prioridadOrder(b.prioridad))[0];
  
  if (!topIndicador) return data.proposito.texto.split('.')[0] + '.';
  
  return `${topIndicador.dolor}: mejora de ${topIndicador.datoInicio} ` +
    `a ${topIndicador.metricaTarget} en ${topIndicador.metrica}.`;
}
```

### 7.2 Problema (El Desafío)

```typescript
function derivarProblema(dolores: DolorOportunidad[]): string {
  // Construir narrativa desde los indicadores de impacto
  const problemas = dolores.map(d => d.dolor.toLowerCase());
  
  if (problemas.length === 0) return '';
  if (problemas.length === 1) return `El principal desafío identificado es: ${problemas[0]}.`;
  
  const ultimo = problemas.pop();
  return `Los principales desafíos identificados son: ${problemas.join(', ')} ` +
    `y ${ultimo}. Estos generan un impacto negativo medible en las operaciones ` +
    `que esta iniciativa busca resolver.`;
}
```

### 7.3 Corrientes impactadas

```typescript
function derivarCorrientes(data: FormularioData): string[] {
  if ('corrientesDeValor' in data && Array.isArray(data.corrientesDeValor)) {
    // F1: filtrar solo las que tienen impacto = 'S'
    return data.corrientesDeValor
      .filter(cv => cv.impacto === 'S')
      .map(cv => cv.corriente);
  }
  if ('corrientesDeValor5Anios' in data) {
    // F2/F3: filtrar las que tienen algún valor > 0
    return data.corrientesDeValor5Anios
      .filter(cv => Object.values(cv.valores).some(v => v !== 0))
      .map(cv => cv.corriente);
  }
  return [];
}
```

---

## 8. Notas Técnicas para Claude Code

### 8.1 Librería

- **Frontend-phase**: `docx` (npm package `docx`) para generar en browser. Misma librería recomendada en el skill de docx.
- **Backend-phase**: mismo `docx` package, ejecutado en Node.js.
- **Formato de salida**: .docx (Microsoft Word). Se guarda como `F{N}_NotaDePrensa_{NombreIniciativa}.docx`.

### 8.2 Seguridad

- Sanitizar todos los textos antes de insertarlos (escapar caracteres XML especiales).
- No incluir datos sensibles en el header/footer (solo "Confidencial").
- El disclaimer es obligatorio y no puede ser removido programáticamente.

### 8.3 Campos vacíos

- Si un campo está vacío, omitir la sección correspondiente del documento.
- Si el propósito está vacío, usar el nombre de la iniciativa como titular solamente.
- Si no hay sponsor en `responsablesGate`, omitir la sección "Palabras del Sponsor".

### 8.4 Nombre del archivo

```typescript
function getNotaPrensaFileName(metadata: FormularioMetadata): string {
  const safeName = metadata.initiativeName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40);

  const period = metadata.ltpPeriod ? `_${metadata.ltpPeriod}` : '';
  return `PAE_${metadata.formType}_NotaDePrensa_${safeName}${period}.docx`;
}
// Ejemplo: "PAE_F1_NotaDePrensa_Optimizacion_Predictiva_de_Pozos_Maduros.docx"
```

### 8.5 Reglas de estilo (docx-js)

- NUNCA usar `\n` para saltos de línea — usar elementos Paragraph separados.
- NUNCA usar unicode bullets ("•") — usar `LevelFormat.BULLET` con numbering config.
- Siempre setear page size explícitamente (US Letter: 12240 x 15840 DXA).
- Usar `ShadingType.CLEAR` (no SOLID) para fondos de tabla.
- Usar `WidthType.DXA` (no PERCENTAGE) para anchos de tabla.
- Tables need dual widths: `columnWidths` en la tabla + `width` en cada cell.

### 8.6 Testing

- Generar nota de prensa de ejemplo para cada formType.
- Verificar que acentos y caracteres especiales del español se rendericen correctamente.
- Verificar apertura en Microsoft Word, Google Docs y LibreOffice Writer.
- Verificar que el disclaimer aparezca siempre al final.

---

## 9. Referencia Cruzada: Campo Formulario → Sección Nota de Prensa

| Sección WB | Campo fuente F1 | Campo fuente F2 | Campo fuente F3 | Campo fuente LTP |
|-----------|----------------|----------------|----------------|-----------------|
| Titular | `metadata.initiativeName` | Igual | Igual | Igual |
| Bajada | `dolores[0]` por prioridad | Igual | Desde `resultadosMVP` | Desde `prioridadesEstrategicas` |
| El Desafío | `dolores[]` → narrativa | Igual + `sintesisNecesidad` | Igual | → "Prioridades del Año" |
| La Solución | `proposito` + `descripcion.estrategia` | Igual + `procesosAsIsToBe` | Igual + `descripcionMVP` | `descripcion` + `entregables` |
| Impacto | `dolores[]` con targets | Igual + `corrientes5Anios` | Igual + `resultadosMVP` | `indicadoresSeguimiento` |
| Alcance | `descripcion.alcance` + `escalabilidad` | Igual | Igual | `entregablesAnuales` |
| Corrientes | `corrientesDeValor[S]` | `corrientes5Anios` | Igual | Igual |
| Cita | Template + sponsor | Template F2 + sponsor | Template F3 + sponsor | Template LTP + sponsor |
| Hitos | `hitos[0:5]` | Igual | `journeyPostMVP` | `hitos` del año |
| Contacto | `equipoPropuesta[promotor]` + `responsablesGate[sponsor]` | Igual | Igual | `equipoAlineacion[sponsor]` |
| — | — | + Consid. técnicas | + Resultados MVP | + Entregables tabla |
| — | — | + Costos resumidos | + Aprendizajes | + Indicadores tabla |
| — | — | — | — | + Lecciones (Review) |
