# TiendaOnline-DDC - Data-Driven Commerce

**Arquitectura Centrada en Datos** para comercio electronico.

> "No es solo una tienda. Es una fabrica de datos con interfaz de e-commerce."

**Autor:** Jose Luis Campo Zuniga  
**Universidad:** UNICOMFACAUCA  
**Materia:** Arquitectura del Software

## Principio Arquitectonico

Los **datos son el activo de primera clase**. Cada decision arquitectonica fue evaluada con una pregunta: *¿esta decision genera, preserva o degrada la calidad de los datos?*

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
│                              Vercel / localhost:5173                     │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js + Express)                    │
│                              Railway / localhost:3001                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │OrderService │  │ProductCatalog│  │AuthService │  │DataProduct      │ │
│  │             │  │Service      │  │            │  │Publisher        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬─────┘  └────────┬────────┘ │
│         │                │                │                  │          │
│         ▼                ▼                ▼                  ▼          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │   PaymentGatewayService     │  │         REPOSITORIO DUAL        │  │
│  │      (Patron Adapter)       │  │                                 │  │
│  │  ┌─────────┐ ┌───────────┐  │  │  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ Stripe  │ │   Mock    │  │  │  │PostgreSQL│  │   DuckDB    │  │  │
│  │  │ Adapter │ │  Adapter  │  │  │  │  (OLTP)  │  │   (OLAP)    │  │  │
│  │  └─────────┘ └───────────┘  │  │  │Transacc. │  │ Analitico   │  │  │
│  └─────────────────────────────┘  │  └──────────┘  └─────────────┘  │  │
│                                   └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                      │                              │
                      ▼                              ▼
              ┌──────────────┐              ┌──────────────┐
              │    Stripe    │              │   Shopify    │
              │   (Pagos)    │              │ (Catalogo)   │
              └──────────────┘              └──────────────┘
```

## Componentes Principales

### Backend Services

| Servicio | Responsabilidad |
|----------|-----------------|
| **OrderService** | Coordinador del flujo de compra. Valida stock, crea ordenes con transacciones ACID, restaura stock si falla el pago. |
| **ProductCatalogService** | Gestion del catalogo via Prisma ORM. CRUD de productos, inventario con trazabilidad. |
| **AuthService** | Autenticacion stateless con JWT. Roles y permisos. |
| **DataProductPublisher** | El componente mas valioso: transforma eventos de dominio en registros inmutables y consultables. |
| **PaymentGatewayService** | Patron Adapter para independencia del proveedor de pagos. |

### Repositorio Dual

- **PostgreSQL (OLTP):** Transacciones con garantias ACID. Ordenes, usuarios, inventario.
- **DuckDB (OLAP):** Motor columnar embebido para consultas analiticas complejas. Sin costo adicional.

## Decisiones Arquitectonicas (ADRs)

| ADR | Decision | Justificacion |
|-----|----------|---------------|
| [ADR-001](docs/adr/ADR-001-monolito-modulado.md) | Monolito modulado vs Microservicios | Complejidad operacional vs recursos de equipo |
| [ADR-002](docs/adr/ADR-002-duckdb-analitica.md) | DuckDB vs BigQuery/Snowflake | Capacidad industrial a costo $0 |
| [ADR-003](docs/adr/ADR-003-adapter-pagos.md) | Patron Adapter en pagos | Independencia del proveedor |

## Eventos de Dominio Capturados

El `DataProductPublisher` captura y persiste:

- `ProductViewed` - Producto visualizado
- `ProductAddedToCart` - Producto agregado al carrito
- `CartAbandoned` - Carrito abandonado
- `CheckoutStarted` - Checkout iniciado
- `OrderCreated` - Orden creada
- `PaymentProcessed` - Pago procesado
- `PaymentFailed` - Pago fallido
- `OrderCompleted` - Orden completada
- `OrderCanceled` - Orden cancelada
- `InventoryUpdated` - Inventario actualizado

## Instalacion

### Requisitos
- Node.js 18+
- PostgreSQL (Railway recomendado)

### Pasos

```bash
# 1. Clonar
git clone https://github.com/josecampoz/tienda-ddc.git
cd tienda-ddc

# 2. Frontend
npm install

# 3. Backend
cd server
npm install

# 4. Configurar variables
cp .env.example .env
# Editar con DATABASE_URL de Railway y JWT_SECRET seguro

# 5. Base de datos
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 6. Ejecutar (2 terminales)
# Terminal 1: cd server && npm run dev
# Terminal 2: npm run dev
```

### URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | root@tiendaddc.com | Admin123! |
| Manager | operaciones@tiendaddc.com | Manager123! |

### Tarjeta Stripe Test
- Numero: `4242 4242 4242 4242`
- Vencimiento: `12/28`
- CVV: `123`

## API Endpoints

### Store (Publico)
```
GET  /api/store/bootstrap           # Productos + config
GET  /api/store/products            # Lista productos
POST /api/store/products/:id/view   # Registrar vista (evento)
POST /api/store/cart/add            # Registrar carrito (evento)
POST /api/store/orders              # Crear orden
```

### Analytics (Requiere auth)
```
GET /api/analytics/dashboard        # Metricas principales
GET /api/analytics/events           # Consultar eventos
GET /api/analytics/conversion-funnel # Embudo de conversion
```

### Integrations
```
POST /api/integrations/stripe/payment-intent  # Crear pago
POST /api/integrations/shopify/orders/:code/push # Sync Shopify
```

## Estructura del Proyecto

```
tienda-ddc/
├── src/                          # Frontend React
│   ├── components/               # UI Components
│   ├── context/                  # React Context (Auth, Cart, Admin)
│   ├── data/                     # Catalogo local (fallback)
│   └── pages/                    # Paginas
├── server/                       # Backend Node.js
│   ├── prisma/                   # Schema + migrations
│   └── src/
│       ├── services/             # Business logic
│       │   ├── OrderService.js
│       │   ├── ProductCatalogService.js
│       │   ├── PaymentGatewayService.js
│       │   └── DataProductPublisher.js
│       ├── lib/                  # Prisma, DuckDB, JWT
│       └── routes/               # API endpoints
├── docs/
│   └── adr/                      # Architecture Decision Records
└── scripts/                      # Utilidades
```

## Produccion

**Frontend:** Vercel - https://tienda-virtual-ddc.vercel.app  
**Backend:** Railway  
**Base de datos:** Railway PostgreSQL

## Seguridad

- JWT_SECRET: Minimo 64 caracteres aleatorios
- Passwords: bcrypt con salt rounds
- Transacciones: ACID completo
- Validacion: Zod schemas en todos los endpoints

---

**Jose Luis Campo Zuniga** - UNICOMFACAUCA 2026
