# Plataforma Estudiantil Inteligente

Plataforma web para la administración, consulta, clasificación, recomendación y uso académico de recursos educativos en colegios de secundaria de Bucaramanga, Santander. El sistema combina módulos administrativos, repositorio de recursos, foros académicos, aula colaborativa, recomendaciones contextuales y un asistente tipo chatbot.

El proyecto está construido con:

- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL, JWT, Multer.
- Frontend: React, TypeScript, Vite, React Router.
- Base de datos: PostgreSQL.
- Archivos: almacenamiento local en `uploads/`, servido públicamente por NestJS en `/uploads`.

## Estado Actual

La base funcional del software ya incluye:

- Autenticación con JWT.
- Roles, permisos y control de acceso por institución.
- CRUD administrativo separado por entidad.
- Repositorio/gestor de recursos educativos.
- Clasificación automática básica de recursos.
- Recomendaciones académicas basadas en reglas, palabras clave, categorías, grado e institución.
- Foros académicos con comentarios, recursos adjuntos y recursos existentes como soporte.
- Aula colaborativa con proyectos, integrantes, tablero de actividades, evidencias, entregas y revisión docente.
- Calificación de recursos por estrellas.
- Chatbot académico inicial para consultar recursos del repositorio.

## Estructura General

```text
.
├── src/                         Backend NestJS
│   ├── app.module.ts
│   ├── main.ts
│   ├── baseDatos/prisma/
│   ├── comun/
│   ├── generated/prisma/
│   └── modulos/
├── frontend/                    Frontend React + Vite
│   └── src/
│       ├── api/
│       ├── componentes/
│       ├── paginas/
│       └── rutas/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── uploads/                     Archivos subidos localmente
├── package.json                 Scripts backend
└── frontend/package.json        Scripts frontend
```

## Backend

El backend está en `src/` y usa NestJS con módulos por dominio. La base de datos se maneja con Prisma y PostgreSQL.

### Módulos Backend Principales

| Módulo | Ruta base | Responsabilidad |
| --- | --- | --- |
| `auth` | `/auth` | Login, generación de JWT y carga de permisos del usuario. |
| `instituciones` | `/instituciones` | CRUD de instituciones, logo y alcance institucional. |
| `usuarios` | `/usuarios` | CRUD de usuarios, roles, institución, grado escolar y estado. |
| `roles` | `/roles` | CRUD de roles y consulta de roles asignables. |
| `categorias` | `/categorias` | Categorías académicas por institución. |
| `tiposRecursos` | `/tipos-recursos` | Tipos de recurso educativo. |
| `recursos` | `/recursos` | Maestro de recursos, carga de archivos, clasificación y repositorio. |
| `gradosEscolares` | `/grados-escolares` | Catálogo de grados sexto a once. |
| `calificacionRecurso` | `/calificacion-recurso` | Calificación y resumen de estrellas por recurso. |
| `recomendaciones` | `/recomendaciones` | Recomendador académico de recursos. |
| `asistente` | `/asistente` | Chatbot inicial conectado al recomendador. |
| `foro` | `/foros` | Foros académicos, comentarios, adjuntos y recursos vinculados. |
| `aulaColaborativa` | `/aula-colaborativa` | Proyectos colaborativos, tablero, evidencias, entregas y revisión. |
| `tiposAprendizaje` | `/tipos-aprendizaje` | Maestro académico para rutas/diagnósticos. |
| `rutaAprendizaje` | `/ruta-aprendizaje` | Rutas de aprendizaje. |
| `detalleRutaAprendizaje` | `/detalle-ruta-aprendizaje` | Detalles de rutas de aprendizaje. |
| `diagnosticoAprendizaje` | `/diagnostico-aprendizaje` | Diagnósticos de aprendizaje. |
| `detalleDiagnosticoAprendizaje` | `/detalle-diagnostico-aprendizaje` | Detalles de diagnósticos. |

### Seguridad

El sistema usa:

- JWT en `Authorization: Bearer <token>`.
- `JwtAuthGuard` para validar sesión.
- Decorador `@RequierePermisos(...)` para proteger endpoints.
- Utilidades de permisos en `src/modulos/auth/utils/roles.util.ts`.
- Alcance institucional para evitar que usuarios no superadministradores vean o modifiquen datos de otras instituciones.

El frontend también valida permisos para ocultar rutas y opciones, pero la seguridad real está en el backend.

## Roles y Permisos

Los roles se leen desde la base de datos. No se debe depender del nombre del rol escrito en código para tomar decisiones críticas; el backend valida permisos asociados al rol.

Roles base cargados por `prisma/seed.ts`:

| Rol | Alcance actual |
| --- | --- |
| `superadministrador` | Acceso total al sistema mediante `sistema.total`. |
| `administrador` | Administración completa de una institución: usuarios, estudiantes, categorías, recursos, foros, aula colaborativa y reportes. |
| `docente` | Puede ver estudiantes de su institución, crear/subir recursos, participar en foros, crear foros públicos/institucionales, cerrar sus foros y gestionar aula colaborativa. No administra usuarios. |
| `estudiante` | Puede ver recursos de su grado e institución, participar en foros y trabajar en aula colaborativa. |
| `usuario administrativo` | Perfil orientado a reportes y participación limitada en comunidad académica. |

### Permisos Relevantes

Algunos permisos importantes:

- `sistema.total`
- `instituciones.*`
- `usuarios.*`
- `roles.*`
- `categorias.*`
- `tipos_recursos.*`
- `recursos.ver`
- `recursos.ver_todos_grados`
- `recursos.crear`
- `recursos.subir_archivo`
- `foros.ver`
- `foros.crear`
- `foros.crear_publico`
- `foros.comentar`
- `foros.cerrar`
- `foros.subir_recurso`
- `aula_colaborativa.*`
- `reportes.ver`

Cuando se cambien permisos o roles base, ejecutar:

```bash
npm run db:seed
```

Luego cerrar sesión e iniciar nuevamente para renovar los permisos guardados en `localStorage`.

## Frontend

El frontend está en `frontend/` y usa React con Vite.

### Rutas Frontend

| Ruta | Página | Permiso |
| --- | --- | --- |
| `/inicio` | Dashboard/inicio por rol | Sesión activa |
| `/admin/instituciones` | CRUD instituciones | `instituciones.crear` |
| `/admin/usuarios` | CRUD usuarios | `usuarios.ver` y no docente |
| `/admin/categorias` | CRUD categorías | `categorias.ver` |
| `/admin/tipos-recursos` | CRUD tipos de recursos | `tipos_recursos.ver` |
| `/admin/recursos` | Administración/maestro de recursos | `recursos.crear` |
| `/admin/roles` | CRUD roles | `roles.ver` |
| `/repositorio/recursos` | Gestor/repositorio de recursos | `recursos.ver` |
| `/foros` | Foros académicos | `foros.ver` |
| `/aula-colaborativa` | Aula colaborativa | `aula_colaborativa.ver` |
| `/reportes` | Reportes | `reportes.ver` |

### Componentes Frontend Relevantes

- `frontend/src/componentes/layout/appLayout.tsx`: layout principal, menú lateral dinámico por permisos y chatbot.
- `frontend/src/componentes/chatbot/chatbotWidget.tsx`: widget flotante de asistente académico.
- `frontend/src/componentes/recomendaciones/recursosRecomendados.tsx`: bloque reusable de recomendaciones contextuales.
- `frontend/src/api/adminApi.ts`: cliente HTTP centralizado para el backend.

La URL del backend está definida actualmente en:

```ts
frontend/src/api/adminApi.ts
```

Valor actual:

```ts
export const API_URL = 'http://localhost:3000';
```

Si el backend corre en otro host o puerto, ajustar ese valor.

## Modelo de Datos

El esquema está en `prisma/schema.prisma`.

Modelos principales:

