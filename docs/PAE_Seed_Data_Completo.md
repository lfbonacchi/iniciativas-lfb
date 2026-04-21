# PAE — Seed Data Completo (Parte 1: Iniciativas 1-4)

> Cada sección de cada formulario está completa campo por campo.
> Estos datos alimentan la generación de XLSX, PDF, PPTX y DOCX.

---

## Usuarios mock

| ID | Nombre | Rol global | Es VP | Vicepresidencia | Departamento |
|----|--------|-----------|-------|-----------------|-------------|
| u1 | Roberto Méndez | user | Sí | VP Upstream | Dirección Upstream |
| u2 | María López | area_transformacion | No | VP Upstream | Transformación Digital |
| u3 | Juan García | user | No | VP Upstream | Ingeniería de Producción |
| u4 | Ana Torres | user | No | VP Upstream | Operaciones Norte |
| u5 | Fernando Álvarez | user | No | VP Downstream | Refinación |
| u6 | Lucía Martínez | user | No | VP Upstream | Mantenimiento |
| u7 | Diego González | user | Sí | VP Downstream | Dirección Downstream |
| u8 | Sofía Romero | user | No | VP Upstream | Supply Chain |
| u9 | Pablo Díaz | area_transformacion | No | VP Upstream | Transformación Digital |
| u10 | Carolina Vega | user | No | VP Upstream | Geociencias |

---

# INICIATIVA 1: Optimización predictiva de pozos maduros

**ID**: ini-001 | **Dimensión**: Producción | **Tipo**: Resultado | **UG**: Upstream Norte
**Creada**: 2025-11-15 | **Estado actual**: Etapa 2, F2 en borrador (45%)
**Promotor**: Juan García (u3) | **LD**: María López (u2) | **PO**: Juan García (u3, asignado en G1)
**BO**: Ana Torres (u4) | **Sponsor**: Roberto Méndez (u1)

---

## F1 — Propuesta (COMPLETO — Versión Final aprobada)

### Sección 1: Información general
| Campo | Valor |
|-------|-------|
| Nombre la iniciativa | Optimización predictiva de pozos maduros |
| Unidad de Gestión | Upstream Norte |
| Áreas involucradas | Ingeniería de Producción, Operaciones Norte, Mantenimiento |
| Tipo de iniciativa | Resultado |

### Sección 2: Propósito
Para los ingenieros de producción del área Norte quienes necesitan anticipar la declinación de pozos maduros y optimizar el timing de intervenciones.

El sistema de optimización predictiva es una plataforma de monitoreo y predicción basada en modelos de machine learning.

Que permite predecir el comportamiento de producción de pozos maduros con 30 días de anticipación y recomendar intervenciones óptimas basadas en el análisis automatizado de más de 200 variables por pozo.

A diferencia del proceso actual basado en análisis manual de curvas de declinación que demora 5 días por pozo y depende de la experiencia individual de cada ingeniero, nuestro producto automatiza el análisis, estandariza las recomendaciones y reduce el tiempo de decisión de 5 días a 4 horas.

### Sección 3: Necesidad/oportunidad y prioridad

| Stakeholder | Dolor / oportunidad | Métrica | Dato inicio | Target | Prioridad |
|-------------|-------------------|---------|-------------|--------|-----------|
| Usuario (Ing. Producción) | Análisis manual de curvas de declinación demora 5 días por pozo, limitando la cantidad de pozos que se pueden evaluar por mes | Tiempo de análisis por pozo | 5 días | 4 horas | Alta |
| Usuario (Operador de campo) | Las intervenciones tardías causan pérdida de producción irrecuperable en pozos maduros que ya están en declinación natural | Producción perdida por intervención tardía (m3/mes) | 850 m3/mes | <200 m3/mes | Alta |
| Interesado (Mantenimiento) | Se realizan pulling de bombas innecesarios por falta de diagnóstico preciso, generando costos evitables y tiempo improductivo | Intervenciones no planificadas por mes | 12/mes | 4/mes | Media |
| Interesado (Geociencias) | Los modelos de reservorio no incorporan datos de operación en tiempo real, limitando la precisión de las proyecciones de recuperación | Desviación de pronóstico de producción vs real | ±25% | ±10% | Media |
| Sponsor (VP Upstream) | La declinación acelerada en yacimientos maduros del área Norte amenaza los targets de producción anuales | Producción incremental área Norte (m3/año) | Base actual | +8,000 m3/año | Alta |
| Sponsor (VP Upstream) | El costo de intervención por pozo es alto y no siempre se justifica con la producción recuperada | ROI por intervención de pozo | 2.1x promedio | >5x promedio | Alta |

### Sección 4: Alineación estratégica
Esta iniciativa se alinea directamente con el Desafío 1 del Vision House de PAE: "Maximizar la recuperación de reservas en yacimientos maduros". El proyecto contribuye al objetivo de incrementar la producción del área Norte en un 5% anual sin nuevas perforaciones, optimizando la operación de los +500 pozos existentes.

La iniciativa está relacionada con la dimensión Producción y complementa directamente la iniciativa de Monitoreo Remoto de Instalaciones (ini-002) que provee los datos en tiempo real necesarios para alimentar los modelos predictivos. También se vincula con la Plataforma de Datos de Producción (ini-005) que provee el data lake donde se centralizan los datos históricos.

### Sección 5: Descripción de la iniciativa

**Estrategia y principales beneficios:**
Implementar modelos de machine learning entrenados con datos históricos de +500 pozos del área Norte (10 años de producción, workover, presión, temperatura, caudal). El sistema ingesta datos de sensores IoT (presión de boca de pozo, temperatura de fondo, caudal instantáneo), datos de workover históricos del sistema de mantenimiento, y parámetros de reservorio de Geociencias para generar predicciones a 30, 60 y 90 días.

Los beneficios principales son: reducción del 75% en tiempo de análisis por pozo, identificación temprana de pozos con riesgo de declinación acelerada, recomendaciones de intervención priorizadas por impacto económico, y estandarización del proceso de decisión que hoy depende de la experiencia individual.

**Alcance:**
Fase 1 (MVP): 20 pozos piloto en el sector Cerro Dragón Norte, seleccionados por variabilidad de producción y disponibilidad de datos. Incluye dashboard de predicciones, alertas automáticas y módulo de recomendaciones.
Fase 2: Expansión a 150 pozos del área Norte completa.
Fase 3 (post-MVP): Integración con sistema de órdenes de trabajo para automatizar la generación de intervenciones recomendadas.

**Interdependencias:**
- Monitoreo remoto de instalaciones (ini-002): provee datos de sensores en tiempo real que alimentan los modelos.
- Plataforma de datos de producción (ini-005): provee el data lake con datos históricos estandarizados.
- ERP SAP: datos de costos de intervención y materiales para calcular ROI de cada recomendación.

**Escalabilidad:**
En caso de éxito, la solución es replicable a los +2,000 pozos de todas las áreas operativas de PAE (Norte, Central, Sur, Golfo). El mismo framework de modelos puede adaptarse a pozos de gas y a pozos de inyección con ajustes de variables de entrada. Potencial de generar USD 15M+/año en valor si se escala a toda la operación.

### Sección 6: Impacto económico (Corrientes de valor)

| Corriente de valor | ¿Con impacto? (S/N) | Detalle |
|-------------------|---------------------|---------|
| PRODUCCIÓN (m3) | S | +8,000 m3/año estimados por intervenciones oportunas en los 20 pozos piloto. Escalado a 150 pozos: +45,000 m3/año |
| OPEX (M $ USD) | S | Reducción USD 450K/año en intervenciones innecesarias y optimización de las necesarias |
| CAPEX (M $ USD) | N | No aplica — la solución es software sobre infraestructura existente |
| PRODUCTIVIDAD (HH) | S | 2,400 HH/año ahorro en análisis manual de curvas de declinación |
| EXP AL RIESGO (%) | N | No aplica directamente |
| EMISIONES (MTnCO2 Eq) | N | No aplica directamente |
| CONS ENERGÍA (MW) | N | No aplica |

### Sección 7: Gestión del cambio

**Desafíos:**
1. Resistencia de ingenieros senior al cambio de proceso: llevan 15+ años usando análisis manual y confían en su experiencia intuitiva. Se requiere un período de validación de 6 meses donde el modelo corre en paralelo al análisis tradicional para generar confianza.
2. Calidad de datos históricos: los registros anteriores a 2018 tienen gaps y errores que pueden afectar el entrenamiento del modelo. Se necesita un proceso de limpieza y validación antes de entrenar.
3. Conectividad en campo: no todos los pozos del piloto tienen conectividad estable para transmisión de datos en tiempo real. Algunos requieren instalación de antenas adicionales.
4. Integración con procesos existentes: las recomendaciones del modelo deben insertarse en el flujo de trabajo actual de planificación de intervenciones sin duplicar esfuerzos.

**Participación en el desarrollo e implementación:**

| Área | Tipo de involucramiento |
|------|------------------------|
| Ingeniería de Producción | Involucrada — usuarios principales, validadores de recomendaciones |
| Operaciones Norte | Involucrada — operadores de campo ejecutan intervenciones recomendadas |
| Mantenimiento | Interesada — recibe órdenes de pulling optimizadas |
| Geociencias | Interesada — sus modelos de reservorio se complementan con predicciones ML |
| IT / Datos | Involucrada — infraestructura de datos, conectividad, seguridad |
| Transformación Digital | Involucrada — metodología, seguimiento, soporte técnico |

### Sección 8: Journey / hitos

| Hito | Fecha |
|------|-------|
| Kickoff y relevamiento de datos disponibles | Ene 2026 |
| Limpieza y preparación de datos históricos (500 pozos, 10 años) | Mar 2026 |
| Modelo predictivo v1 entrenado y validado en datos históricos | Jun 2026 |
| Instalación de sensores adicionales en 20 pozos piloto | Jul 2026 |
| Deploy de dashboard y módulo de alertas en ambiente de prueba | Ago 2026 |
| Inicio de piloto real con 20 pozos (modelo en paralelo a análisis manual) | Sep 2026 |
| Evaluación de resultados del piloto (6 meses de operación) | Dic 2026 |
| Ajuste de modelo y preparación para rollout | Feb 2027 |
| Rollout a 150 pozos del área Norte completa | Mar 2027 |

### Sección 9: Equipo

**Equipo etapa Propuesta:**

| Rol | Nombre y apellido | Posición | Vicepresidencia |
|-----|-------------------|----------|-----------------|
| Promotor | Juan García | Ingeniero Senior de Producción | VP Upstream |
| Líder de Dimensión | María López | Coordinadora Transformación Digital | VP Upstream |
| Data Scientist | Pablo Díaz | Científico de Datos | VP Upstream |
| Referente Operaciones | Ana Torres | Supervisora Operaciones Norte | VP Upstream |

