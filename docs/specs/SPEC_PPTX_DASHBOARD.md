# Especificación: Generación de PPTX desde Dashboard

## Contexto

Cuando el usuario hace click en el botón **"Descargar PPTX"** del dashboard (pantallas 2-5), la plataforma debe generar una presentación PowerPoint con el resumen del portfolio visible en ese dashboard y descargarla al navegador del usuario.

En **Phase 2** (frontend con localStorage, sin backend), la generación corre **100% en el browser** usando `pptxgenjs` como librería client-side. En **Phase 5** (backend), se migra a un endpoint server-side `POST /api/dashboard/generate-pptx`.

---

## Arquitectura Phase 2 (browser-side)

### Dependencia

```bash
npm install pptxgenjs
```

pptxgenjs funciona en el browser sin dependencias adicionales. No necesita Node.js, no necesita backend.

### Flujo del botón

```
Usuario click "Descargar PPTX"
  → onClick handler llama generateDashboardPPTX(dashboardData)
  → pptxgenjs genera el .pptx en memoria (blob)
  → pres.writeFile({ fileName: "PAE_Portfolio_Resumen_YYYY-MM.pptx" })
  → el browser descarga el archivo automáticamente
```

### Estructura de archivos

```
src/
  lib/
    pptx/
      pae-brand.ts          ← constantes de marca (colores, fonts)
      dashboard-pptx.ts     ← función principal generateDashboardPPTX()
      slides/
        portada.ts           ← buildPortada(pres, data)
        metricas-clave.ts    ← buildMetricasClave(pres, data)
        distribucion-etapa.ts
        corrientes-valor.ts
        ranking-iniciativas.ts
        valor-vs-gasto.ts
        proximos-eventos.ts
        distribucion-dim-vp.ts
        cierre.ts
```

### Interfaz de datos de entrada

La función recibe los datos ya calculados desde localStorage. NO hace queries — recibe todo pre-procesado.

```typescript
// src/lib/pptx/types.ts

export interface DashboardPPTXData {
  // Quién genera y cuándo
  generadoPor: string;          // nombre del usuario logueado
  rolUsuario: 'transformacion' | 'vp' | 'bo' | 'po';
  fechaGeneracion: Date;
  
  // Contexto del dashboard (cambia según el rol)
  tituloDashboard: string;      // ej: "Área Transformación" o "VP Upstream: R. Mendez"
  filtrosAplicados?: string;    // ej: "VP: Upstream | Etapa: Todas"

  // Métricas resumen (slide 2)
  metricas: {
    totalIniciativas: number;
    valorTotal: number;         // en USD
    gastoTotal: number;         // en USD
    gatesPendientes: number;
    roiPromedio: number;        // calculado: valorTotal / gastoTotal
  };

  // Distribución por etapa (slide 3)
  distribucionEtapa: {
    propuesta: number;
    dimensionamiento: number;
    mvp: number;
    delivery: number;
  };
  estadoConsolidado: {
    enProgreso: number;
    pendienteGate: number;
    pausadas: number;
    rechazadas: number;
  };

  // Corrientes de valor (slide 4)
  corrientesValor: {
    produccion: number;         // en millones USD
    opex: number;
    capex: number;
    hh: number;
    intangible: number;
  };

  // Ranking de iniciativas (slides 5-6)
  iniciativas: Array<{
    nombre: string;
    etapa: 'Propuesta' | 'Dim.' | 'MVP' | 'Del.';
    valorEsperado: number;      // USD
    gastoAcumulado: number;     // USD
    roi: number;
    estado: 'OK' | 'Gate' | 'Pausada' | 'Rechazada';
  }>;

  // Próximos eventos (slide 7)
  eventosProximos: Array<{
    tipo: string;               // "Gate 1", "Sprint Rev", "LTP Plan", etc.
    iniciativa: string;
    fecha: string;              // formato display: "14 abr"
  }>;

  // Distribución por dimensión y VP (slide 8)
  porDimension: Array<{ label: string; count: number }>;
  porVicepresidencia: Array<{ label: string; count: number }>;
}
```

### Función principal