- `Institucion`
- `Rol`
- `Permiso`
- `RolPermiso`
- `Usuario`
- `GradoEscolar`
- `Categoria`
- `TipoRecurso`
- `Recurso`
- `CalificacionRecurso`
- `Foro`
- `ForoCategoria`
- `ComentarioForo`
- `ComentarioForoRecurso`
- `ProyectoColaborativo`
- `ProyectoColaborativoIntegrante`
- `ProyectoColaborativoActividad`
- `ProyectoColaborativoEvidencia`
- `ProyectoColaborativoEntrega`
- `TipoAprendizaje`
- `RutaAprendizaje`
- `DetalleRutaAprendizaje`
- `AsignacionRutaAprendizaje`
- `DiagnosticoAprendizaje`
- `DetalleDiagnosticoAprendizaje`

## Funcionalidades por Módulo

### Login

- Autenticación con correo y contraseña.
- El backend retorna token, usuario, rol, permisos, institución y grado escolar.
- El frontend guarda `token` y `usuario` en `localStorage`.
- El menú y las rutas se construyen según permisos.

### Inicio

- Muestra accesos del usuario según su rol/permisos.
- El docente no ve administración de usuarios.
- El docente sí puede ver administración de recursos si tiene `recursos.crear`.

### Administración

Módulos administrativos con carpetas separadas de `.tsx` y `.css`:

- Instituciones.
- Usuarios.
- Categorías.
- Tipos de recursos.
- Roles.
- Recursos.

Los CRUD incluyen filtros, paginación, creación, edición e inactivación/reactivación según el módulo.

### Usuarios

- Usuarios pertenecen a una institución.
- Usuarios pueden tener grado escolar, importante especialmente para estudiantes.
- La contraseña se envía al crear usuario.
- En edición normal no se expone ni se edita contraseña para evitar guardar contraseñas sin hash.
- La fecha de nacimiento se normaliza para Prisma como `DateTime`.

### Grados Escolares

Catálogo base:

- Sexto.
- Séptimo.
- Octavo.
- Noveno.
- Décimo.
- Once.

Los estudiantes solo pueden ver recursos de su grado escolar, salvo permisos especiales.

### Recursos Administrativos

El módulo `/admin/recursos` permite:

- Crear recursos.
- Subir archivos.
- Definir título, resumen, URL externa, archivo, fuente, autor, grado, publicado, categoría, tipo e institución.
- Clasificar automáticamente categoría y tipo cuando el usuario los deja vacíos.
- Generar o completar palabras clave automáticamente hasta un máximo de 6.
- Asociar el recurso al usuario creador.

Archivos permitidos:

- PDF.
- Word: `.doc`, `.docx`.
- PowerPoint: `.ppt`, `.pptx`.
- Imágenes: `.png`, `.jpg`, `.jpeg`, `.webp`.
- Videos: `.mp4`, `.webm`.

Límite de archivo para recursos: 20 MB.

### Gestor de Recursos / Repositorio

Ruta:

```text
/repositorio/recursos
```

Permite:

- Ver recursos publicados y activos según permisos.
- Buscar por título, resumen, palabras clave, categoría, tipo, grado y archivo.
- Filtrar por tipo de archivo y grado.
- Mostrar vista de tarjetas o lista.
- Ver detalle en modal.
- Previsualizar:
  - PDF en iframe.
  - Imágenes.
  - Videos.
  - Word/PowerPoint mediante Office Viewer cuando la URL es accesible.
- Calificar recursos con estrellas.
- Ver promedio y total de calificaciones.
- Priorizar hasta 4 recursos recomendados con una estrella dentro de la lista.

Reglas de visibilidad:

- Superadministrador y perfiles con `recursos.ver_todos_grados`: pueden consultar más grados.
- Estudiante: solo recursos de su institución y grado.
- Usuarios sin `recursos.ver`: no acceden al repositorio.

### Recomendador Académico

Endpoint:

```text
GET /recomendaciones/recursos
```

El recomendador actual es de reglas, no usa una API externa de IA. Usa:

- Tema/contexto escrito.
- Palabras clave.
- Título.
- Resumen.
- Categoría.
- Tipo de recurso.
- Grado escolar.
- Institución y permisos del usuario.
- Calificaciones.

Se usa en:

- Gestor de recursos, integrado en la lista con estrella.
- Aula colaborativa, solo en la vista de trabajo del estudiante.
- Foros, bajo demanda mediante botón de recursos recomendados al crear o responder.
- Chatbot académico.

### Chatbot Académico

Componente flotante en la esquina de la aplicación.

Objetivo actual:

- Recibir preguntas simples del usuario.
- Extraer términos relevantes.
- Consultar el recomendador de recursos.
- Mostrar recursos relacionados y enlaces al repositorio.

No resume PDFs ni interpreta documentos todavía. Está preparado como base para integrar en el futuro una API LLM más robusta.

### Foros Académicos

Ruta:

```text
/foros
```

Permite:

- Crear foros académicos con título, descripción, categorías y alcance.
- Alcance institucional o público, según permisos.
- Ver feed de foros estilo publicaciones.
- Mostrar los últimos 3 comentarios en la tarjeta.
- Abrir conversación completa en modal.
- Comentar foros abiertos.
- Cerrar foros para impedir nuevos comentarios.
- Adjuntar archivo en un comentario; ese archivo se convierte en recurso del repositorio y se clasifica automáticamente.
- Vincular un recurso existente del repositorio a un comentario sin duplicarlo.
- Ver archivos adjuntos del foro desde icono/modal.
- Ver recursos asociados directamente en el comentario que les da contexto.

Recomendaciones en foros:

- Al crear foro: usa título, contenido y categorías seleccionadas.
- Al responder foro: usa título, descripción, categorías del foro y texto del comentario.
- El usuario puede tomar un recurso recomendado y usarlo como soporte del comentario.
- Cuando se usa un recurso existente, se crea una relación en `comentarios_foro_recursos`; no se crea otro recurso.

### Aula Colaborativa

Ruta:

```text
/aula-colaborativa
```

Objetivo:

Permitir que docentes creen espacios de trabajo colaborativo para proyectos académicos.

Incluye:

- Creación de proyectos con título, descripción, objetivo, curso, instrucciones, fecha límite, grado y categoría.
- Integrantes estudiantes por proyecto.
- Roles dentro del proyecto:
  - `lider`
  - `investigador`
  - `expositor`
- Vista de tarjetas de proyectos.
- Vista de información del proyecto.
- Vista de solución/trabajo con tablero tipo Trello.
- Actividades con responsable, estado y evidencias.
- Evidencias por actividad mediante archivos.
- Entrega formal del proyecto.
- Revisión docente con estado, comentarios y calificación.
- Si el docente aprueba la entrega, se publica como recurso del repositorio y se clasifica automáticamente.

Estados de actividad:

- `pendiente`
- `en_progreso`
- `en_revision`
- `completada`

Reglas importantes:

- Para pasar una actividad a `en_revision`, debe existir evidencia cargada.
- Para pasar de `en_revision` a `completada`, solo puede hacerlo el estudiante líder.
- Cuando hay una entrega pendiente de revisión docente, se bloquean acciones de carga/edición hasta que el docente responda.
- Si el docente pide ajustes, el estudiante puede volver a entregar manteniendo historial.

### Reportes

Existe una ruta y permiso base para reportes:

```text
/reportes
```

Actualmente funciona como base para el rol administrativo. Los reportes avanzados todavía están pendientes.

### Módulos Académicos Base

También existen módulos backend para:

- Tipos de aprendizaje.
- Rutas de aprendizaje.
- Detalles de rutas.
- Diagnósticos de aprendizaje.
- Detalles de diagnósticos.

Estos módulos están disponibles como base para futuras funcionalidades de aprendizaje adaptativo.

## Archivos y Uploads

Nest sirve los archivos de `uploads/` en:

```text
http://localhost:3000/uploads/...
```