**Responsables Gate 1:**

| Rol | Nombre y apellido | Posición | Área |
|-----|-------------------|----------|------|
| Sponsor | Roberto Méndez | VP Upstream | Dirección Upstream |
| Business Owner | Ana Torres | Supervisora Operaciones Norte | Operaciones |
| Área Transformación | María López | Coordinadora Transf. Digital | Transformación Digital |
| Adicional | Diego González | VP Downstream | Dirección Downstream |

**Equipo metodología:**

| Rol | Nombre y apellido | Posición | Vicepresidencia |
|-----|-------------------|----------|-----------------|
| Scrum Master | María López | Coordinadora Transf. Digital | VP Upstream |
| Soporte técnico | Pablo Díaz | Científico de Datos | VP Upstream |
| QA / Testing | Carolina Vega | Analista Geociencias | VP Upstream |

---

## Gateway 1 — APROBADO

- **Fecha envío**: 2026-01-10
- **Fecha resolución**: 2026-01-20
- **Estado**: Aprobado (unanimidad)

**Votos:**

| Aprobador | Rol | Voto | Feedback |
|-----------|-----|------|----------|
| Roberto Méndez | Sponsor | Aprobado | "Excelente alineación con los objetivos de producción del área Norte. Asegurar que el piloto incluya pozos con distintos perfiles de declinación para validar la generalización del modelo." |
| Ana Torres | Business Owner | Aprobado | "Agregar métrica de tiempo de respuesta ante fallas como indicador adicional. El equipo de operaciones necesita que las recomendaciones lleguen en horario operativo (6-18hs)." |
| María López | Área Transformación | Aprobado | "El approach de ML es correcto. Sugiero incluir un período de shadow mode de 3 meses antes de tomar decisiones operativas basadas solo en el modelo." |
| Diego González | Adicional | Aprobado | "Interesante potencial de replicación en downstream. Mantener documentación de la arquitectura para facilitar escalado futuro." |

**Decisiones del gateway:**
- PO asignado: Juan García
- Feedback de Ana Torres incorporado en VF (se agregó métrica de tiempo de respuesta)
- Se definió shadow mode de 3 meses como requisito previo al piloto real

---

## F1 — Versión Final (diferencias con borrador)

Cambios respecto al borrador original:
- Sección 3: Se agregó fila de métrica "Tiempo de respuesta ante fallas" con dato inicio 4-8 horas y target <1 hora (feedback Ana Torres)
- Sección 5: Se agregó "Período de shadow mode de 3 meses" en el alcance del MVP
- Sección 8: Se ajustó timeline para incluir shadow mode entre piloto y rollout

---

## F2 — Dimensionamiento (EN BORRADOR — 45%)

### Sección 1: Información general (heredado F1 VF)
*Sin cambios respecto a F1 VF*

### Sección 2: Propósito (heredado F1 VF)
*Sin cambios respecto a F1 VF*

### Sección 3: Necesidad/oportunidad (heredado F1 VF + campos nuevos)

**Heredado F1:** Tabla de dolores/oportunidades completa (sin cambios)

**Nuevo — Síntesis ampliada:**
El análisis de factibilidad técnica confirma la viabilidad del approach de ML. Se evaluaron 3 proveedores de plataforma de ML (Azure ML, AWS SageMaker, solución custom con Python/scikit-learn) y se seleccionó solución custom por menor dependencia de proveedor y mayor control sobre los modelos. Los datos históricos de 500 pozos están disponibles en el historiador PI y en SAP, con gaps manejables en el período 2015-2018 que se pueden interpolar. La infraestructura de conectividad en los 20 pozos piloto cubre el 85% — los 3 pozos restantes requieren instalación de antena satelital (USD 8K c/u).

### Sección 4: Alineación estratégica (heredado F1 VF + campos nuevos)

**Heredado F1:** Texto de alineación original (sin cambios)

**Nuevo — Prioridades estratégicas:**
La iniciativa contribuye al target de producción 2026 del área Norte (+3% vs 2025). El VP Upstream priorizó este proyecto como "Impacto Rápido" en la planificación Q1 2026, por encima de otras 4 propuestas de la dimensión Producción.

### Sección 5: Descripción iniciativa (heredado F1 VF + campos nuevos)

**Heredado F1:** Estrategia, alcance, interdependencias, escalabilidad (sin cambios)

**Nuevo — Procesos as-is / to-be:**

*As-is:* El ingeniero de producción revisa manualmente las curvas de declinación de cada pozo en Excel, compara con pozos similares, consulta al equipo de reservorio, y genera una recomendación de intervención en un documento Word. El proceso demora 5 días por pozo y permite evaluar ~6 pozos/mes por ingeniero.

*To-be:* El sistema ingesta datos automáticamente del historiador PI y sensores IoT, ejecuta el modelo predictivo cada 24 horas, y publica predicciones y recomendaciones en un dashboard. El ingeniero revisa las recomendaciones priorizadas por impacto económico y aprueba o ajusta. El proceso demora 4 horas por pozo y permite evaluar ~40 pozos/mes por ingeniero.

**Nuevo — Alternativas evaluadas:**

| Alternativa | Pros | Contras | Decisión |
|-------------|------|---------|----------|
| Azure ML managed | Rápido de implementar, soporte Microsoft | USD 180K/año licencia, vendor lock-in, datos salen de la red PAE | Descartada |
| AWS SageMaker | Flexible, buen ecosistema | USD 150K/año, equipo no tiene experiencia AWS | Descartada |
| Solución custom (Python) | Control total, sin licencias, datos on-prem | Requiere más desarrollo inicial | Seleccionada |

### Sección 6: Planificación implementación (NUEVO — completo)

**Equipo de trabajo:**

| Rol | Conocimiento necesario | Nombre y apellido | % Asignación | Vicepresidencia |
|-----|----------------------|-------------------|-------------|-----------------|
| Product Owner | Ingeniería de producción, análisis de pozos | Juan García | 50% | VP Upstream |
| Data Scientist Senior | ML, Python, series temporales | Pablo Díaz | 80% | VP Upstream |
| Data Engineer | ETL, APIs, historiador PI | Por definir | 100% | VP Upstream |
| Desarrollador Frontend | React, dashboards, visualización | Por definir | 80% | VP Upstream |
| Referente Operaciones | Conocimiento de campo, validación | Ana Torres | 20% | VP Upstream |

**Equipo alineación estratégica:**

| Rol | Nombre y apellido | Posición | Vicepresidencia |
|-----|-------------------|----------|-----------------|
| Sponsor | Roberto Méndez | VP Upstream | VP Upstream |
| Business Owner | Ana Torres | Supervisora Operaciones | VP Upstream |
| Portfolio | María López | Coord. Transf. Digital | VP Upstream |
| Líder de Dimensión | María López | Coord. Transf. Digital | VP Upstream |

**Equipo interesados y consultados:**

| Nombre y apellido | Posición | Vicepresidencia |
|-------------------|----------|-----------------|
| Carolina Vega | Analista Geociencias | VP Upstream |
| Lucía Martínez | Jefa Mantenimiento | VP Upstream |
| Diego González | VP Downstream | VP Downstream |

### Sección 7: Consideraciones digitales (NUEVO — completo)

**Tipo de solución:** Aplicación web con backend de modelos ML (Python/FastAPI), frontend dashboard (React), pipeline de datos (Apache Airflow), almacenamiento en PostgreSQL + data lake.

**Desafíos digitales:**
- Madurez digital: Media-alta. Los datos de producción existen en sistemas (PI, SAP) pero no están integrados.
- Disponibilidad y calidad de datos: Los datos post-2018 son confiables. Pre-2018 requieren limpieza (gaps de ~15%).
- Arquitectura: Se integra con la Plataforma de Datos (ini-005) como fuente primaria. API REST para consumo de predicciones.
- Seguridad: Datos sensibles de producción — requiere autenticación SSO y acceso solo desde red interna PAE.
- Ciencia de datos: Modelos de regresión (XGBoost/LightGBM) para predicción de declinación, clasificación para detección de anomalías.

**Integración y escalabilidad:** La arquitectura es modular — cada modelo de pozo es independiente y se puede escalar horizontalmente. La API de predicciones es consumible por cualquier sistema futuro (órdenes de trabajo, planificación de intervenciones).

### Sección 8: Gestión del cambio (NUEVO — PENDIENTE)
*No completado aún*

### Sección 9: Costos (NUEVO — PENDIENTE)
*No completado aún*

### Sección 10: Journey/hitos (heredado F1 VF + actualizado — completo)

| Hito | Fecha | Estado |
|------|-------|--------|
| Kickoff y relevamiento | Ene 2026 | Completado |
| Limpieza datos históricos | Mar 2026 | En curso |
| Modelo v1 entrenado | Jun 2026 | Planificado |
| Sensores en 20 pozos | Jul 2026 | Planificado |
| Dashboard en pruebas | Ago 2026 | Planificado |
| Shadow mode (3 meses) | Sep-Nov 2026 | Planificado |
| Piloto real 20 pozos | Dic 2026 | Planificado |
| Evaluación piloto | Mar 2027 | Planificado |
| Rollout 150 pozos | Jun 2027 | Planificado |

### Sección 11: Impacto económico (NUEVO — PENDIENTE)
*No completado aún*

### Sección 12: Equipo gate 2 (NUEVO — PENDIENTE)
*No completado aún*

---
---

# INICIATIVA 2: Monitoreo remoto de instalaciones

**ID**: ini-002 | **Dimensión**: Producción | **Tipo**: Resultado | **UG**: Upstream Norte
**Creada**: 2025-08-10 | **Estado actual**: Etapa 3, F3 en borrador (60%)
**Promotor**: Fernando Álvarez (u5) | **LD**: María López (u2) | **PO**: Fernando Álvarez (u5, asignado en G1)
**BO**: Ana Torres (u4) | **Sponsor**: Roberto Méndez (u1)

---

## F1 — Propuesta (COMPLETO — Versión Final)

### Sección 1: Información general
| Campo | Valor |
|-------|-------|
| Nombre la iniciativa | Monitoreo remoto de instalaciones |
| Unidad de Gestión | Upstream Norte |
| Áreas involucradas | Operaciones Norte, Mantenimiento, Seguridad Industrial, IT |
| Tipo de iniciativa | Resultado |

### Sección 2: Propósito
Para los operadores de campo y supervisores de instalaciones del área Norte quienes necesitan monitorear variables críticas de operación sin desplazarse físicamente a cada punto.

