# Reglas de seguridad — PAE

Estas reglas se aplican a TODO el código del proyecto. No hay excepciones.

## Autenticación

### Fase 2-4 (actual)

- Mock auth: selector de usuario sin password. No hay sesión real ni JWT.  
- El usuario actual se guarda en localStorage. No contiene datos sensibles (no hay tokens reales).  
- VP se detecta del campo is\_vp del usuario mock.

### Fase 5 (futura)

- SSO Microsoft (Entra ID) como ÚNICA vía de autenticación. No hay registro con email/password.  
- JWT con expiración de 8 horas para sesiones.  
- Mock auth activable con AUTH\_MOCK=true para desarrollo local.  
- VP se detecta automáticamente del campo jobTitle de Entra ID. Nunca asignar manualmente.

## Acceso a datos y row-level security

Aplica en AMBAS fases. En cada función de acceso a datos:

- Verificar que hay un usuario autenticado (mock o real). Si no → error.  
- Verificar que el usuario tiene permiso sobre la iniciativa vía initiative\_members. Si no → error.  
- Nunca devolver datos de iniciativas a usuarios sin acceso.  
- Nunca exponer stack traces ni detalles internos en respuestas de error.  
- Formato de respuesta consistente: { success: boolean, data?: any, error?: { code: string, message: string } }

## Validación de inputs

- SIEMPRE validar con Zod antes de procesar cualquier dato.  
- Nunca confiar en datos del frontend.  
- En Fase 2-4: validar también datos leídos de localStorage (pueden estar corruptos o manipulados desde DevTools).

## Seguridad en localStorage (Fase 2-4)

- No guardar datos sensibles reales en localStorage (no hay tokens, passwords ni datos financieros reales — solo datos mock).  
- Sanitizar cualquier dato leído de localStorage antes de renderizarlo (prevenir XSS almacenado).  
- Nunca usar dangerouslySetInnerHTML con datos de localStorage.  
- Los datos en localStorage son visibles y editables por el usuario desde DevTools — esto es aceptable para la fase de demo, pero la capa de acceso a datos debe validar igualmente.

## Archivos subidos

- Verificar MIME type real (no confiar en la extensión del archivo).  
- Tamaño máximo: 50MB.  
- Extensiones permitidas: .docx, .xlsx, .pdf, .pptx, .png, .jpg, .mp4.  
- Sanitizar nombre de archivo (eliminar caracteres especiales, limitar longitud).

## Variables de entorno

- Todos los secrets van en .env (que está en .gitignore).  
- Nunca hardcodear claves, tokens, passwords, connection strings en el código.  
- Crear .env.example con las variables documentadas pero sin valores reales.

## Audit log

- Registrar en audit\_log: creación de iniciativas, cambios de estado, votaciones en gateway, cambios de permisos, subida de documentos, marcado de "reviewed" en F4/F5.  
- Cada registro incluye: user\_id, acción, timestamp, datos anteriores y nuevos.  
- En Fase 2-4: el audit\_log se guarda en localStorage junto con los demás datos.

## Fase 5 — Reglas adicionales

Estas reglas se activan cuando se migre al backend. No aplican en Fase 2-4.

### Endpoints de API

- SIEMPRE llamar getServerSession() al inicio de cada endpoint. Si no hay sesión → 401\.  
- Nunca usar queryRaw — solo Prisma Client.

### Rate limiting

- 100 requests/minuto para endpoints normales.  
- 10 requests/minuto para endpoints de login/auth.  
- Devolver 429 cuando se exceda.

### Cookies y tokens

- Cookies: HttpOnly, Secure, SameSite=Strict.  
- Tokens de Microsoft (access\_token, refresh\_token): encriptados con AES-256-GCM en la base de datos.  
- NEXTAUTH\_SECRET: mínimo 32 caracteres, aleatorio, en variable de entorno.

### Security headers (configurar en next.config.js)

- Content-Security-Policy  
- Strict-Transport-Security (HSTS)  
- X-Frame-Options: DENY  
- X-Content-Type-Options: nosniff  
- Referrer-Policy: strict-origin-when-cross-origin

### Base de datos

- PostgreSQL escucha solo en localhost (desarrollo) o red interna (producción).  
- Sin acceso externo a la DB.  
- HTTPS obligatorio en staging y producción.

