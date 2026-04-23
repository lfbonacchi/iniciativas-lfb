# Hola Sergio — Cómo correr esta app

Esta es la **Plataforma de Gestión de Portfolio de PAE**: una app interna para gestionar iniciativas de transformación digital. Está en fase frontend-first (sin backend, sin base de datos — todo corre en el browser con localStorage).

---

## 1. Qué necesitás instalar en tu compu

### Node.js 20 o superior (obligatorio)
Next.js 15 lo requiere. Viene con `npm` incluido.

- **Opción fácil:** descargalo de [nodejs.org](https://nodejs.org) (elegí la versión LTS).
- **Opción recomendada si vas a usar varias versiones:** instalá `nvm` o `fnm` y corré `nvm install 20`.

Para chequear que lo tenés bien:
```bash
node --version   # tiene que devolver v20.x.x o superior
npm --version
```

### Un browser moderno
Chrome o Edge. La app genera PPTX, PDF y XLSX directamente en el browser, así que necesita un navegador al día.

### (Opcional pero recomendado)
- **Git** — para versionar los cambios.
- **VSCode** — el editor que usamos.

---

## 2. Cómo levantar la app

Una vez que tenés la carpeta `iniciativas/` en tu compu:

```bash
cd iniciativas
npm install      # baja todas las dependencias (Next, React, etc.) — tarda 1-2 min
npm run dev      # levanta la app
```

Abrí [http://localhost:3000](http://localhost:3000) en el browser y listo.

---

## 3. Qué NO hace falta instalar a mano

Nada de lo siguiente se instala por separado — `npm install` lo baja todo automáticamente:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- pptxgenjs, xlsx, html2pdf.js, zod
- Todas las demás dependencias

Todo está listado en `package.json` y las versiones exactas quedan fijadas en `package-lock.json`.

---

## 4. Comandos útiles

```bash
npm run dev         # levantar la app en modo desarrollo (localhost:3000)
npm run typecheck   # chequear tipos de TypeScript sin compilar
npm run lint        # correr el linter
```

⚠ **No uses `npm run build`** — en esta fase da error por cómo está configurado pptxgenjs. Si querés verificar tipos, usá `npm run typecheck`.

---

## 5. Cómo resetear los datos

La app guarda todo en `localStorage` del browser (prefijo `mandarina_`). Para empezar de cero:

1. Abrí DevTools (F12)
2. Tab **Application** → **Local Storage** → `http://localhost:3000`
3. Click derecho → **Clear**
4. Refrescá la página

---

## 6. Estructura del proyecto (resumen)

```
iniciativas/
├── src/
│   ├── app/          → Rutas Next.js (App Router)
│   ├── components/   → Componentes UI reutilizables
│   ├── lib/          → Utilidades y capa de localStorage
│   ├── data/         → Seed data (usuarios, iniciativas de ejemplo)
│   └── types/        → Interfaces TypeScript
├── docs/             → Documentación funcional y formularios de referencia
├── public/           → Assets estáticos
├── CLAUDE.md         → Contexto y reglas del proyecto (leelo)
└── package.json      → Dependencias
```

---

## 7. Primera vez que entrás

- No hay login real — hay un **selector de usuario mock** (ver `docs/PAE_Seed_Data_Completo.md` para los 10 usuarios de prueba).
- Elegí un rol y explorá la app.
- Los dashboards cambian según el rol (PO, BO, VP, Área Transformación).

---

Cualquier cosa preguntame.

— Martu