```typescript
// src/lib/pptx/dashboard-pptx.ts

import pptxgen from 'pptxgenjs';
import { DashboardPPTXData } from './types';
import { PAE } from './pae-brand';
import { buildPortada } from './slides/portada';
import { buildMetricasClave } from './slides/metricas-clave';
// ... etc

export async function generateDashboardPPTX(data: DashboardPPTXData): Promise<void> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = data.generadoPor;
  pres.title = `Portfolio Transformación Digital — ${data.tituloDashboard}`;

  // Construir cada slide
  buildPortada(pres, data);
  buildMetricasClave(pres, data);
  buildDistribucionEtapa(pres, data);
  buildCorrientesValor(pres, data);
  buildRankingIniciativas(pres, data);
  buildValorVsGasto(pres, data);
  buildProximosEventos(pres, data);
  buildDistribucionDimVP(pres, data);
  buildCierre(pres, data);

  // Generar nombre con fecha
  const fecha = new Date();
  const mes = fecha.toLocaleString('es-AR', { month: 'short' });
  const anio = fecha.getFullYear();
  const fileName = `PAE_Portfolio_Resumen_${mes}_${anio}.pptx`;

  // Descargar al browser
  await pres.writeFile({ fileName });
}
```

### Cómo conectar el botón del dashboard

```tsx
// En el componente del dashboard (ej: DashboardTransformacion.tsx)

import { generateDashboardPPTX } from '@/lib/pptx/dashboard-pptx';
import { buildDashboardData } from '@/lib/dashboard-data';

function DashboardHeader() {
  const [generating, setGenerating] = useState(false);

  const handleDescargarPPTX = async () => {
    setGenerating(true);
    try {
      // Leer datos de localStorage y calcular métricas
      const data = buildDashboardData();  
      await generateDashboardPPTX(data);
    } catch (error) {
      console.error('Error generando PPTX:', error);
      // Mostrar toast de error
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleDescargarPPTX}
      disabled={generating}
      className="..."
    >
      {generating ? 'Generando...' : 'Descargar PPTX'}
    </button>
  );
}
```

### Función que transforma localStorage → DashboardPPTXData

```typescript
// src/lib/dashboard-data.ts

import { DashboardPPTXData } from './pptx/types';

export function buildDashboardData(): DashboardPPTXData {
  // Leer iniciativas de localStorage
  const initiatives = JSON.parse(
    localStorage.getItem('pae_initiatives') || '[]'
  );
  const currentUser = JSON.parse(
    localStorage.getItem('pae_current_user') || '{}'
  );

  // Calcular métricas
  const activas = initiatives.filter(i => 
    i.status !== 'rechazada' && i.status !== 'pausada'
  );
  const valorTotal = activas.reduce((sum, i) => sum + (i.valorEsperado || 0), 0);
  const gastoTotal = activas.reduce((sum, i) => sum + (i.gastoAcumulado || 0), 0);
  const gatesPendientes = activas.filter(i => 
    i.status === 'in_review' || i.status === 'submitted'
  ).length;

  // Distribución por etapa
  const etapas = { propuesta: 0, dimensionamiento: 0, mvp: 0, delivery: 0 };
  activas.forEach(i => {
    if (i.stage === 'proposal') etapas.propuesta++;
    else if (i.stage === 'dimensioning') etapas.dimensionamiento++;
    else if (i.stage === 'mvp') etapas.mvp++;
    else if (i.stage === 'delivery') etapas.delivery++;
  });

  // ... más cálculos similares para cada sección

  return {
    generadoPor: currentUser.display_name || 'Usuario PAE',
    rolUsuario: currentUser.global_role || 'po',
    fechaGeneracion: new Date(),
    tituloDashboard: 'Área Transformación',
    metricas: {
      totalIniciativas: activas.length,
      valorTotal,
      gastoTotal,
      gatesPendientes,
      roiPromedio: gastoTotal > 0 ? valorTotal / gastoTotal : 0,
    },
    distribucionEtapa: etapas,
    // ... etc
  };
}
```

---

## Brandbook PAE — constantes compartidas

```typescript
// src/lib/pptx/pae-brand.ts

// IMPORTANTE: pptxgenjs NO usa # en los colores. Solo hex de 6 chars.
export const PAE = {
  red:       'C8102E',
  blue:      '003DA5',
  green:     '00843D',
  dark:      '1A1A1A',
  darkGray:  '3D3D3A',
  medGray:   '666666',
  lightGray: 'E8E8E4',
  bgLight:   'F5F4ED',
  white:     'FFFFFF',
} as const;

export const FONT = 'Inter' as const;
// Fallback: si Inter no está instalada en la PC del usuario,
// PowerPoint usará Calibri automáticamente.
```