Carpetas usadas:

```text
uploads/instituciones
uploads/recursos
uploads/aula-colaborativa
```

En Windows PowerShell se pueden crear así:

```powershell
New-Item -ItemType Directory -Force uploads\instituciones
New-Item -ItemType Directory -Force uploads\recursos
New-Item -ItemType Directory -Force uploads\aula-colaborativa
```

En Linux/macOS:

```bash
mkdir -p uploads/instituciones uploads/recursos uploads/aula-colaborativa
```

## Instalación Local

### Requisitos

- Node.js compatible con NestJS 11 y Vite 8.
- npm.
- PostgreSQL.
- Base de datos creada.

Ejemplo de base de datos local:

```sql
CREATE DATABASE plataforma_academica;
```

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASENA@localhost:5432/plataforma_academica?schema=public"
JWT_SECRET="cambia-este-secreto"
JWT_EXPIRES_IN="8h"

SEED_SUPERADMIN_EMAIL="superadmin@plataforma.edu.co"
SEED_SUPERADMIN_DOCUMENTO="0000000001"
SEED_SUPERADMIN_PASSWORD="Admin123456"
```

No subir `.env` al repositorio. Ya está ignorado en `.gitignore`.

### Instalar Backend

Desde la raíz:

```bash
npm install
```

Generar cliente Prisma:

```bash
npx prisma generate
```

Aplicar migraciones:

```bash
npx prisma migrate deploy
```

Cargar seed:

```bash
npm run db:seed
```

Crear carpetas de archivos si no existen:

```bash
mkdir -p uploads/instituciones uploads/recursos uploads/aula-colaborativa
```

En PowerShell:

```powershell
New-Item -ItemType Directory -Force uploads\instituciones
New-Item -ItemType Directory -Force uploads\recursos
New-Item -ItemType Directory -Force uploads\aula-colaborativa
```

Iniciar backend:

```bash
npm run start:dev
```

Backend por defecto:

```text
http://localhost:3000
```

### Instalar Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend por defecto:

```text
http://localhost:5173
```

## Usuario Inicial

El seed crea:

```text
Correo: superadmin@plataforma.edu.co
Contraseña: Admin123456
```

Si se cambian las variables `SEED_SUPERADMIN_*`, usar esos valores.

## Comandos Útiles

Backend:

```bash
npm run start:dev
npm run build
npm run db:seed
npm run test
```

Prisma:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma migrate dev
npx prisma format
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

## Plan de Pruebas Manuales

### 1. Preparación

1. Crear base de datos PostgreSQL.
2. Configurar `.env`.
3. Ejecutar migraciones.
4. Ejecutar seed.
5. Iniciar backend.
6. Iniciar frontend.
7. Iniciar sesión con superadministrador.

### 2. Validar Login y Roles

1. Iniciar sesión con superadministrador.
2. Crear una institución.
3. Crear usuarios con roles:
   - administrador
   - docente
   - estudiante
   - usuario administrativo
4. Cerrar sesión e iniciar con cada usuario.
5. Verificar que el menú cambie según permisos.

### 3. Validar Administración

Probar CRUD completo:

- Instituciones.
- Categorías.
- Tipos de recursos.
- Roles.
- Usuarios.
- Recursos.

Validar:

- Crear.
- Editar.
- Inactivar.
- Reactivar.
- Filtros.
- Paginación.
- Alcance institucional.

### 4. Validar Recursos

1. Crear categorías y tipos de recursos.
2. Crear recursos con archivo.
3. Crear recursos con URL externa.
4. Dejar categoría/tipo vacío para probar clasificación automática.
5. Verificar generación de máximo 6 palabras clave.
6. Publicar recursos.
7. Ir a `/repositorio/recursos`.
8. Probar:
   - búsqueda
   - filtros
   - vista tarjetas/lista
   - detalle
   - previsualización PDF/imagen/video
   - calificación por estrellas
   - recomendaciones con estrella

### 5. Validar Reglas por Grado

1. Crear estudiante de sexto.
2. Crear recursos de sexto y séptimo.
3. Iniciar sesión como estudiante de sexto.
4. Confirmar que solo ve recursos de sexto.

### 6. Validar Foros

1. Crear foro institucional.
2. Crear foro público.
3. Agregar varias categorías.
4. Comentar el foro.
5. Adjuntar archivo en un comentario.
6. Confirmar que el archivo se crea como recurso.
7. Usar botón de recursos recomendados al responder.
8. Elegir un recurso existente con “Usar en comentario”.
9. Confirmar que no se duplicó el recurso en la tabla `recursos`.
10. Confirmar que el recurso aparece asociado al comentario.
11. Cerrar foro.
12. Confirmar que ya no permite comentar.

### 7. Validar Aula Colaborativa

1. Crear proyecto como docente.
2. Agregar estudiantes.
3. Asignar roles: líder, investigador, expositor.
4. Crear actividades.
5. Como estudiante, subir evidencia.
6. Intentar pasar a `en_revision` sin evidencia: debe bloquear.
7. Pasar a `en_revision` con evidencia.
8. Como líder, pasar actividad a `completada`.
9. Enviar entrega final.
10. Confirmar bloqueo mientras está pendiente de revisión.
11. Como docente, revisar:
    - aprobar
    - pedir ajustes
    - rechazar
12. Si se aprueba, confirmar publicación del recurso en repositorio.

### 8. Validar Chatbot

1. Abrir widget flotante.
2. Preguntar por un tema existente, por ejemplo:

```text
Dónde encuentro recursos sobre fracciones matemáticas
```

3. Confirmar que responde con recursos.
4. Abrir un recurso sugerido.
5. Confirmar que navega al repositorio filtrando el recurso.

## Validaciones de Build

Backend:

```bash
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