El sistema de monitoreo remoto es una red de sensores IoT con plataforma de visualización centralizada.

Que permite visualizar en tiempo real presión, temperatura, caudal y nivel en +50 instalaciones de superficie, generando alertas automáticas ante valores fuera de rango.

A diferencia de las rondas manuales diarias que cubren solo el 30% de los puntos de medición y dependen del horario del operador, nuestro producto ofrece cobertura 24/7 del 100% de las variables críticas con detección de anomalías en menos de 15 minutos.

### Sección 3: Necesidad/oportunidad y prioridad

| Stakeholder | Dolor / oportunidad | Métrica | Dato inicio | Target | Prioridad |
|-------------|-------------------|---------|-------------|--------|-----------|
| Usuario (Operador campo) | Rondas manuales de 6 horas diarias cubren solo 30% de los puntos de medición | Cobertura de monitoreo de variables críticas | 30% | 100% | Alta |
| Usuario (Supervisor) | Se entera de fallas en instalaciones con retraso de 4-8 horas, cuando el operador detecta en la ronda siguiente | Tiempo desde ocurrencia de falla hasta detección | 4-8 horas | <15 minutos | Alta |
| Interesado (Seguridad Ind.) | Riesgo de exposición del personal a condiciones peligrosas durante rondas en zonas remotas | Incidentes de seguridad vinculados a rondas manuales | 3/año | 0 | Alta |
| Interesado (Mantenimiento) | Fallas no detectadas escalan a correctivos costosos que podrían haberse prevenido | Costo promedio de correctivo por falla tardía (USD) | USD 45K | USD 12K | Media |
| Sponsor (VP Upstream) | Paradas no programadas por fallas no detectadas impactan la producción | Horas de parada no programada por año | 480 hrs/año | <120 hrs/año | Alta |
| Sponsor (VP Upstream) | El costo operativo de rondas manuales es alto y no escala | Costo anual de rondas manuales (USD) | USD 850K/año | USD 200K/año | Media |

### Sección 4: Alineación estratégica
La iniciativa se alinea con el Desafío 2 del Vision House: "Operación segura y eficiente de instalaciones de superficie". Contribuye directamente al objetivo de reducir incidentes de seguridad a cero y al objetivo de reducción de costos operativos del área Norte en un 10%.

Está relacionada con la dimensión Producción y es complementaria a la iniciativa de Optimización Predictiva de Pozos (ini-001) — el monitoreo remoto provee los datos en tiempo real que alimentan los modelos predictivos de esa iniciativa.

### Sección 5: Descripción de la iniciativa

**Estrategia y principales beneficios:**
Desplegar sensores IoT industriales (presión, temperatura, caudal, nivel) en las 50 instalaciones de superficie del área Norte, conectados vía red celular/satelital a una plataforma centralizada de visualización y alertas. Los beneficios incluyen: eliminación de rondas manuales de rutina (manteniendo solo rondas de verificación semanales), detección inmediata de anomalías, historial continuo de variables para análisis de tendencias, y reducción de riesgo de exposición del personal.

**Alcance:**
Fase 1 (MVP): 10 instalaciones de las más críticas (estaciones de bombeo, separadores principales), 4 variables por instalación, dashboard web, alertas por email y SMS.
Fase 2: Expansión a 50 instalaciones, integración con sistema de órdenes de trabajo.
Fase 3: Incorporación de cámaras de video en 15 instalaciones clave.

**Interdependencias:**
- Optimización predictiva (ini-001): consume los datos de monitoreo para modelos ML.
- Plataforma de datos (ini-005): los datos de sensores se almacenan en el data lake corporativo.
- Proveedor de conectividad: contrato con proveedor de red celular/satelital en zona de operación.

**Escalabilidad:**
Replicable a todas las áreas operativas de PAE (+200 instalaciones). Infraestructura de comunicación es la misma para agregar más sensores. Potencial de integrar con drones para inspección visual automatizada.

### Sección 6: Impacto económico

| Corriente de valor | ¿Con impacto? (S/N) | Detalle |
|-------------------|---------------------|---------|
| PRODUCCIÓN (m3) | S | +12,000 m3/año por reducción de paradas no programadas |
| OPEX (M $ USD) | S | Reducción USD 800K/año en costos de mantenimiento correctivo y rondas |
| CAPEX (M $ USD) | S | USD 420K inversión en sensores, conectividad e instalación |
| PRODUCTIVIDAD (HH) | S | 3,500 HH/año ahorro en rondas manuales de rutina |
| EXP AL RIESGO (%) | S | Reducción de exposición del personal en campo en un 70% |
| EMISIONES (MTnCO2 Eq) | S | Reducción de emisiones por menor uso de vehículos en rondas (~15 TnCO2/año) |
| CONS ENERGÍA (MW) | N | No aplica |

### Sección 7: Gestión del cambio

**Desafíos:**
1. Los operadores de campo pueden percibir el sistema como una amenaza a sus puestos de trabajo. Es fundamental comunicar que el monitoreo remoto libera tiempo para tareas de mayor valor, no elimina puestos.
2. Conectividad en zonas remotas: la cobertura celular es parcial, se requiere inversión en antenas satelitales para las instalaciones más aisladas.
3. Confiabilidad de sensores en condiciones extremas (Patagonia): temperaturas de -15°C, vientos de +100 km/h, polvo. Se requieren equipos de grado industrial IP67+.
4. Capacitación en el uso del dashboard y en la interpretación de alertas — evitar fatiga de alertas.

**Participación:**

| Área | Tipo de involucramiento |
|------|------------------------|
| Operaciones Norte | Involucrada — usuarios principales, feedback sobre ubicación de sensores |
| Mantenimiento | Involucrada — instalación de sensores, mantenimiento del sistema |
| Seguridad Industrial | Interesada — beneficiaria directa de reducción de riesgo |
| IT / Telecomunicaciones | Involucrada — red de comunicaciones, servidores, seguridad |
| Transformación Digital | Involucrada — metodología, integración con plataforma de datos |

### Sección 8: Journey / hitos

| Hito | Fecha |
|------|-------|
| Selección de proveedor de sensores y plataforma IoT | Oct 2025 |
| Instalación de sensores en 10 instalaciones piloto | Dic 2025 |
| Dashboard v1 desplegado con alertas básicas | Feb 2026 |
| Piloto operativo con operadores (3 meses) | Mar-May 2026 |
| Evaluación piloto y ajustes | Jun 2026 |
| Licitación para expansión a 50 instalaciones | Jul 2026 |
| Rollout completo 50 instalaciones | Nov 2026 |
| Integración con sistema de órdenes de trabajo | Feb 2027 |

### Sección 9: Equipo

**Equipo etapa Propuesta:**

| Rol | Nombre y apellido | Posición | Vicepresidencia |
|-----|-------------------|----------|-----------------|
| Promotor | Fernando Álvarez | Ingeniero de Procesos | VP Downstream |
| Líder de Dimensión | María López | Coord. Transf. Digital | VP Upstream |
| Referente IT | Pablo Díaz | Científico de Datos | VP Upstream |
| Referente Operaciones | Ana Torres | Supervisora Operaciones | VP Upstream |

**Responsables Gate 1:**

| Rol | Nombre y apellido | Posición | Área |
|-----|-------------------|----------|------|
| Sponsor | Roberto Méndez | VP Upstream | Dirección Upstream |
| Business Owner | Ana Torres | Supervisora Operaciones | Operaciones Norte |
| Área Transformación | María López | Coord. Transf. Digital | Transformación Digital |
| Área Transformación | Pablo Díaz | Científico de Datos | Transformación Digital |

**Equipo metodología:**

| Rol | Nombre y apellido | Posición | Vicepresidencia |
|-----|-------------------|----------|-----------------|
| Scrum Master | María López | Coord. Transf. Digital | VP Upstream |
| Soporte técnico | Pablo Díaz | Científico de Datos | VP Upstream |

---

## Gateway 1 — APROBADO
- **Fecha**: 2025-10-15 | **Estado**: Aprobado (unanimidad)
- PO asignado: Fernando Álvarez
- Feedback principal: Roberto Méndez pidió incluir análisis de ROI por instalación para priorizar el rollout. Se incorporó en F2.

---

## F2 — Dimensionamiento (COMPLETO — Versión Final)

### Secciones 1-5 (heredado F1 VF)
*Sin cambios significativos. Se actualizó la síntesis ampliada con datos de factibilidad.*

### Sección 3 — Nuevo: Síntesis ampliada
Se evaluaron 4 proveedores de plataforma IoT industrial. Se seleccionó Siemens MindSphere por compatibilidad con instrumentación existente en PAE y por disponibilidad de soporte local en Argentina. Costo de licencia: USD 4.5K/mes por 50 instalaciones. Alternativa evaluada: ThingWorx de PTC (más flexible pero sin soporte local).

La conectividad se resuelve con un mix: 35 instalaciones con cobertura celular 4G existente, 10 con repetidores celulares (USD 3K c/u), y 5 con enlace satelital Starlink (USD 1.5K setup + USD 100/mes c/u).

### Sección 6: Planificación implementación (NUEVO — completo)

**Equipo de trabajo:**

| Rol | Conocimiento necesario | Nombre y apellido | % Asignación | Vicepresidencia |
|-----|----------------------|-------------------|-------------|-----------------|
| Product Owner | Procesos industriales, IoT | Fernando Álvarez | 60% | VP Downstream |
| Ingeniero IoT | Sensores, protocolos industriales | Por definir (contratación) | 100% | VP Upstream |
| Desarrollador Backend | APIs, integración MindSphere | Por definir (contratación) | 100% | VP Upstream |
| Desarrollador Frontend | Dashboard, visualización | Por definir | 80% | VP Upstream |
| Técnico de campo | Instalación, cableado, puesta en marcha | Lucía Martínez (coordina) | 30% | VP Upstream |

**Equipo alineación estratégica:**

| Rol | Nombre y apellido | Posición | Vicepresidencia |
|-----|-------------------|----------|-----------------|
| Sponsor | Roberto Méndez | VP Upstream | VP Upstream |
| Business Owner | Ana Torres | Supervisora Operaciones | VP Upstream |
| Portfolio | María López | Coord. Transf. Digital | VP Upstream |
| Líder de Dimensión | María López | Coord. Transf. Digital | VP Upstream |

### Sección 7: Consideraciones digitales (NUEVO — completo)
**Tipo de solución:** Plataforma IoT industrial (Siemens MindSphere) con sensores de campo, gateway de comunicaciones, y dashboard customizado en React.
**Desafíos digitales:** Conectividad en zonas remotas (resuelto con mix celular/satelital), latencia aceptable para alertas (<30 seg), volumen de datos (~500 MB/día para 50 instalaciones).
**Integración:** API REST para enviar datos al data lake corporativo (ini-005). Alertas integradas con email corporativo y SMS.