---

## Especificación de cada slide

### Slide 1 — Portada
- **Fondo**: azul PAE (#003DA5)
- **Barra roja** superior (h: 0.06")
- **Texto**: "Pan American Energy" (16pt, Inter, blanco, letter-spacing)
- **Título**: dinámico desde `data.tituloDashboard` (36pt, Inter, bold, blanco)
- **Subtítulo**: "Resumen ejecutivo — {mes} {año}" (16pt, blanco, 30% transparencia)
- **Línea verde** separadora (w: 2.5", PAE green)
- **Área**: ej "Área Transformación" (12pt, 40% transparencia)
- **Fecha**: dinámico desde `data.fechaGeneracion`

### Slide 2 — Métricas clave
- **Fondo**: blanco
- **4 KPI cards** horizontales con:
  - Accent bar de color en el top (azul, verde, azul, rojo)
  - Icono centrado (react-icons/fa — NOTA: en browser usar SVG inline, no sharp)
  - Valor grande (28pt, bold)
  - Label descriptivo (11pt, gris)
- **Barra insight** al fondo: "ROI promedio del portfolio: {roi}x | {n} iniciativas con gate en los próximos 30 días"
- Los 4 KPIs son: Iniciativas activas, Valor esperado total, Gasto acumulado, Gates pendientes

### Slide 3 — Distribución por etapa
- **Chart nativo horizontal** (pres.charts.BAR, barDir: "bar") con etapas
- **Panel lateral derecho** con estado consolidado (En progreso, Pendiente gate, Pausadas) — cada uno con barra de color, número grande, label

### Slide 4 — Corrientes de valor
- **Chart de columnas** nativo (pres.charts.BAR, barDir: "col")
- 5 corrientes: Producción, OPEX, CAPEX, HH, Intangible
- Colores: verde para Producción, azul para OPEX/CAPEX, rojo para HH, gris para Intangible

### Slide 5 — Ranking de iniciativas
- **Tabla nativa** (slide.addTable) con columnas: INICIATIVA, ETAPA, VALOR ESP., GASTO, ROI, ESTADO
- Header azul PAE con texto blanco
- Rows alternadas (blanco / bgLight)
- Etapa con color según tipo (verde Del., azul MVP/Dim.)
- Estado con color (verde OK, rojo Gate)
- Nota al pie explicando ROI y estados

### Slide 6 — Valor vs Gasto
- **Barras agrupadas horizontales** (pres.charts.BAR, barGrouping: "clustered")
- Azul = valor esperado, Rojo = gasto acumulado
- Leyenda al fondo

### Slide 7 — Próximos eventos
- **Timeline visual** con shapes:
  - Línea base horizontal (gris)
  - Puntos circulares (OVAL) de color según tipo de evento
  - Labels debajo: tipo (bold), nombre iniciativa (azul), fecha (gris)
- **Barra de alerta** al fondo en rojo: "N gates requieren voto en los próximos 30 días"

### Slide 8 — Distribución por dimensión y VP
- **Pie chart** izquierdo con distribución por dimensión
- **Bar chart horizontal** derecho con distribución por vicepresidencia
- Colores del pie: azul, verde, rojo, amarillo, gris

### Slide 9 — Cierre
- **Fondo**: dark (#1A1A1A)
- **Barra roja** inferior
- Branding PAE + "Generado automáticamente desde la plataforma"

---

## Notas técnicas críticas para Claude Code

### pptxgenjs en browser vs Node.js
- **Browser**: `import pptxgen from 'pptxgenjs'` — funciona directamente
- **Node.js**: `const pptxgen = require('pptxgenjs')` — para server-side (Phase 5)
- La API es idéntica. El output cambia: `writeFile()` en browser descarga, en Node guarda a disco.

### Iconos en browser
En el PPTX de ejemplo que te adjunto usamos `react-icons` + `sharp` para renderizar iconos PNG. **Eso solo funciona en Node.js.** En el browser tenés 2 opciones:
1. **Pre-renderizar los iconos a base64 PNG** en build time (recomendado) y guardarlos como constantes
2. **Usar SVG inline** generados con `react-icons` y convertir a base64 con canvas — más complejo pero dinámico
3. **No usar iconos** en la primera iteración y usar shapes de pptxgenjs (OVAL, RECTANGLE) como placeholders

**Recomendación**: Opción 1. Crear un script `scripts/render-pptx-icons.ts` que corre en build y genera un archivo `src/lib/pptx/icons-base64.ts` con las constantes.

### Colores sin #
pptxgenjs NUNCA usa # en los colores. Siempre hex de 6 caracteres: `"C8102E"` no `"#C8102E"`. Si usás #, el archivo se corrompe silenciosamente.

### No reusar objetos de opciones
pptxgenjs MUTA los objetos in-place (convierte valores a EMU). Si reutilizás un objeto shadow o fill entre slides, la segunda slide se corrompe. Usar factory functions:
```typescript
const mkShadow = () => ({
  type: "outer" as const, color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.08,
});
```

### Formato de moneda
- Valores grandes: `formatUSD(18200000)` → `"USD 18.2M"`
- Valores medios: `formatUSD(620000)` → `"USD 620K"`
- ROI: `formatROI(8.4)` → `"8.4x"`

```typescript
export function formatUSD(value: number): string {
  if (value >= 1_000_000) return `USD ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `USD ${Math.round(value / 1_000)}K`;
  return `USD ${value}`;
}
```

---

## Migración a Phase 5 (backend)

Cuando implementes el backend, la función se mueve a una API route:

```typescript
// src/app/api/dashboard/generate-pptx/route.ts

import { generateDashboardPPTX } from '@/lib/pptx/dashboard-pptx';

export async function POST(request: Request) {
  const data = await request.json();
  
  // En server, writeFile() guarda a disco
  // Alternativa: usar pres.write('nodebuffer') para obtener buffer
  const pres = new pptxgen();
  // ... build slides ...
  const buffer = await pres.write({ outputType: 'nodebuffer' });
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="PAE_Portfolio_Resumen.pptx"`,
    },
  });
}
```

El frontend cambia el handler de `generateDashboardPPTX(data)` a `fetch('/api/dashboard/generate-pptx', { method: 'POST', body: JSON.stringify(data) })`.

---

## Archivo de referencia adjunto

El archivo `PAE_Portfolio_Dashboard_Resumen.pptx` es el output de referencia. Tiene exactamente 9 slides con datos de ejemplo hardcodeados. El PPTX que genere la app debe verse idéntico pero con datos reales de localStorage.

El script Node.js `generate_portfolio_pptx.js` que lo genera es la referencia técnica: cada slide tiene los offsets, tamaños, colores y estilos exactos.

---

## Checklist de implementación

- [ ] Instalar pptxgenjs (`npm install pptxgenjs`)
- [ ] Crear `src/lib/pptx/pae-brand.ts` con constantes de marca
- [ ] Crear `src/lib/pptx/types.ts` con interfaces
- [ ] Crear `src/lib/pptx/utils.ts` con formatUSD, formatROI, mkShadow
- [ ] Crear `src/lib/pptx/slides/portada.ts`
- [ ] Crear `src/lib/pptx/slides/metricas-clave.ts`
- [ ] Crear `src/lib/pptx/slides/distribucion-etapa.ts`
- [ ] Crear `src/lib/pptx/slides/corrientes-valor.ts`
- [ ] Crear `src/lib/pptx/slides/ranking-iniciativas.ts`
- [ ] Crear `src/lib/pptx/slides/valor-vs-gasto.ts`
- [ ] Crear `src/lib/pptx/slides/proximos-eventos.ts`
- [ ] Crear `src/lib/pptx/slides/distribucion-dim-vp.ts`
- [ ] Crear `src/lib/pptx/slides/cierre.ts`
- [ ] Crear `src/lib/pptx/dashboard-pptx.ts` (función principal)
- [ ] Crear `src/lib/dashboard-data.ts` (localStorage → DashboardPPTXData)
- [ ] Conectar botón "Descargar PPTX" en componente del dashboard
- [ ] Resolver iconos (opción 1: pre-render a base64 en build)
- [ ] Testear descarga en Chrome, Edge, Firefox
- [ ] Verificar que el PPTX abre correctamente en PowerPoint y Google Slides