Pruebas automatizadas backend, si se agregan specs:

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Solución de Problemas

### Cambié permisos pero el menú no cambia

El frontend guarda permisos en `localStorage`. Hacer:

1. Ejecutar seed si cambió la base:

```bash
npm run db:seed
```

2. Cerrar sesión.
3. Iniciar sesión nuevamente.

### Error de Prisma por campos nuevos

Ejecutar:

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

Reiniciar backend.

### Error al subir archivos

Verificar que existan:

```text
uploads/instituciones
uploads/recursos
uploads/aula-colaborativa
```

Verificar que el archivo tenga tipo permitido y no supere el límite.

### El frontend no conecta al backend

Revisar:

```ts
frontend/src/api/adminApi.ts
```

Debe apuntar al backend correcto:

```ts
export const API_URL = 'http://localhost:3000';
```

### Word o PowerPoint no previsualiza

El visor usa Office Viewer para documentos Office. Para que funcione, la URL del archivo debe ser accesible por el servicio de Microsoft. En local puede no visualizarse si `localhost` no es accesible externamente. El enlace “Abrir recurso” sigue funcionando.

## Consideraciones de Desarrollo

- Mantener permisos críticos en backend.
- Mantener CRUDs administrativos en carpetas separadas por entidad.
- No guardar contraseñas sin hash.
- No editar contraseñas desde el CRUD normal de usuarios.
- Ejecutar `npx prisma generate` después de cambiar `schema.prisma`.
- Ejecutar migraciones antes de probar cambios de base de datos.
- No subir `.env` ni archivos sensibles.
- Revisar que los recursos estén `publicado: true` y `estado: true` para que aparezcan en repositorio/recomendaciones.

## Próximos Desarrollos Sugeridos

- Reportes reales por institución, recurso, foro, calificación y aula colaborativa.
- Integración con un LLM externo para:
  - resumen de PDFs
  - explicación de documentos
  - preguntas sobre contenido
  - clasificación semántica avanzada
- Auditoría de acciones importantes.
- Recuperación/cambio de contraseña.
- Notificaciones para entregas, comentarios y revisiones.
- Dashboard estadístico por rol.
- Tests automatizados para permisos y flujos críticos.