### Sección 8: Gestión del cambio (NUEVO — completo)
Plan de comunicación en 3 fases: (1) Presentación a operadores explicando beneficios y que no hay impacto en puestos, (2) Capacitación hands-on con dashboard durante piloto, (3) Feedback mensual y ajustes. Embajadores: 2 operadores senior participan desde el piloto como referentes.

### Sección 9: Costos (NUEVO — completo)

**OPEX:**

| Subcategoría | Erogación (USD) | Detalle |
|-------------|----------------|---------|
| Licencias | 54,000/año | MindSphere: USD 4,500/mes x 12 |
| Conectividad | 36,000/año | Celular + satelital para 50 instalaciones |
| Soporte y mantenimiento | 30,000/año | Reemplazo de sensores, calibración |
| **Total OPEX** | **120,000/año** | |

**CAPEX:**

| Subcategoría | Erogación (USD) | Detalle |
|-------------|----------------|---------|
| Sensores e instrumentación | 220,000 | 200 sensores x USD 1,100 promedio |
| Instalación y cableado | 95,000 | Mano de obra + materiales para 50 instalaciones |
| Gateways y comunicaciones | 65,000 | 50 gateways + 10 repetidores + 5 Starlink |
| Desarrollo software | 40,000 | Customización dashboard y alertas |
| **Total CAPEX** | **420,000** | |

### Sección 10: Journey/hitos (actualizado)
*Mismos hitos que F1 con fechas ajustadas y estados actualizados*

### Sección 11: Impacto económico (NUEVO — completo)

**Beneficio bruto del año:**

| Corriente de valor | Beneficio esperado | Detalle |
|-------------------|-------------------|---------|
| PRODUCCIÓN (m3) | +12,000 m3/año | Reducción de paradas no detectadas |
| OPEX (USD) | -800,000/año | Menos correctivos + menos rondas |
| CAPEX (USD) | N/A | Inversión neta |
| HH | -3,500 HH/año | Eliminación de rondas de rutina |
| INTANGIBLE | Seguridad operativa | Zero incidentes vinculados a rondas |

**Beneficio bruto 5 años:**

| Corriente | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 |
|-----------|-------|-------|-------|-------|-------|
| PRODUCCIÓN (m3) | +4,000 | +12,000 | +12,000 | +15,000 | +15,000 |
| OPEX (USD) | -300K | -800K | -800K | -900K | -900K |
| PRODUCTIVIDAD (HH) | -1,200 | -3,500 | -3,500 | -4,000 | -4,000 |

### Sección 12: Equipo gate 2 (NUEVO — completo)
*Mismo equipo que sección 6 con ajustes: se confirmó Fernando Álvarez como PO.*

---

## Gateway 2 — APROBADO
- **Fecha**: 2026-01-10 | **Estado**: Aprobado (unanimidad)
- PO confirmado: Fernando Álvarez
- Feedback: Incorporar dashboard mobile para supervisores en campo (agregado como requisito de F3).

---

## F3 — MVP (EN BORRADOR — 60%)

### Secciones heredadas de F2 VF
*Carry-over completo sin cambios*

### Sección nueva: Descripción del MVP (COMPLETA)
Piloto con 10 instalaciones del sector Norte-3 (las de mayor frecuencia de fallas históricas). Se instalan 4 sensores por instalación (presión de entrada, presión de salida, temperatura, caudal). Dashboard web con mapa de instalaciones, gráficos de tendencia en tiempo real, y alertas configurables por umbral. Alertas se envían por email al supervisor y por SMS al operador de guardia.

### Sección nueva: Indicadores de medición (PENDIENTE)
*No completado aún*

### Sección nueva: Resultados esperados vs obtenidos (PENDIENTE)
*No completado aún — el MVP está en ejecución*

### Sección nueva: Aprendizajes (PENDIENTE)
*No completado aún*

---
---

# INICIATIVA 3: Gestión digital de integridad de ductos

**ID**: ini-003 | **Dimensión**: Seguridad | **Tipo**: Resultado | **UG**: Upstream
**Creada**: 2024-06-20 | **Estado actual**: LTP, F4 Visión 2026 en borrador (63%)
**Promotor**: Lucía Martínez (u6) | **PO**: Lucía Martínez (u6, asignado en G2)
**BO**: Diego González (u7) | **Sponsor**: Roberto Méndez (u1)

---

## F1 — Propuesta (COMPLETO — VF)

### Sección 1: Información general
| Campo | Valor |
|-------|-------|
| Nombre | Gestión digital de integridad de ductos |
| Unidad de Gestión | Upstream |
| Áreas involucradas | Mantenimiento, Integridad, Operaciones, Seguridad Industrial |
| Tipo | Resultado |

### Sección 2: Propósito
Para los ingenieros de integridad y el equipo de mantenimiento quienes necesitan gestionar la integridad de +800 km de ductos de manera centralizada y trazable.

El sistema de gestión digital de integridad es una plataforma web que centraliza datos de inspección, corrosión, espesor de pared y anomalías.

Que permite visualizar el estado de cada tramo de ducto, priorizar intervenciones por riesgo, y mantener trazabilidad completa de inspecciones y reparaciones.

A diferencia del sistema actual basado en planillas Excel dispersas y reportes PDF de inspecciones que se pierden en carpetas compartidas, nuestro producto centraliza toda la información en una base de datos única con dashboards de riesgo y alertas de vencimiento de inspecciones.

### Sección 3: Necesidad/oportunidad

| Stakeholder | Dolor / oportunidad | Métrica | Dato inicio | Target | Prioridad |
|-------------|-------------------|---------|-------------|--------|-----------|
| Usuario (Ing. Integridad) | Consolidar datos de inspección de 800 km de ductos requiere 2 semanas/trimestre | Tiempo de consolidación trimestral | 2 semanas | 1 día | Alta |
| Usuario (Técnico campo) | Reportes de inspección en papel se pierden o llegan tarde | Reportes perdidos o con retraso >1 semana | 15% | 0% | Alta |
| Interesado (Seguridad) | Riesgo de fuga por corrosión no detectada a tiempo | Fugas por corrosión no anticipada/año | 2/año | 0 | Alta |
| Interesado (Regulatorio) | Incumplimiento de frecuencia de inspección regulatoria | Inspecciones vencidas | 8% | 0% | Alta |
| Sponsor | Costo de reemplazo de tramos por falta de mantenimiento preventivo | Reemplazos de emergencia/año | 4 tramos | 1 tramo | Alta |
| Sponsor | Exposición regulatoria por falta de trazabilidad | Multas ambientales vinculadas a ductos (USD/año) | USD 180K | USD 0 | Media |

### Sección 4: Alineación estratégica
Alineada con Desafío 3 del Vision House: "Operación confiable y cumplimiento regulatorio". Contribuye al objetivo de cero fugas por corrosión y al cumplimiento del 100% de inspecciones regulatorias. Relacionada con la dimensión Seguridad.

### Sección 5: Descripción
**Estrategia:** Plataforma web que digitaliza el ciclo completo de gestión de integridad: registro de anomalías, seguimiento de corrosión, planificación de inspecciones, gestión de reparaciones, y reportes regulatorios automáticos.
**Alcance:** Fase 1: Ductos de producción del área Norte (350 km). Fase 2: Todos los ductos de PAE (800+ km).
**Interdependencias:** Sistema GIS existente para geolocalización de ductos. SAP PM para órdenes de mantenimiento.
**Escalabilidad:** Extensible a líneas de flowline, cañerías de planta, y tanques de almacenamiento.

### Sección 6: Impacto económico

| Corriente de valor | ¿Con impacto? | Detalle |
|-------------------|---------------|---------|
| PRODUCCIÓN (m3) | S | +950 m3/año por reducción de paradas por falla de ductos |
| OPEX (M USD) | S | -350K/año en inspecciones redundantes y gestión manual |
| CAPEX (M USD) | S | -1.2M en reemplazo anticipado de tramos (mantenimiento preventivo vs correctivo) |
| PRODUCTIVIDAD (HH) | S | -1,800 HH/año en consolidación manual de datos |
| EXP AL RIESGO | S | Reducción significativa de riesgo de fuga y multas regulatorias |
| EMISIONES | S | Reducción de emisiones fugitivas por detección temprana |

### Secciones 7-9: Gestión cambio, Journey, Equipo
*Completas con detalle similar al de ini-001 y ini-002. Equipo liderado por Lucía Martínez (Mantenimiento), con soporte de Pablo Díaz (datos) y Carolina Vega (geociencias).*

## Gateway 1: APROBADO (Sep 2024)
## F2 — Dimensionamiento: COMPLETO — VF
*Costos CAPEX USD 280K (desarrollo), OPEX USD 65K/año (licencias, hosting). Corrientes a 5 años documentadas.*
## Gateway 2: APROBADO (Ene 2025)
## F3 — MVP: COMPLETO — VF
*MVP: 100 km de ductos críticos digitalizados. Resultados: 0 fugas en tramos monitoreados (vs 1 fuga/semestre histórico). Inspecciones al día: 100%. Tiempo de consolidación: de 2 semanas a 2 horas.*
## Gateway 3: APROBADO (Jun 2025)

---

## F4 — Visión Anual 2026 (EN BORRADOR — 63%)

### Sección 1: Información general (heredado F3)
*Sin cambios*

### Sección 2: Propósito (heredado F3)
*Sin cambios*

### Sección 3: Necesidad/oportunidad (heredado F3 + actualizado 2026)

**Nuevo — Síntesis 2026:**
Con el éxito del MVP en 100 km, la prioridad 2026 es escalar a los 800 km completos e incorporar funcionalidades avanzadas: modelo predictivo de corrosión basado en datos históricos de espesor, integración con sistema GIS para visualización georreferenciada de riesgo, y generación automática de reportes para entes reguladores.

### Sección 4: Prioridades estratégicas 2026 (NUEVO — completa)
- Escalar de 100 km a 800 km de ductos digitalizados
- Integrar modelo predictivo de corrosión (colaboración con ini-001 para reutilizar framework de ML)
- Automatizar generación de reportes regulatorios trimestrales
- Implementar app mobile para inspectores de campo

### Sección 5: Transformación/solución 2026 (NUEVO — PENDIENTE)
*No completado aún*

### Sección 6: Planificación implementación 2026 (NUEVO — completa)

**Equipo 2026:**

