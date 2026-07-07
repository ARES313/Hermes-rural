# Proyecto Redes

Plataforma educativa local para escuelas sin internet, con aula virtual, libros, videos, recursos interactivos e IA local.

## Estructura del proyecto

- `ai/`
  - Contiene los modelos, prompts, colas y sincronización para la inteligencia artificial local.

- `client/`
  - Frontend de la aplicación (probablemente React).
  - `client/public/`: archivos estáticos públicos.
  - `client/src/`: código fuente del cliente.
    - `app/`: configuración general de la app.
    - `components/`: componentes reutilizables.
    - `features/`: páginas o secciones funcionales del sistema.
      - `admin/`
      - `ai-assistant/`
      - `auth/`
      - `flashcards/`
      - `forum/`
      - `portfolio/`
      - `quizzes/`
      - `resources/`
      - `students/`
      - `teachers/`
    - `hooks/`: hooks personalizados.
    - `pages/`: páginas de navegación.
    - `services/`: servicios HTTP y utilidades de API.
    - `styles/`: estilos globales y temas.
    - `types/`: definiciones de tipos.
    - `utils/`: utilidades generales.

- `docs/`
  - Documentación del proyecto.
  - `docs/api/`: documentación de la API.
  - `docs/arquitectura/`: arquitectura del sistema.
  - `docs/db-diagrams/`: diagramas de base de datos.

- `scripts/`
  - Scripts utilitarios para tareas varias.
  - `backup-db.js`: copia de seguridad de la base de datos.
  - `restore-db.js`: restauración de la base de datos.
  - `generate-tokens.js`: generación de tokens.
  - `sync-content.js`: sincronización de contenido.

- `server/`
  - Backend en Node.js con Express.
  - `package.json`: dependencias y scripts.
  - `src/app.js`: arranque del servidor y configuración básica.
  - `src/config/env.js`: carga de variables de entorno.
  - `src/routes/index.js`: rutas de la API (actualmente una ruta de salud).
  - `src/database/`: base de datos y esquema.
    - `Redes.db`: base de datos SQLite.
    - `schema/users.sql`: esquema inicial de usuarios.
    - `migrations/`, `seeds/`, `sqlite3/`: carpetas de apoyo para la DB.
  - `src/modules/`: carpetas para los distintos módulos del backend.
    - `ai/`, `analytics/`, `auth/`, `flashcards/`, `forum/`, `grades/`, `portfolio/`, `quizzes/`, `resources/`, `sync/`, `tokens/`, `users/`
  - `src/repositories/`: acceso a datos.
  - `src/services/`: lógica de negocio.
  - `src/utils/`: utilidades comunes.
  - `src/middleware/`: middleware de Express.

- `storage/`
  - Archivos y recursos locales para la plataforma.
  - `activities/`, `backups/`, `books/`, `images/`, `logs/`, `student-uploads/`, `videos/`

## Estado actual

- El backend tiene la base de Express y una ruta de prueba (`GET /api/health`).
- El frontend tiene la estructura de carpetas, pero no hay archivos de implementación en las carpetas principales.
- La base de datos SQLite ya está incluida en `server/src/database/Redes.db`.
- El proyecto está listo para continuar con la implementación de módulos y la conexión entre cliente y servidor.

## Cómo arrancar el backend

1. Ir a `server/`.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev` para iniciar con `nodemon`.
