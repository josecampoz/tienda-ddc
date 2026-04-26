# TiendaOnline DDC

Tienda online full-stack orientada a operacion real:
- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + Prisma + PostgreSQL
- Integraciones objetivo: Stripe (pagos) y Shopify (sincronizacion de ordenes)

## Arquitectura

- Frontend consume API REST en `http://localhost:4000`
- Backend maneja autenticacion JWT, permisos RBAC y modulos de admin
- Prisma centraliza el esquema de datos para PostgreSQL

## Modulos backend incluidos

- Login real con JWT y hash de contrasenas (bcrypt)
- Roles/permisos para modulo admin
- Productos, ordenes, clientes, campañas, inventario, configuracion, actividad
- Endpoint de orden publica para checkout
- Endpoint Stripe PaymentIntent
- Endpoint de sincronizacion de orden a Shopify

## Estructura

- `src/` frontend
- `server/` backend Node + Prisma
- `server/prisma/schema.prisma` esquema inicial
- `server/prisma/seed.js` datos iniciales

## Requisitos

- Node 18+
- PostgreSQL (local o Railway)

## Configuracion local

### 1. Frontend

1. Instalar dependencias:
   `npm install`
2. Copiar variables:
   copiar `.env.example` a `.env`
3. Variable requerida:
   `VITE_API_URL=http://localhost:4000`

### 2. Backend

1. Instalar dependencias:
   `npm run server:install`
2. Copiar variables:
   copiar `server/.env.example` a `server/.env`
3. Configurar `DATABASE_URL` y `JWT_SECRET`
4. Generar cliente Prisma:
   `npm run prisma:generate`
5. Ejecutar migraciones:
   `npm run prisma:migrate`
6. Seed inicial:
   `npm run prisma:seed`

### 3. Ejecutar app

- Terminal 1 (backend):
  `npm run dev:api`
- Terminal 2 (frontend):
  `npm run dev:web`

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## Credenciales iniciales

- `root@tiendaddc.com` / `Admin123!`
- `operaciones@tiendaddc.com` / `Manager123!`
- `catalogo@tiendaddc.com` / `Catalogo123!`
- `analitica@tiendaddc.com` / `Analyst123!`

## Objetivo Stripe + Shopify

### Stripe

- Endpoint: `POST /api/integrations/stripe/payment-intent`
- Requiere `STRIPE_SECRET_KEY` en `server/.env`
- Se registra en tabla `StripePayment`

### Shopify

- Endpoint: `POST /api/integrations/shopify/orders/:orderCode/push`
- Requiere:
  - `SHOPIFY_STORE_DOMAIN`
  - `SHOPIFY_ADMIN_TOKEN`
  - `SHOPIFY_API_VERSION`
- Se registra en tabla `ShopifySyncLog`

## Railway (creditos gratuitos)

1. Crear proyecto en Railway
2. Agregar servicio PostgreSQL
3. Copiar `DATABASE_URL`
4. Configurar variables del backend en Railway
5. Deploy del backend desde carpeta `server/`
6. Ejecutar migraciones en entorno Railway:
   `npm run prisma:deploy`
7. Seed de datos (si aplica en entorno inicial)

## Endpoints principales

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/bootstrap`
- `GET /api/store/bootstrap`
- `POST /api/store/orders`
- `POST /api/integrations/stripe/payment-intent`
- `POST /api/integrations/shopify/orders/:orderCode/push`

## Nota de produccion

Antes de salir a produccion:
- Activar HTTPS
- Usar rotacion de secretos
- Configurar webhook real de Stripe
- Validar politicas de CORS y rate limiting
- Integrar observabilidad (logs + metricas)