| Rol | Nombre | % Asignación | VP |
|-----|--------|-------------|-----|
| Product Owner | Lucía Martínez | 50% | VP Upstream |
| Desarrollador Senior | Por definir | 100% | VP Upstream |
| Data Scientist | Pablo Díaz | 30% | VP Upstream |
| Inspector referente | Por definir | 40% | VP Upstream |

**Consideraciones digitales:** Integración con GIS requiere licencia ArcGIS Server (USD 25K/año). Modelo predictivo usa framework de ini-001 (costo marginal bajo).
**Desafíos/Riesgos:** Migración de datos históricos de 700 km adicionales puede tener gaps. Plan: contratar data entry temporal (2 meses).

**Journey 2026:**

| Hito | Fecha |
|------|-------|
| Migración datos 350 km restantes área Norte | Mar 2026 |
| Modelo predictivo de corrosión v1 | Jun 2026 |
| Integración GIS | Ago 2026 |
| App mobile para inspectores | Oct 2026 |
| Migración datos área Central y Sur (350 km) | Dic 2026 |
| Reportes regulatorios automáticos | Feb 2027 |

### Sección 7: Costos 2026 (NUEVO — PENDIENTE)
*No completado aún*

### Sección 8: Impacto económico 2026 (NUEVO — PENDIENTE)
*No completado aún*

---
---

# INICIATIVA 4: Automatización de sistemas de bombeo

**ID**: ini-004 | **Dimensión**: Producción | **Tipo**: Resultado | **UG**: Upstream Norte
**Creada**: 2024-03-10 | **Estado actual**: LTP, F4 2026 completo (reviewed), F5 2026 en borrador (30%)
**PO**: Juan García (u3) | **BO**: Ana Torres (u4) | **Sponsor**: Roberto Méndez (u1)

---

## F1, F2, F3 — Todos completos con VF y Gateways aprobados

### Propósito (F1)
Para los operadores de bombeo y supervisores de producción quienes necesitan optimizar la operación de +300 bombas de extracción que hoy se ajustan manualmente cada 2-4 semanas.

El sistema de automatización de bombeo es una plataforma de control basada en PLCs inteligentes y algoritmos de optimización.

Que ajusta parámetros de operación (velocidad de bombeo, presión de inyección, ciclos) en tiempo real basándose en condiciones de pozo, minimizando consumo energético y maximizando producción.

A diferencia del ajuste manual periódico que depende de la disponibilidad y experiencia del operador, nuestro producto optimiza continuamente las 24 horas y reacciona en minutos a cambios de condición del pozo.

### Impacto económico consolidado (F3 VF)

| Corriente | Impacto |
|-----------|---------|
| PRODUCCIÓN | +5,200 m3/año por operación continuamente optimizada |
| OPEX | -3,100,000 USD/año en energía eléctrica y mantenimiento de bombas |
| CAPEX | USD 620K inversión total (PLCs, cableado, software) |
| HH | -4,200 HH/año en ajustes manuales y monitoreo |

### F3 — MVP Resultados
- MVP en 30 bombas del sector Norte-2. Resultados en 6 meses: producción +4.8% vs bombas sin automatizar, consumo energético -22%, intervenciones de mantenimiento -35%.
- Aprendizajes: Los PLCs seleccionados (Siemens S7-1500) funcionan bien pero la integración con el SCADA legacy requirió desarrollo custom. Para el rollout se recomienda actualizar el SCADA en paralelo.

### Gateways
- G1 aprobado (Jul 2024), G2 aprobado (Nov 2024), G3 aprobado (Abr 2025)

---

## F4 — Visión Anual 2025 (COMPLETO — reviewed)

### Sección 4: Prioridades estratégicas 2025
- Escalar de 30 bombas a 100 bombas automatizadas
- Optimizar algoritmos de control con datos de 6 meses de operación del piloto
- Preparar integración con SCADA central para monitoreo unificado

### Sección 5: Transformación/solución 2025
Rollout en 3 lotes de ~23 bombas cada uno (Abr, Jul, Oct 2025). Cada lote incluye: instalación de PLC, configuración de algoritmo base, período de tuning de 2 semanas, y handover a operaciones.

### Sección 6: Planificación 2025

| Rol | Nombre | % Asignación |
|-----|--------|-------------|
| Product Owner | Juan García | 40% |
| Ingeniero de automatización | Externo (Siemens) | 100% |
| Desarrollador SCADA | Por definir | 80% |
| Técnico de campo | Equipo Mantenimiento (3 personas) | 50% |

### Sección 7: Costos 2025
- CAPEX: USD 340K (70 PLCs + instalación + cableado)
- OPEX: USD 75K (licencias software de control + soporte Siemens)

### Sección 8: Impacto 2025
- Producción: +3,200 m3
- OPEX ahorro: USD 1.8M
- HH ahorro: 2,800 HH

---

## F5 — Planificación Anual 2025 (COMPLETO — reviewed)

### Entregables planificados 2025

| Entregable | Responsable | Fecha plan | Estado | Avance |
|-----------|-------------|-----------|--------|--------|
| Rollout lote 1 (23 bombas sector Norte-1) | Juan García | Abr 2025 | Completado | 100% |
| Rollout lote 2 (23 bombas sector Norte-3) | Juan García | Jul 2025 | Completado | 100% |
| Rollout lote 3 (24 bombas sector Norte-4) | Juan García | Oct 2025 | Completado | 100% |
| Actualización algoritmo con datos 6 meses | Pablo Díaz | Dic 2025 | Completado | 100% |

### Indicadores de seguimiento 2025

| Indicador | Tipo | Baseline | Target | Actual | Trend |
|-----------|------|----------|--------|--------|-------|
| Bombas automatizadas | Avance | 30 | 100 | 100 | ✓ |
| Producción incremental (m3) | Resultado | +1,800 | +3,200 | +3,400 | ↑ |
| Consumo energético vs manual | Impacto | Base | -20% | -23% | ↑ |
| Intervenciones mantenimiento/mes | Impacto | 18/mes | 10/mes | 9/mes | ↑ |
| Uptime de sistema automatizado | Adopción | N/A | >98% | 99.2% | → |

---

## F4 — Visión Anual 2026 (COMPLETO — reviewed por sponsor)

### Sección 1-3: Heredado F3 VF + actualizaciones

### Sección 4: Prioridades estratégicas 2026
- Escalar de 100 a 200 bombas automatizadas (incluir áreas Central y Sur)
- Integrar con sistema SCADA central para monitoreo unificado desde sala de control
- Implementar optimización multi-pozo (optimizar conjuntos de bombas interconectadas, no individualmente)

### Sección 5: Transformación/solución 2026
Rollout de 100 bombas adicionales en 4 lotes trimestrales. Nuevo módulo de optimización multi-pozo que considera restricciones de infraestructura compartida (líneas de flowline, estaciones de medición). Integración SCADA permite control remoto desde sala central, reduciendo necesidad de presencia en campo.

### Sección 6: Planificación 2026

| Rol | Nombre | % Asignación |
|-----|--------|-------------|
| Product Owner | Juan García | 40% |
| Ing. Automatización | Externo (Siemens) | 80% |
| Desarrollador SCADA | Por definir | 100% |
| Data Scientist (multi-pozo) | Pablo Díaz | 40% |

**Consideraciones digitales:** SCADA central requiere actualización de versión (presupuesto IT aparte). Algoritmo multi-pozo requiere datos de topología de superficie.
**Desafíos:** Coordinación con IT para actualización SCADA. Variabilidad de condiciones entre áreas Norte/Central/Sur.
**Interdependencias:** Monitoreo remoto (ini-002) para datos en tiempo real de instalaciones relacionadas.

**Journey 2026:**

| Hito | Fecha |
|------|-------|
| Rollout lote 4 (25 bombas área Central) | Mar 2026 |
| Integración SCADA central | Jun 2026 |
| Rollout lote 5 (25 bombas área Central) | Jul 2026 |
| Módulo optimización multi-pozo v1 | Sep 2026 |
| Rollout lote 6 (25 bombas área Sur) | Oct 2026 |
| Rollout lote 7 (25 bombas área Sur) | Dic 2026 |

### Sección 7: Costos 2026
- CAPEX: USD 280,000 (100 PLCs + instalación en áreas Central/Sur)
- OPEX: USD 95,000 (licencias expandidas + soporte + conectividad áreas nuevas)

### Sección 8: Impacto 2026

**Beneficio bruto del año:**

| Corriente | Beneficio 2026 | Detalle |
|-----------|---------------|---------|
| PRODUCCIÓN (m3) | +2,800 | 100 bombas nuevas en ramp-up (efecto parcial año 1) |
| OPEX (USD) | -1,500,000 | 200 bombas optimizadas (100 full year + 100 parcial) |
| HH | -3,200 | Operadores liberados de ajuste manual |

**Corrientes a 5 años (desde 2026):**

| Corriente | 2026 | 2027 | 2028 | 2029 | 2030 |
|-----------|------|------|------|------|------|
| PRODUCCIÓN (m3) | +2,800 | +5,200 | +5,500 | +5,500 | +5,500 |
| OPEX (USD) | -1.5M | -3.1M | -3.3M | -3.3M | -3.3M |
| HH | -3,200 | -4,200 | -4,500 | -4,500 | -4,500 |

---

## F5 — Planificación Anual 2026 (EN BORRADOR — 30%)

### Entregables planificados 2026 (parcialmente cargados)

| Entregable | Responsable | Fecha plan | Estado | Avance |
|-----------|-------------|-----------|--------|--------|
| Rollout lote 4 (25 bombas área Central) | Juan García | Mar 2026 | En curso | 60% |
| Integración SCADA central | Por definir | Jun 2026 | Planificado | — |
| Rollout lote 5 (25 bombas) | Juan García | Jul 2026 | Planificado | — |

### Indicadores de seguimiento 2026 (PENDIENTE)
*No completado aún*
# PAE — Seed Data Completo (Parte 2: Iniciativas 5-8)

---

# INICIATIVA 5: Plataforma de datos de producción

**ID**: ini-005 | **Dimensión**: Data & Analytics | **Tipo**: Habilitadora | **UG**: Upstream
**Creada**: 2023-09-15 | **Estado actual**: LTP completo en 2025 y 2026
**PO**: Pablo Díaz (u9) | **BO**: Roberto Méndez (u1) | **Sponsor**: Roberto Méndez (u1)

## F1 — Propuesta (COMPLETO — VF)

### Sección 1: Información general
| Campo | Valor |
|-------|-------|
| Nombre | Plataforma de datos de producción |
| Unidad de Gestión | Upstream |
| Áreas involucradas | Transformación Digital, IT, Ingeniería de Producción, Geociencias, Mantenimiento |
| Tipo | Habilitadora |

