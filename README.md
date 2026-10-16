# Comared Transactional API

API REST construida con **NestJS** para la venta de recargas de telefonía móvil. Permite autenticar usuarios con JWT, consultar los operadores disponibles, comprar recargas a través de la API de **PuntoRed** y consultar el historial y el detalle de cada transacción.

| | |
|---|---|
| 🌐 **API desplegada** | https://comared-transactional-back.onrender.com |
| 📖 **Documentación (Swagger)** | https://comared-transactional-back.onrender.com/api/docs |
| 💻 **Repositorio** | https://github.com/BreynnerAriza/comared-transactional-back |

---

## Tabla de contenido

1. [Tecnologías](#-tecnologías)
2. [Requisitos previos](#-requisitos-previos)
3. [Instalación paso a paso](#-instalación-paso-a-paso)
4. [Base de datos](#-base-de-datos)
5. [Variables de entorno](#-variables-de-entorno)
6. [Ejecutar el proyecto](#-ejecutar-el-proyecto)
7. [Documentación de la API (Swagger)](#-documentación-de-la-api-swagger)
8. [Endpoints](#-endpoints)
9. [Pruebas](#-pruebas)
10. [Estructura del proyecto](#-estructura-del-proyecto)
11. [Despliegue en Render](#-despliegue-en-render)
12. [Scripts disponibles](#-scripts-disponibles)

---

## 🧰 Tecnologías

- **Node.js** + **TypeScript**
- **NestJS 12** (framework)
- **PostgreSQL** + **TypeORM** (persistencia)
- **JWT** con Passport (autenticación) y **argon2** (hash de contraseñas)
- **@nestjs/idempotency** (evita compras duplicadas con el header `Idempotency-Key`)
- **@nestjs/axios** (integración con la API de PuntoRed)
- **Swagger / OpenAPI** (documentación)
- **Jest** (pruebas unitarias)
- **oxlint** + **Prettier** (calidad de código)

---

## ✅ Requisitos previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión | Verificar con |
|---|---|---|
| [Node.js](https://nodejs.org/) | **24.x LTS** (recomendada, mínimo 20.19) | `node -v` |
| npm | Incluido con Node.js (10+) | `npm -v` |
| [PostgreSQL](https://www.postgresql.org/download/) | **13 o superior** (probado con 16) | `psql --version` |
| [Git](https://git-scm.com/) | Cualquier versión reciente | `git --version` |

También necesitas las **credenciales de la API de PuntoRed** (usuario, contraseña, URL y API key) que se entregan con la prueba técnica.

---

## 🚀 Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/BreynnerAriza/comared-transactional-back.git
cd comared-transactional-back
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear la base de datos

> ⚠️ **Importante:** la aplicación **no crea la base de datos ni las tablas** por sí sola (`synchronize` está desactivado). Debes crearlas **antes** de arrancar el proyecto. Revisa la sección [Base de datos](#-base-de-datos).

### 4. Configurar las variables de entorno

```bash
# Linux / macOS / Git Bash
cp .env.example .env.local

# Windows (PowerShell)
Copy-Item .env.example .env.local
```

Luego edita `.env.local` con tus valores reales. Revisa la sección [Variables de entorno](#-variables-de-entorno).

### 5. Arrancar el proyecto

```bash
npm run start:dev
```

Si todo salió bien, la API queda disponible en http://localhost:3000 y la documentación en http://localhost:3000/api/docs 🎉

---

## 🗄️ Base de datos

El script para crear las tablas está en la carpeta [`sql/`](./sql):

| Archivo | Descripción |
|---|---|
| [`sql/001_create_tables.sql`](./sql/001_create_tables.sql) | Crea las tablas `app_user` y `recharge`, con sus llaves, índices y restricciones. |

### Modelo de datos

```
app_user                              recharge
─────────────────────────────         ─────────────────────────────
id             uuid  PK      ◄──┐     id                uuid  PK
name           varchar(150)     └──── user_id           uuid  FK
email          varchar(255) UQ        supplier_id       varchar(50)
password_hash  varchar(255)           supplier_name     varchar(150)
created_at     timestamptz            cell_phone        varchar(10)
updated_at     timestamptz            amount            numeric(12,2)
                                      status            varchar(20)  (PENDING | SUCCESS | FAILED | UNKNOWN)
                                      transactional_id  varchar(100) UQ
                                      provider_message  text
                                      created_at        timestamptz
                                      updated_at        timestamptz
```

### Paso 1: crear la base de datos

Primero crea una base de datos vacía. Puedes usar el nombre que quieras, solo recuerda ponerlo después en `DB_DATABASE`:

```bash
psql -U postgres -c "CREATE DATABASE comared_db;"
```

> También puedes crearla desde **pgAdmin** o **DBeaver**: clic derecho en *Databases* → *Create* → *Database…*

### Paso 2: ejecutar el script

```bash
psql -U postgres -d comared_db -f sql/001_create_tables.sql
```

> Desde pgAdmin o DBeaver: abre un editor SQL **conectado a `comared_db`**, pega el contenido de `sql/001_create_tables.sql` y ejecútalo.

### Paso 3: verificar

```bash
psql -U postgres -d comared_db -c "\dt"
```

Deberías ver las tablas `app_user` y `recharge`.

> ℹ️ El script usa `gen_random_uuid()`, que viene incluida en PostgreSQL 13+ sin instalar extensiones. Todo corre en una transacción (`BEGIN` / `COMMIT`), así que si algo falla no queda nada a medias.

---

## 🔐 Variables de entorno

La aplicación carga el archivo `.env.${NODE_ENV}`. Si `NODE_ENV` no está definido, usa **`.env.local`**. Si falta alguna variable obligatoria, la aplicación no arranca y muestra cuál falta.

| Variable | Obligatoria | Descripción | Ejemplo |
|---|:---:|---|---|
| `PORT` | No | Puerto HTTP de la API (por defecto `3000`) | `3000` |
| `API_URL` | ✅ | URL base de la API de PuntoRed | `https://.../api` |
| `API_USERNAME` | ✅ | Usuario de PuntoRed | `usuario` |
| `API_PASSWORD` | ✅ | Contraseña de PuntoRed | `contraseña` |
| `API_KEY_NAME` | ✅ | Nombre del header de la API key | `x-api-key` |
| `API_KEY_VALUE` | ✅ | Valor de la API key | `clave` |
| `DB_HOST` | ✅ | Host de PostgreSQL | `localhost` |
| `DB_PORT` | ✅ | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | ✅ | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | ✅ | Contraseña de PostgreSQL | `postgres` |
| `DB_DATABASE` | ✅ | Base de datos creada en el paso anterior | `comared_db` |
| `JWT_SECRET` | ✅ | Secreto para firmar los tokens (**mínimo 32 caracteres**) | `un_secreto_largo_y_aleatorio...` |
| `JWT_EXPIRES_IN_SECONDS` | No | Duración del token en segundos (por defecto `3600`) | `3600` |
| `CORS_ORIGINS` | ✅ | Orígenes permitidos, separados por coma | `http://localhost:4200,http://localhost:5173` |

> 💡 Para generar un `JWT_SECRET` seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

> 🔒 Los archivos `.env.*` están en el `.gitignore`. **Nunca subas tus credenciales al repositorio**; solo se versiona `.env.example`.

---

## ▶️ Ejecutar el proyecto

```bash
# Desarrollo (recarga automática al guardar cambios)
npm run start:dev

# Desarrollo sin recarga automática
npm run start

# Modo debug (con recarga automática)
npm run start:debug
```

### Modo producción

```bash
# 1. Compilar el proyecto (genera la carpeta dist/)
npm run build

# 2. Ejecutar la versión compilada
npm run start:prod
```

> ℹ️ Con `NODE_ENV=production` la app busca el archivo `.env.production` (o usa las variables del sistema, como en Render) y **no** expone Swagger.

---

## 📖 Documentación de la API (Swagger)

La documentación interactiva está disponible en:

- **En línea (Render):** https://comared-transactional-back.onrender.com/api/docs
- **Local:** http://localhost:3000/api/docs

### ¿Cómo probar los endpoints protegidos?

1. Inicia sesión con `POST /auth/login` usando las credenciales de prueba entregadas junto con la prueba técnica, y copia el `accessToken` de la respuesta.
2. Haz clic en el botón **Authorize** 🔓 (arriba a la derecha) y pega el token.
3. ¡Listo! Ya puedes llamar los endpoints protegidos. El token se mantiene aunque recargues la página.

> ⏳ Render usa un plan gratuito: si la API lleva un rato sin uso, la primera petición puede tardar **30–60 segundos** mientras el servicio se activa.

---

## 🔌 Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|:---:|---|
| `GET` | `/` | — | Verificación de que la API está arriba |
| `POST` | `/auth/login` | — | Iniciar sesión y obtener el JWT |
| `GET` | `/suppliers` | 🔒 JWT | Listar los operadores disponibles |
| `POST` | `/recharge` | 🔒 JWT | Comprar una recarga (requiere header `Idempotency-Key`) |
| `GET` | `/recharge/history?page=1&size=10` | 🔒 JWT | Historial paginado del usuario (`size` máximo 100) |
| `GET` | `/recharge/:id` | 🔒 JWT | Detalle de una recarga del usuario |

### Reglas de negocio de la compra

- `value`: entre **1.000** y **100.000**.
- `cellPhone`: **10 dígitos** y debe empezar por **3**.
- `supplierId`: debe existir en el catálogo de operadores.

### Idempotencia en `POST /recharge`

Cada compra debe enviar un header `Idempotency-Key` único (por ejemplo, un UUID). Si el cliente reintenta la petición con **la misma clave**, la API devuelve la respuesta original **sin cobrar dos veces**. Las claves se guardan por usuario durante **24 horas**.

Ejemplo:

```bash
curl -X POST http://localhost:3000/recharge \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 7b1e0c3a-2f4d-4b8e-9a61-3c5d2e8f9a10" \
  -d '{ "supplierId": "8753", "value": 5000, "cellPhone": "3001234567" }'
```

---

## 🧪 Pruebas

El proyecto tiene **pruebas unitarias** con Jest para controladores, servicios, guards, estrategias, mappers y validaciones de DTOs (17 suites, 140 pruebas). No requieren base de datos ni conexión con PuntoRed: todas las dependencias externas se simulan con mocks.

```bash
# Ejecutar todas las pruebas unitarias
npm run test

# Modo observador (vuelve a ejecutar al guardar cambios)
npm run test:watch

# Reporte de cobertura (se genera en coverage/)
npm run test:cov
```

Después de `npm run test:cov`, abre `coverage/lcov-report/index.html` en el navegador para ver el reporte detallado.

> ℹ️ Este proyecto **no incluye pruebas end-to-end (e2e)**; el alcance de las pruebas es unitario.

### Calidad de código

```bash
# Linter
npm run lint

# Formatear el código con Prettier
npm run format
```

---

## 📁 Estructura del proyecto

```
comared-transactional-back/
├── sql/
│   └── 001_create_tables.sql        # Script de creación de tablas
├── src/
│   ├── common/                      # Decoradores compartidos (@CurrentUser)
│   ├── config/                      # Configuración tipada (API, BD, JWT, CORS)
│   ├── integrations/
│   │   └── comared/                 # Cliente HTTP y autenticación contra PuntoRed
│   ├── modules/
│   │   ├── auth/                    # Login, JWT y guard global
│   │   ├── recharge/                # Compra, historial y detalle de recargas
│   │   ├── supplier/                # Catálogo de operadores
│   │   └── users/                   # Entidad y repositorio de usuarios
│   ├── swagger/                     # Configuración de Swagger
│   ├── app.module.ts
│   └── main.ts                      # Punto de entrada (pipes, CORS, Swagger)
├── .env.example                     # Plantilla de variables de entorno
├── jest.config.ts
└── package.json
```

Cada módulo sigue la misma organización: `controllers/`, `services/`, `repositories/`, `dtos/`, `mappers/`, `entities/`.

---

## ☁️ Despliegue en Render

La API está desplegada como **Web Service** en [Render](https://render.com):

🔗 **https://comared-transactional-back.onrender.com**

Configuración usada:

| Opción | Valor |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |
| Variables de entorno | Las mismas de la tabla de [Variables de entorno](#-variables-de-entorno), cargadas en *Environment* |
| Base de datos | PostgreSQL, inicializada con `sql/001_create_tables.sql` |

Para desplegar tu propia copia:

1. Crea una base de datos PostgreSQL (en Render o en otro proveedor) y ejecuta `sql/001_create_tables.sql`.
2. En Render, crea un **New → Web Service** y conecta tu fork del repositorio.
3. Configura el *Build Command* y el *Start Command* de la tabla anterior.
4. Agrega las variables de entorno en la pestaña **Environment**. Render asigna `PORT` automáticamente.
5. Despliega. Cada `push` a la rama configurada vuelve a desplegar la API.

---

## 📜 Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run start` | Arranca la aplicación |
| `npm run start:dev` | Arranca en modo desarrollo con recarga automática |
| `npm run start:debug` | Arranca en modo debug con recarga automática |
| `npm run build` | Compila el proyecto a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada (`dist/main.js`) |
| `npm run test` | Ejecuta las pruebas unitarias |
| `npm run test:watch` | Ejecuta las pruebas en modo observador |
| `npm run test:cov` | Ejecuta las pruebas y genera el reporte de cobertura |
| `npm run lint` | Analiza el código con oxlint |
| `npm run format` | Formatea el código con Prettier |

---

## 👤 Autor

**Breynner Ariza** · [GitHub](https://github.com/BreynnerAriza)
