# Cómo usar estos archivos en tu compu

## Paso 1 — Descargá todos los archivos de esta carpeta

Desde Claude, descargá cada archivo. Van a quedar en tu carpeta de Descargas.

## Paso 2 — Abrí la carpeta del proyecto

Abrí la Terminal (en Mac) y navegá a tu carpeta del proyecto:

cd iniciativas

## Paso 3 — Creá la subcarpeta .claude/rules/

mkdir \-p .claude/rules

Si ya la tenés creada de antes, este comando no rompe nada.

## Paso 4 — Copiá cada archivo a su lugar

Desde la carpeta de Descargas, mové cada archivo a la ubicación correcta:

| Archivo descargado | Dónde va dentro de iniciativas/ |
| :---- | :---- |
| CLAUDE.md | iniciativas/CLAUDE.md (en la raíz) |
| CLAUDE.local.md | iniciativas/CLAUDE.local.md (en la raíz) |
| .gitignore | iniciativas/.gitignore (en la raíz) |
| settings.json | iniciativas/.claude/settings.json |
| seguridad.md | iniciativas/.claude/rules/seguridad.md |
| frontend.md | iniciativas/.claude/rules/frontend.md |
| api.md | iniciativas/.claude/rules/api.md |
| modelo-y-datos.md | iniciativas/.claude/rules/modelo-y-datos.md |

## Paso 5 — Verificá que todo está en su lugar

Desde la terminal, dentro de la carpeta iniciativas/, corré:

ls \-la

Deberías ver:

CLAUDE.md

CLAUDE.local.md

.gitignore

.claude/

docs/

Y dentro de .claude/:

ls \-la .claude/

Deberías ver:

settings.json

rules/

Y dentro de rules/:

ls \-la .claude/rules/

Deberías ver:

seguridad.md

frontend.md

api.md

modelo-y-datos.md

## Paso 6 — Inicializá Git y hacé el primer commit

git init

git add CLAUDE.md .claude/ .gitignore

git commit \-m "config: CLAUDE.md \+ rules seguridad/frontend/api/modelo-y-datos"

IMPORTANTE: CLAUDE.local.md NO se agrega a Git (está en .gitignore). Es tu archivo personal — no se comparte con el equipo.

## Paso 7 — Listo para Claude Code

Ahora cuando abras Claude Code con el comando `claude` dentro de esta carpeta, va a leer automáticamente:

- CLAUDE.md (instrucciones del proyecto — siempre)  
- CLAUDE.local.md (tus preferencias personales — siempre)  
- .claude/rules/seguridad.md (reglas de seguridad — siempre)  
- .claude/rules/frontend.md (reglas de UI — cuando trabaja en src/app o src/components)  
- .claude/rules/api.md (reglas de API — cuando trabaja en src/app/api o src/lib)  
- .claude/rules/modelo-y-datos.md (modelo de datos y lógica — cuando trabaja en src/lib, src/data o src/types)

Probalo: escribí `claude` y preguntale "¿Qué sabés de este proyecto?" Debería responder con todo el contexto de PAE.

## Estructura final

iniciativas/

├── CLAUDE.md                    ← instrucciones del proyecto (compartido en Git)

├── CLAUDE.local.md              ← tus preferencias personales (NO en Git)

├── .gitignore                   ← excluye .env, node\_modules, CLAUDE.local.md

├── .claude/

│   ├── settings.json            ← configuración de Claude Code

│   └── rules/

│       ├── seguridad.md         ← reglas de seguridad (siempre cargado)

│       ├── frontend.md          ← reglas de UI (cargado en src/app, src/components)

│       ├── api.md               ← reglas de API (cargado en src/app/api, src/lib)

│       └── modelo-y-datos.md    ← modelo de datos y lógica (cargado en src/lib, src/data, src/types)

├── docs/                        ← documentos de referencia PAE (Word originales, specs)

└── src/                         ← (se crea en Fase 2 con Claude Code)  