### Sección 2: Propósito
Para todos los equipos técnicos de Upstream quienes necesitan acceder a datos de producción confiables, estandarizados y actualizados para tomar decisiones basadas en evidencia.

La plataforma de datos de producción es un data lake con capa de gobernanza, APIs estandarizadas y catálogo de datos.

Que unifica todas las fuentes de datos de producción (SCADA, historiador PI, SAP, mediciones manuales) en un único punto de acceso con calidad garantizada, eliminando las +40 planillas Excel que hoy se usan como fuente intermedia.

A diferencia del esquema actual donde cada área mantiene sus propias copias de datos con definiciones distintas de las mismas métricas, nuestro producto establece una fuente única de verdad con definiciones estándar y trazabilidad completa.

### Sección 3: Necesidad/oportunidad

| Stakeholder | Dolor / oportunidad | Métrica | Dato inicio | Target | Prioridad |
|-------------|-------------------|---------|-------------|--------|-----------|
| Usuario (Ing. Producción) | Cada análisis requiere 2-3 días de preparación de datos antes del análisis real | Tiempo de preparación de datos por análisis | 2-3 días | <2 horas | Alta |
| Usuario (Geociencias) | Los datos de producción para modelos de reservorio no coinciden con los de Ingeniería | Discrepancia entre fuentes para un mismo dato | 15-20% | <1% | Alta |
| Interesado (IT) | Mantener +40 planillas Excel con macros como infraestructura crítica | Fuentes de datos no gobernadas | 40+ | 0 | Alta |
| Interesado (todas las áreas) | No existe catálogo — nadie sabe qué datos existen ni dónde | Datasets catalogados y documentados | 0 | 100% | Media |
| Sponsor (VP Upstream) | Decisiones de inversión basadas en datos que tardan semanas en consolidar | Tiempo de generación reporte mensual de producción | 3 semanas | 1 día | Alta |
| Sponsor (VP Upstream) | Iniciativas de analytics bloqueadas por falta de datos accesibles | Iniciativas bloqueadas | 4 | 0 | Alta |

### Sección 4: Alineación estratégica
Alineada con la estrategia transversal de "Datos como activo estratégico". Iniciativa habilitadora que no genera valor directo pero habilita el valor de todas las iniciativas de analytics, ML y dashboards. Sin esta plataforma, ini-001, ini-002, ini-004 e ini-008 no pueden funcionar correctamente.

### Sección 5: Descripción
**Estrategia:** Data lake on-premise/cloud híbrido con: (1) ingesta automatizada desde PI, SCADA, SAP, mediciones manuales, (2) transformación y calidad con reglas de validación, (3) gobernanza con catálogo, linaje y ownership, (4) acceso vía APIs REST y conexión directa.
**Alcance:** Fase 1: datos upstream. Fase 2: downstream. Fase 3: soporte (RRHH, finanzas).
**Interdependencias:** Todas las iniciativas analytics dependen de esta plataforma.
### Sección 6: Impacto económico

| Corriente | Impacto |
|-----------|---------|
| PRODUCCIÓN | Indirecto — habilita +USD 15M en valor de otras iniciativas |
| OPEX | -200K/año en mantenimiento de planillas y procesos manuales |
| HH | -3,000 HH/año en preparación manual de datos |
| INTANGIBLE | Decisiones basadas en datos confiables |

### Secciones 7-9
Completas. Equipo: Pablo Díaz (PO), 2 data engineers, 1 data architect.

## Gateways: G1 (Feb 2024), G2 (Jun 2024), G3 (Nov 2024) — todos aprobados

## F3 — MVP (COMPLETO — VF)
MVP: Data lake con 200 pozos, 5 fuentes integradas, catálogo con 120 datasets, 3 APIs. Resultados: preparación de datos de 2.5 días a 3 horas, discrepancia entre fuentes de 18% a 2%.

---

## F4 — Visión Anual 2025 (COMPLETO — reviewed)

### Prioridades 2025
- Escalar de 200 a 500 pozos
- Data quality automático con alertas
- APIs self-service
- Dashboard de gobernanza

### Costos 2025: CAPEX USD 220K, OPEX USD 95K

### Journey 2025
| Hito | Fecha |
|------|-------|
| Ingesta áreas Central y Sur | Mar 2025 |
| Data quality automático v1 | Jun 2025 |
| Portal APIs self-service | Sep 2025 |
| Dashboard de gobernanza | Nov 2025 |

## F5 — Planificación Anual 2025 (COMPLETO — reviewed)

### Entregables

| Entregable | Responsable | Fecha | Estado | Avance |
|-----------|-------------|-------|--------|--------|
| Ingesta área Central (150 pozos) | Pablo Díaz | Mar 2025 | Completado | 100% |
| Ingesta área Sur (150 pozos) | Pablo Díaz | May 2025 | Completado | 100% |
| Data quality automático v1 | Pablo Díaz | Jun 2025 | Completado | 100% |
| Portal APIs self-service | Pablo Díaz | Sep 2025 | Completado | 100% |
| Dashboard gobernanza | Pablo Díaz | Nov 2025 | Completado | 100% |

### Indicadores 2025

| Indicador | Tipo | Baseline | Target | Actual | Trend |
|-----------|------|----------|--------|--------|-------|
| Datasets disponibles | Avance | 120 | 180 | 185 | ↑ |
| Pozos con datos integrados | Avance | 200 | 500 | 500 | ✓ |
| Usuarios activos API | Adopción | 8 | 35 | 42 | ↑ |
| Tiempo preparación datos | Resultado | 3 horas | <1 hora | 45 min | ↑ |

---

## F4 — Visión Anual 2026 (COMPLETO — reviewed)

### Prioridades 2026
- Incorporar datos downstream (refinería)
- Data quality ML v2
- SDK Python para data scientists
- Catálogo v2 con búsqueda inteligente

### Costos 2026: CAPEX USD 180K, OPEX USD 110K

## F5 — Planificación Anual 2026 (COMPLETO — reviewed)

### Entregables

| Entregable | Responsable | Fecha | Estado | Avance |
|-----------|-------------|-------|--------|--------|
| SDK Python en repo interno | Pablo Díaz | Mar 2026 | Completado | 100% |
| Data quality ML v2 | Pablo Díaz | Jun 2026 | En curso | 70% |
| Integración datos refinería | Pablo Díaz | Sep 2026 | Planificado | — |
| Catálogo v2 búsqueda inteligente | Pablo Díaz | Nov 2026 | Planificado | — |

### Indicadores 2026

| Indicador | Tipo | Baseline | Target | Actual | Trend |
|-----------|------|----------|--------|--------|-------|
| Datasets disponibles | Avance | 185 | 250 | 210 | ↑ |
| Tiempo onboarding nueva fuente | Resultado | 15 días | 3 días | 5 días | ↑ |
| Usuarios activos API | Adopción | 42 | 120 | 78 | ↑ |
| Anomalías detectadas ML/mes | Impacto | 0 | 20+ | 15 | ↑ |

---
---

# INICIATIVA 6: Digitalización de permisos ambientales

**ID**: ini-006 | **Dimensión**: Sustentabilidad | **Tipo**: Habilitadora
**Creada**: 2024-01-10 | **Estado actual**: LTP activo 2025 y 2026, sin F1/F2/F3
**PO**: Carolina Vega (u10) | **BO**: Diego González (u7) | **Sponsor**: Diego González (u7)

> Importada directamente en LTP sin pasar por gates.

---

## F4 — Visión Anual 2025 (COMPLETO — reviewed)

### Información general
| Campo | Valor |
|-------|-------|
| Nombre | Digitalización de permisos ambientales |
| Dimensión | Sustentabilidad |
| Áreas involucradas | Medio Ambiente, Legal, Operaciones, Relaciones Institucionales |
| Tipo | Habilitadora |

### Propósito
Para el equipo de medio ambiente y responsables de instalaciones quienes necesitan gestionar +400 permisos ambientales activos sin riesgo de vencimientos no detectados.

El sistema de digitalización de permisos es una plataforma web de tracking y gestión documental.

Que permite registrar cada permiso, su vigencia, requisitos de renovación, documentación y responsable, con alertas automáticas 90/60/30 días antes del vencimiento.

A diferencia del sistema actual de planillas Excel con +15 hojas donde los vencimientos se detectan cuando alguien revisa manualmente, nuestro producto garantiza cero vencimientos no anticipados.

### Necesidad/oportunidad

| Stakeholder | Dolor / oportunidad | Métrica | Dato inicio | Target | Prioridad |
|-------------|-------------------|---------|-------------|--------|-----------|
| Usuario (Analista MA) | Gestionar 400 permisos en Excel consume todo su tiempo | Tiempo en gestión administrativa | 80% | 30% | Alta |
| Usuario (Resp. Instalación) | No sabe qué permisos aplican ni cuándo vencen | Permisos con responsable notificado | 40% | 100% | Alta |
| Interesado (Legal) | Multas por operación con permisos vencidos | Multas ambientales por vencimiento (USD/año) | USD 200K | USD 0 | Alta |
| Sponsor (VP Downstream) | Riesgo reputacional y regulatorio por incumplimientos | Permisos vencidos sin gestión activa | 12% | 0% | Alta |

### Prioridades 2025
- Relevar 100% de permisos existentes y cargarlos al sistema
- Digitalizar los permisos más críticos (operación de pozos, emisiones, efluentes)
- Implementar alertas automáticas de vencimiento

### Transformación/solución 2025
Plataforma web con módulos de: registro de permisos (datos, vigencia, documentos adjuntos, responsable), alertas por email (90/60/30 días), dashboard de estado (vigente/próximo a vencer/vencido), y reportes para entes reguladores.

### Planificación 2025

| Rol | Nombre | % Asignación |
|-----|--------|-------------|
| Product Owner | Carolina Vega | 50% |
| Desarrollador Full-stack | Externo | 100% |
| Analista Medio Ambiente | Por definir | 40% |
| Referente Legal | Por definir | 20% |

### Costos 2025: CAPEX USD 120K (desarrollo), OPEX USD 35K (hosting, licencias)

### Impacto 2025
- Multas evitadas: USD 200K/año
- HH ahorro: 1,200 HH/año en gestión manual
- Reducción riesgo regulatorio: de 12% permisos vencidos a <2%

### Journey 2025
| Hito | Fecha |
|------|-------|
| Relevamiento y carga de 200 permisos críticos | Mar 2025 |
| Sistema web de tracking en producción | Jun 2025 |
| Migración de 200 permisos adicionales | Sep 2025 |
| Alertas automáticas activas | Nov 2025 |

