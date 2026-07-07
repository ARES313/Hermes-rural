<div align="center">

# 🏫 Proyecto Redes

### Plataforma Educativa Local — Aula Virtual sin Internet

[![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-✓-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Ollama](https://img.shields.io/badge/Ollama-✓-000000?logo=ollama&logoColor=white)](https://ollama.com)
[![Nginx](https://img.shields.io/badge/Nginx-✓-009639?logo=nginx&logoColor=white)](https://nginx.org)

**Creado para escuelas sin acceso a internet — todo corre 100% local, sin depender de la nube.**

</div>

---

## 📋 Tabla de Contenidos

- [✨ Características](#-características)
- [🧱 Stack Tecnológico](#-stack-tecnológico)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Cómo Empezar](#-cómo-empezar)
  - [Opción 1: Docker Compose (recomendado)](#opción-1-docker-compose-recomendado)
  - [Opción 2: Instalación Manual](#opción-2-instalación-manual)
  - [Opción 3: Script Automatizado](#opción-3-script-automatizado)
- [⚙️ Variables de Entorno](#️-variables-de-entorno)
- [📖 Roles del Sistema](#-roles-del-sistema)
- [🧑‍💻 Desarrollo](#-desarrollo)
- [🛠️ Comandos Útiles](#️-comandos-útiles)

---

## ✨ Características

- **👥 Tres roles de usuario** — Administrador, Docente y Estudiante, cada uno con su propio dashboard y funcionalidades.
- **📂 Gestión de clases** — Creación, asignación de docentes y matriculación de estudiantes.
- **📚 Contenido educativo** — Subida y organización de archivos (PDF, imágenes, videos) con sistema de carpetas.
- **📝 Evaluaciones** — Creación de quizzes y tareas con seguimiento de entregas y calificaciones.
- **🤖 Asistente de IA local** — Chat inteligente con modelos de lenguaje ejecutados localmente mediante **Ollama**.
- **🏠 100% offline** — Todo el sistema funciona sin conexión a internet, ideal para escuelas rurales.
- **🐳 Despliegue con Docker** — Un solo comando levanta toda la plataforma.

---

## 🧱 Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev) | 18 | Biblioteca de UI para construir interfaces de usuario interactivas. |
| [![React Router](https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter&logoColor=white&style=flat-square)](https://reactrouter.com) | 6 | Enrutamiento del lado del cliente entre páginas y dashboards. |
| [![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev) | 5 | Bundler ultrarrápido para desarrollo y build de producción. |
| [![Axios](https://img.shields.io/badge/Axios-1.6-5A29E4?logo=axios&logoColor=white&style=flat-square)](https://axios-http.com) | 1.6 | Cliente HTTP para comunicación con el backend. |
| [![Nginx](https://img.shields.io/badge/Nginx-✓-009639?logo=nginx&logoColor=white&style=flat-square)](https://nginx.org) | Alpine | Servidor web para servir el frontend en producción. |

### Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| [![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org) | 18 | Entorno de ejecución JavaScript del lado del servidor. |
| [![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white&style=flat-square)](https://expressjs.com) | 4.18 | Framework web para construir la API REST. |
| [![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white&style=flat-square)](https://sqlite.org) | 3 | Base de datos embebida, liviana y sin servidor. |
| [![JSON Web Token](https://img.shields.io/badge/JWT-9.0-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)](https://jwt.io) | 9.0 | Autenticación segura basada en tokens. |
| [![bcryptjs](https://img.shields.io/badge/bcryptjs-3.0-003A70?style=flat-square)](https://github.com/dcodeIO/bcrypt.js) | 3.0 | Hash de contraseñas para seguridad de cuentas. |
| [![Multer](https://img.shields.io/badge/Multer-2.1-FF6600?style=flat-square)](https://github.com/expressjs/multer) | 2.1 | Middleware para subida de archivos. |
| [![Morgan](https://img.shields.io/badge/Morgan-1.10-000000?style=flat-square)](https://github.com/expressjs/morgan) | 1.10 | Logger de peticiones HTTP. |

### Inteligencia Artificial

| Tecnología | Propósito |
|-----------|-----------|
| [![Ollama](https://img.shields.io/badge/Ollama-✓-000000?logo=ollama&logoColor=white&style=flat-square)](https://ollama.com) | Servidor de modelos de lenguaje local. Corre modelos como `qwen2-math` sin conexión a internet. |

### Infraestructura

| Tecnología | Propósito |
|-----------|-----------|
| [![Docker](https://img.shields.io/badge/Docker-✓-2496ED?logo=docker&logoColor=white&style=flat-square)](https://docker.com) | Contenedorización de toda la plataforma para un despliegue consistente. |
| [![Docker Compose](https://img.shields.io/badge/Compose-✓-2496ED?logo=docker&logoColor=white&style=flat-square)](https://docs.docker.com/compose/) | Orquestación de múltiples contenedores (frontend, backend, IA). |

---

## 📁 Estructura del Proyecto

```
proyecto-redes/
├── client/                        # 🎨 Frontend React + Vite
│   ├── src/
│   │   ├── app/                   # Configuración de la app y rutas
│   │   ├── components/            # Componentes reutilizables
│   │   │   ├── student/           #   Componentes de estudiante
│   │   │   └── teacher/           #   Componentes de docente
│   │   ├── features/              # Módulos funcionales
│   │   │   └── auth/              #   Contexto de autenticación
│   │   ├── pages/                 # Páginas por rol
│   │   │   ├── admin/             #   Panel de administración
│   │   │   ├── student/           #   Paneles de estudiante
│   │   │   └── teacher/           #   Paneles de docente
│   │   ├── services/              # Cliente API (Axios)
│   │   └── styles/                # Estilos globales CSS
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                        # ⚙️ Backend Node.js + Express
│   ├── src/
│   │   ├── config/                # Configuración y variables de entorno
│   │   ├── controllers/           # Controladores de rutas
│   │   ├── database/              # Base de datos SQLite
│   │   │   ├── schema/            #   Esquemas SQL (13 tablas)
│   │   │   ├── migrations/        #   Migraciones incrementales
│   │   │   ├── seeds/             #   Datos de prueba (seed)
│   │   │   └── Redes.db           #   🗄️ Archivo de base de datos
│   │   ├── middleware/            # Middleware (auth, roles, errores)
│   │   ├── routes/                # Rutas de la API REST
│   │   └── app.js                 # Punto de entrada del servidor
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml             # 🐳 Orquestación de contenedores
├── setup.sh                       # 🚀 Script de instalación (Linux/Mac)
├── setup.bat                      # 🚀 Script de instalación (Windows)
└── README.md                      # 📘 Este archivo
```

### Base de Datos — Esquema (13 tablas)

| Tabla | Propósito |
|-------|-----------|
| `roles` | Roles del sistema (admin, teacher, student) |
| `users` | Usuarios y credenciales |
| `classes` | Clases o cursos |
| `class_enrollments` | Relación estudiantes-clase |
| `contents` | Archivos y recursos educativos |
| `activities` | Actividades de aprendizaje |
| `trivias` / `trivia_questions` / `trivia_options` | Quizzes y preguntas |
| `trivia_attempts` / `trivia_answers` | Intentos y respuestas de quizzes |
| `ai_sessions` / `ai_messages` | Sesiones de chat con IA |

---

## 🚀 Cómo Empezar

### Opción 1: Docker Compose (recomendado) 🐳

La forma más rápida y limpia de levantar todo el sistema.

```bash
# 1. Clona el repositorio
git clone <tu-repo>
cd proyecto-redes

# 2. Configura las variables de entorno
cp server/.env.example server/.env
# Edita server/.env con JWT_SECRET y AI_ACCESS_CODE

# 3. ¡Levanta todo con un solo comando!
docker compose up --build
```

Esto iniciará **3 servicios**:

| Servicio | Puerto | Acceso |
|----------|--------|--------|
| 🌐 **Frontend** (React + Nginx) | `80` | [http://localhost](http://localhost) |
| ⚙️ **Backend** (Express + SQLite) | `3000` | [http://localhost:3000](http://localhost:3000) |
| 🤖 **Ollama** (IA local) | `11434` | — |

> ⚠️ La primera vez que se ejecute, Ollama descargará el modelo `qwen2-math` (~4 GB). Esto puede tomar varios minutos.

### Opción 2: Instalación Manual 🔧

#### Requisitos previos

- [Node.js](https://nodejs.org) v18 o superior
- [Ollama](https://ollama.com) instalado localmente

#### Paso a paso

```bash
# 1. Configurar variables de entorno
cp server/.env.example server/.env

# 2. Instalar dependencias del servidor
cd server
npm install

# 3. Instalar dependencias del cliente
cd ../client
npm install

# 4. Iniciar Ollama (en otra terminal)
ollama serve
# En otra terminal:
ollama pull qwen2-math

# 5. Iniciar el servidor (en otra terminal)
cd server
npm run dev

# 6. Iniciar el cliente (en otra terminal)
cd client
npm run dev

# 7. Abrir en el navegador
#    http://localhost:5173
```

### Opción 3: Script Automatizado 🚀

Ejecuta el script de instalación que automatiza los pasos anteriores.

**En Linux / macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**En Windows:**
```cmd
setup.bat
```

El script verificará e instalará:
1. ✅ Node.js
2. ✅ Archivo `.env`
3. ✅ Dependencias del servidor (`npm install`)
4. ✅ Dependencias del cliente (`npm install`)
5. ✅ Ollama y el modelo `qwen2-math`

Después de ejecutar el script, deberás iniciar los servicios manualmente en terminales separadas.

---

## ⚙️ Variables de Entorno

Crea un archivo `server/.env` con las siguientes variables:

```env
PORT=3000                    # Puerto del servidor
JWT_SECRET=tu_secreto_aqui   # Clave secreta para tokens JWT
OLLAMA_URL=http://localhost:11434  # URL del servidor Ollama
OLLAMA_MODEL=qwen2-math:latest     # Modelo de IA a utilizar
AI_ACCESS_CODE=              # Código de acceso para la IA (opcional)
```

---

## 📖 Roles del Sistema

### 👑 Administrador
- Gestiona docentes y estudiantes (CRUD completo)
- Crea y administra clases
- Asigna docentes a clases
- Matricula estudiantes en clases

### 👨‍🏫 Docente
- Visualiza sus clases asignadas
- Administra contenido educativo (archivos, carpetas)
- Crea quizzes y tareas
- Revisa entregas y calificaciones de estudiantes

### 👩‍🎓 Estudiante
- Visualiza sus clases matriculadas
- Accede a materiales y recursos educativos
- Responde quizzes y envía tareas
- Interactúa con el asistente de IA

---

## 🧑‍💻 Desarrollo

### Ejecutar en modo desarrollo

```bash
# Backend con auto-recarga (nodemon)
cd server
npm run dev

# Frontend con HMR (Hot Module Replacement)
cd client
npm run dev
```

### Construir para producción

```bash
cd client
npm run build    # Genera ./dist listo para servir con Nginx
```

### API REST

El backend expone una API REST en `http://localhost:3000/api`:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | Inicio de sesión |
| `/api/private/me` | GET | Perfil del usuario autenticado |
| `/api/classes` | GET/POST | Gestión de clases |
| `/api/students` | GET/POST | Gestión de estudiantes |
| `/api/teachers` | GET/POST | Gestión de docentes |
| `/api/ai/chat` | POST | Chat con IA local |

---

## 🛠️ Comandos Útiles

```bash
# Reiniciar la base de datos (borrar y recrear)
cd server
rm src/database/Redes.db
python src/database/load_schema.py

# Ejecutar migraciones
python src/database/run_migrations.py

# Poblar datos de prueba
node src/database/seeds/seed.js

# Docker: reconstruir contenedores
docker compose up --build

# Docker: ver logs
docker compose logs -f

# Docker: detener todo
docker compose down
```

---

<div align="center">

---

**Hecho con ❤️ para escuelas sin acceso a internet**

</div>