---

## F5 — Planificación Anual 2025 (COMPLETO — reviewed)

### Entregables

| Entregable | Responsable | Fecha | Estado | Avance |
|-----------|-------------|-------|--------|--------|
| Carga 200 permisos críticos | Carolina Vega | Mar 2025 | Completado | 100% |
| Sistema web tracking v1 | Carolina Vega | Jun 2025 | Completado | 100% |
| Migración 200 permisos adicionales | Carolina Vega | Sep 2025 | Completado | 100% |
| Alertas automáticas configuradas | Carolina Vega | Nov 2025 | Completado | 100% |

### Indicadores 2025

| Indicador | Tipo | Baseline | Target | Actual | Trend |
|-----------|------|----------|--------|--------|-------|
| Permisos digitalizados | Avance | 0 | 400 | 400 | ✓ |
| Vencimientos detectados a tiempo | Impacto | 60% | 98% | 99% | ↑ |
| Multas por vencimiento (USD) | Resultado | 200K | 0 | 0 | ✓ |
| Tiempo de gestión por permiso (hrs) | Resultado | 4 hrs | 1 hr | 0.8 hrs | ↑ |

---

## F4 — Visión Anual 2026 (COMPLETO — reviewed)

### Prioridades 2026
- Escalar a todos los permisos (incluir operación downstream)
- Integrar con sistema de gestión documental corporativo
- Workflow de aprobación interna para renovaciones
- App mobile para inspectores de campo

### Transformación 2026
Extensión a permisos de downstream (refinería, despacho, logística). Workflow digital de renovación: cuando un permiso está próximo a vencer, el sistema crea automáticamente un proceso de renovación asignado al responsable, con checklist de documentos y aprobaciones internas requeridas. App mobile para que inspectores de campo registren condiciones de cumplimiento directamente desde el terreno.

### Costos 2026: CAPEX USD 95K, OPEX USD 45K

### Impacto 2026
- Permisos gestionados: de 400 a 420+ (incluye downstream)
- Tiempo de renovación: de 45 días a 12 días
- Adopción inspectores mobile: target 80%

### Journey 2026
| Hito | Fecha |
|------|-------|
| Migración permisos downstream | Mar 2026 |
| Workflow aprobación interna | Jun 2026 |
| Integración gestión documental | Sep 2026 |
| App mobile inspectores | Nov 2026 |

## F5 — Planificación Anual 2026 (COMPLETO — reviewed)

### Entregables

| Entregable | Responsable | Fecha | Estado | Avance |
|-----------|-------------|-------|--------|--------|
| Migración permisos downstream | Carolina Vega | Mar 2026 | Completado | 100% |
| Workflow aprobación renovaciones | Carolina Vega | Jun 2026 | En curso | 65% |
| Integración gestión documental | Carolina Vega | Sep 2026 | Planificado | — |
| App mobile inspectores | Carolina Vega | Nov 2026 | Planificado | — |

### Indicadores 2026

| Indicador | Tipo | Baseline | Target | Actual | Trend |
|-----------|------|----------|--------|--------|-------|
| Permisos digitalizados | Avance | 400 | 420+ | 415 | ↑ |
| Tiempo renovación (días) | Resultado | 45 | 12 | 18 | ↑ |
| Adopción inspectores mobile | Adopción | 0% | 80% | — | — |
| Workflows activos | Avance | 0 | 50+ | 22 | ↑ |

---
---

# INICIATIVA 7: Control de calidad con visión artificial

**ID**: ini-007 | **Dimensión**: Downstream | **Tipo**: Resultado
**Creada**: 2025-03-01 | **Estado actual**: Etapa 3, F3 completo, Gateway 3 pendiente
**PO**: Fernando Álvarez (u5) | **BO**: Diego González (u7) | **Sponsor**: Diego González (u7)

> Importada en Etapa 3. No tiene F1 ni F2.

---

## F3 — MVP (COMPLETO — enviado a Gateway 3)

### Información general
| Campo | Valor |
|-------|-------|
| Nombre | Control de calidad con visión artificial |
| Dimensión | Downstream |
| Áreas involucradas | Refinación, Control de Calidad, IT, Logística |
| Tipo | Resultado |

### Propósito
Para los supervisores de calidad y operadores de la línea de despacho de refinería quienes necesitan detectar defectos en envases, etiquetado y sellado con mayor precisión que la inspección visual manual.

El sistema de control de calidad con visión artificial es una solución de cámaras industriales con algoritmos de detección de defectos.

Que inspecciona el 100% de los productos despachados en tiempo real, detectando defectos de envase, etiquetado incorrecto y sellado deficiente con precisión superior al 99%.

A diferencia de la inspección visual manual que tiene 8% de tasa de error y solo puede cubrir muestreo del 20% de la producción, nuestro producto cubre el 100% con menos del 2% de falsos positivos.

### Descripción del MVP
Piloto en la línea de despacho #3 de refinería con 4 cámaras industriales de alta velocidad y modelo de detección entrenado con 50,000 imágenes clasificadas. Cobertura: defectos de envase (abolladuras, deformaciones), etiquetado incorrecto (posición, legibilidad, código de barras), y sellado deficiente (tapas sueltas, sellado incompleto).

Arquitectura: cámaras GigE Vision conectadas a PC industrial con GPU (NVIDIA T4), modelo YOLOv8 fine-tuned, interfaz de operador en pantalla táctil junto a la línea, integración con PLC de línea para rechazo automático de productos defectuosos.

### Indicadores de medición

| Indicador | Tipo | Baseline (manual) | Target | Resultado obtenido |
|-----------|------|-------------------|--------|--------------------|
| Tasa de detección de defectos | Asertividad | 92% | 99%+ | 98.7% |
| Falsos positivos | Asertividad | N/A | <2% | 1.8% |
| Cobertura de inspección | Adopción | 20% (muestreo) | 100% | 100% |
| Throughput de línea | Impacto | 1,200 u/hora | Sin reducción | Sin impacto |
| Reclamos de clientes por defecto | Resultado | 45/mes | <20/mes | 18/mes |
| Productos rechazados en destino | Resultado | 2.1% | <0.5% | 0.4% |

### Resultados esperados vs obtenidos

| Aspecto | Esperado | Obtenido | Evaluación |
|---------|----------|----------|------------|
| Detección de defectos | 99%+ | 98.7% | Cercano al target, mejorable con más datos |
| Falsos positivos | <2% | 1.8% | Dentro del target |
| Impacto en throughput | Cero | Cero | Logrado |
| Reducción reclamos | -55% | -60% | Superado |
| Ahorro en producto defectuoso | USD 180K/año | USD 195K/año (proyectado) | Superado |
| Tiempo de implementación | 4 meses | 5.5 meses | Demorado por integración PLC |
| Costo de implementación | USD 150K | USD 172K | Sobre-presupuesto por PLC |

### Aprendizajes y bloqueantes
1. El modelo requiere recalibración mensual por cambios estacionales en la iluminación de la planta. Se automatizó con pipeline de reentrenamiento incremental.
2. La integración con el PLC de la línea de despacho fue más compleja de lo estimado (+3 semanas) porque el PLC era un modelo legacy sin protocolo estándar. Se desarrolló un adaptador custom.
3. Los operadores de línea inicialmente desconfiaban del sistema. Se resolvió con 2 semanas de operación en modo "sugerencia" (sin rechazo automático) para que vieran la precisión.
4. El proveedor de cámaras tuvo demora de 3 semanas en la entrega por faltante de stock del modelo seleccionado.

### Conclusiones
El MVP demostró viabilidad técnica y económica. La tasa de detección de 98.7% es aceptable para producción y se espera superar 99% con el siguiente ciclo de reentrenamiento. El ROI proyectado es de 1.13x en el primer año solo con ahorro en producto defectuoso, sin contar el valor de la reducción de reclamos de clientes y la mejora reputacional. Se recomienda avanzar a rollout en las 4 líneas de despacho restantes.

### Equipo

| Rol | Nombre | % Asignación |
|-----|--------|-------------|
| Product Owner | Fernando Álvarez | 50% |
| ML Engineer | Externo (consultoría) | 100% |
| Ingeniero de Automatización | Externo (Siemens) | 60% |
| Supervisor Calidad | Por definir | 30% |

### Costos MVP
- CAPEX: USD 172K (4 cámaras USD 48K, PC industrial + GPU USD 35K, instalación USD 40K, desarrollo software USD 49K)
- OPEX: USD 25K/año (mantenimiento, licencias, recalibración)

### Impacto económico

**Beneficio bruto:**

| Corriente | Beneficio |
|-----------|---------|
| OPEX | -195K/año en producto defectuoso rechazado en destino |
| PRODUCTIVIDAD | -800 HH/año en inspección manual |
| INTANGIBLE | Reducción reclamos de clientes, mejora reputacional |

**Corrientes a 5 años (si se escala a 5 líneas):**

| Corriente | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 |
|-----------|-------|-------|-------|-------|-------|
| OPEX ahorro (USD) | -195K | -650K | -700K | -700K | -700K |
| HH ahorro | -800 | -2,500 | -2,800 | -2,800 | -2,800 |

## Gateway 3: PENDIENTE
- Enviado: 2026-03-15
- Aprobadores: Diego González (sponsor), Fernando Álvarez (BO/PO), María López (Área Transf.), Pablo Díaz (Área Transf.)
- Estado: Esperando votos (Roberto Méndez ya votó aprobado, restan 3)

### Archivos en carpeta

```
/Iniciativas/Control de calidad con vision artificial/
  /Etapa 3/
    ETAPA_3_formulario.xlsx
    ETAPA_3_formulario.pdf
    Presentacion_3_VF.pptx
    Notadeprensa_3_VF.docx
    /archivos adicionales/
      Propuesta_original_2024.docx (importado)
      Dimensionamiento_2024.xlsx (importado)
      Fotos_instalacion_camaras.zip (subido manual)
```

---
---

# INICIATIVA 8: Dashboard ejecutivo de operaciones

**ID**: ini-008 | **Dimensión**: Data & Analytics | **Tipo**: Habilitadora
**Creada**: 2025-10-01 | **Estado actual**: LTP, solo F4 2026 completo
**PO**: Sofía Romero (u8) | **BO**: Roberto Méndez (u1) | **Sponsor**: Roberto Méndez (u1)

> Solo tiene F4 (Visión Anual). F5 no completado todavía.

---

## F4 — Visión Anual 2026 (COMPLETO — reviewed)

### Información general
| Campo | Valor |
|-------|-------|
| Nombre | Dashboard ejecutivo de operaciones |
| Dimensión | Data & Analytics |
| Áreas involucradas | Dirección Upstream, Dirección Downstream, Supply Chain, Seguridad, Sustentabilidad |
| Tipo | Habilitadora |

### Propósito
Para la mesa de VPs y gerentes de área quienes necesitan una visión consolidada y en tiempo real del estado operativo de PAE para tomar decisiones estratégicas.

El dashboard ejecutivo es una plataforma web de visualización que unifica KPIs de producción, costos, seguridad y sustentabilidad.

Que consolida en una vista única y actualizada diariamente la información que hoy se genera en +15 reportes Excel mensuales preparados manualmente por distintas áreas.

A diferencia del proceso actual donde cada VP recibe reportes distintos en formatos distintos con datos de hace 2-4 semanas, nuestro producto ofrece datos frescos (D-1) en un formato unificado y navegable.

### Necesidad/oportunidad

| Stakeholder | Dolor / oportunidad | Métrica | Dato inicio | Target | Prioridad |
|-------------|-------------------|---------|-------------|--------|-----------|
| Usuario (VP Upstream) | Recibe 8 reportes Excel mensuales que no son comparables entre sí | Reportes manuales que recibe/mes | 8 | 1 (dashboard) | Alta |
| Usuario (VP Downstream) | Los datos de su reporte mensual tienen 3-4 semanas de antigüedad | Antigüedad de los datos en reportes | 3-4 semanas | D-1 (ayer) | Alta |
| Interesado (Analistas) | Pasan 60% del tiempo consolidando datos para reportes en vez de analizarlos | % tiempo en consolidación vs análisis | 60/40 | 20/80 | Alta |
| Interesado (Supply Chain) | No tiene visibilidad del impacto de producción en la cadena de suministro | Indicadores de producción visibles para Supply Chain | 0 | 10+ | Media |
| Sponsor (VP Upstream) | Las reuniones de dirección se basan en datos que nadie confía al 100% | Nivel de confianza en datos de reporte (encuesta) | 3.2/5 | 4.5/5 | Alta |
| Sponsor (VP Upstream) | Imposible hacer drill-down cuando un número no cierra | Capacidad de drill-down por área/VP | No existe | Hasta nivel de instalación | Alta |

### Prioridades estratégicas 2026
- Consolidar los KPIs más críticos de las 5 dimensiones en una vista única
- Datos actualizados D-1 (no mensual)
- Drill-down por VP, área, dimensión, instalación
- Exportable a PPT para reuniones de directorio

### Transformación/solución 2026
Dashboard web con 4 módulos:
1. **Producción**: producción diaria por área, acumulado vs target, split por pozo/instalación
2. **Costos**: OPEX/CAPEX ejecutado vs presupuesto, desvíos, proyección año
3. **Seguridad**: incidentes, días sin accidentes, indicadores líderes/rezagados
4. **Sustentabilidad**: emisiones, permisos, consumo energético, residuos

Cada módulo permite drill-down desde nivel corporativo hasta nivel de instalación. Comparativas entre áreas y contra mismo período año anterior. Exportación a PPTX con un click para reuniones de dirección.

Fuente de datos: Plataforma de datos de producción (ini-005) como fuente principal. SAP FI para datos financieros. Sistema de gestión de seguridad para indicadores HSE. Sistema de permisos (ini-006) para sustentabilidad.

### Planificación 2026

**Equipo:**

| Rol | Nombre | % Asignación |
|-----|--------|-------------|
| Product Owner | Sofía Romero | 60% |
| Data Engineer | Pablo Díaz | 30% |
| Desarrollador Frontend Senior | Por definir (contratación) | 100% |
| Desarrollador Frontend Junior | Por definir (contratación) | 100% |
| Diseñador UX | Externo (consultoría) | 40% |

**Equipo alineación estratégica:**

| Rol | Nombre | Posición | VP |
|-----|--------|----------|-----|
| Sponsor | Roberto Méndez | VP Upstream | VP Upstream |
| Business Owner | Roberto Méndez | VP Upstream | VP Upstream |
| Co-sponsor | Diego González | VP Downstream | VP Downstream |
| Portfolio | María López | Coord. Transf. Digital | VP Upstream |

**Interesados:**

| Nombre | Posición | VP |
|--------|----------|-----|
| Ana Torres | Supervisora Operaciones | VP Upstream |
| Fernando Álvarez | Ing. Procesos Refinería | VP Downstream |
| Carolina Vega | Analista Geociencias | VP Upstream |

### Consideraciones digitales
**Tipo de solución:** App web React con backend Node.js/Express, conectado al data lake de ini-005 vía APIs. Visualizaciones con D3.js/Recharts.
**Desafíos:** La calidad de datos varía por fuente — el dashboard no puede ser mejor que sus datos de entrada. Dependencia crítica de ini-005 para datos de producción.
**Integración:** APIs del data lake (ini-005) + SAP FI REST API + sistema HSE (por definir conector).
**Seguridad:** Solo accesible desde red interna, autenticación SSO, permisos por VP (cada uno ve solo sus datos + datos corporativos).

### Interdependencias

| Iniciativa/sistema | Referente |
|-------------------|-----------|
| Plataforma de datos (ini-005) | Pablo Díaz |
| SAP FI | Área de Finanzas (por definir) |
| Sistema HSE | Seguridad Industrial (por definir) |
| Permisos ambientales (ini-006) | Carolina Vega |

### Desafíos/Riesgos

| Riesgo | Acción | Resultado esperado | Fecha | Responsable |
|--------|--------|-------------------|-------|-------------|
| ini-005 no tiene datos downstream a tiempo | Coordinar con Pablo Díaz timeline de integración | Datos downstream disponibles Sep 2026 | Mar 2026 | Sofía Romero |
| VPs tienen expectativas distintas de KPIs | Workshop de definición de KPIs con cada VP | Consenso en top 20 KPIs | Feb 2026 | Sofía Romero |
| Conector SAP FI no existe | Evaluar opciones (API SAP, extracción batch) | Decisión técnica documentada | Mar 2026 | Pablo Díaz |
| Adopción baja si UX no es intuitiva | Prototipo con usuarios antes de desarrollo | Validación UX con 5 usuarios | Abr 2026 | Externo UX |

### Journey 2026

| Hito | Fecha |
|------|-------|
| Workshop KPIs con VPs | Feb 2026 |
| Prototipo UX validado con usuarios | Abr 2026 |
| Módulo Producción v1 (datos upstream) | Jun 2026 |
| Módulo Costos v1 (SAP FI integrado) | Ago 2026 |
| Módulo Seguridad v1 | Oct 2026 |
| Módulo Sustentabilidad v1 | Nov 2026 |
| Dashboard completo en producción | Dic 2026 |

### Costos 2026

**CAPEX:**

| Subcategoría | Erogación (USD) | Detalle |
|-------------|----------------|---------|
| Desarrollo | 110,000 | 2 desarrolladores + PO + diseño UX |
| Infraestructura | 25,000 | Servidores, base de datos cache |
| Consultoría UX | 15,000 | Diseño de interface y validación |
| **Total CAPEX** | **150,000** | |

**OPEX:**

| Subcategoría | Erogación (USD) | Detalle |
|-------------|----------------|---------|
| Hosting y base de datos | 20,000/año | Servidores internos PAE |
| Licencias visualización | 15,000/año | Librería de gráficos premium |
| Soporte y mantenimiento | 10,000/año | Bug fixes, actualizaciones |
| **Total OPEX** | **45,000/año** | |

### Impacto económico 2026

**Beneficio bruto:**

| Corriente | Beneficio | Detalle |
|-----------|---------|---------|
| HH | -2,400 HH/año | Eliminación de consolidación manual de 15 reportes |
| INTANGIBLE | Decisiones en tiempo real | De datos de hace 30 días a datos de ayer |
| INTANGIBLE | Confianza en datos | Una fuente única vs múltiples Excel |
| INTANGIBLE | Agilidad en reuniones | Drill-down en vivo vs "lo chequeo y te confirmo" |

**Corrientes a 5 años:**

| Corriente | 2026 | 2027 | 2028 | 2029 | 2030 |
|-----------|------|------|------|------|------|
| HH ahorro | -1,200 | -2,400 | -2,400 | -2,400 | -2,400 |

*(Año 1 parcial porque el dashboard está completo en Dic 2026)*

---

## F5 — Planificación Anual 2026 (NO COMPLETADO)

> Esta iniciativa solo tiene la visión anual (F4) completa. La planificación detallada con entregables e indicadores (F5) todavía no se completó.

---
---

# NOTAS PARA IMPLEMENTACIÓN

## Resumen de qué carpetas tiene cada iniciativa

| Iniciativa | Etapa 1 | Etapa 2 | Etapa 3 | LTP 2025 | LTP 2026 |
|-----------|---------|---------|---------|----------|----------|
| 1. Opt. pozos | ✓ completa | parcial (borrador) | — | — | — |
| 2. Monitoreo | ✓ completa | ✓ completa | parcial (borrador) | — | — |
| 3. Integridad ductos | ✓ completa | ✓ completa | ✓ completa | — | F4 borrador |
| 4. Automatización bombeo | ✓ completa | ✓ completa | ✓ completa | F4+F5 completos | F4 completo, F5 borrador |
| 5. Plataforma datos | ✓ completa | ✓ completa | ✓ completa | F4+F5 completos | F4+F5 completos |
| 6. Permisos amb. | — | — | — | F4+F5 completos | F4+F5 completos |
| 7. Visión artificial | — | — | ✓ (en gateway) | — | — |
| 8. Dashboard ejecutivo | — | — | — | — | F4 completo |

## Visibilidad por usuario mock

| Usuario | Iniciativas que ve | Rol en cada una |
|---------|-------------------|-----------------|
| Roberto Méndez (VP) | 1,2,3,4,5,8 como sponsor + portfolio completo | Sponsor/VP |
| María López (Transf.) | Todas | Área Transformación, LD en 1 y 2 |
| Juan García | 1 (promotor/PO), 4 (PO) | PO |
| Ana Torres | 1 (BO), 2 (BO), 4 (BO) | Business Owner |
| Fernando Álvarez | 2 (promotor/PO), 7 (PO) | PO |
| Lucía Martínez | 3 (promotor/PO) | PO |
| Diego González (VP) | 3,6,7 como sponsor + portfolio downstream | Sponsor/VP |
| Sofía Romero | 8 (PO) | PO |
| Pablo Díaz | 5 (PO), participa en 1,2,3,4,8 | PO en 5, equipo en otros |
| Carolina Vega | 6 (PO), participa en 1,3 | PO en 6, equipo en otros |

## Fecha de referencia: Abril 2026
