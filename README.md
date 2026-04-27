# Tienda DDC - Distribuidor Digital Colombia

Tienda online full-stack con arquitectura centrada en datos:
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **Integraciones:** Stripe (pagos) y Shopify (sincronizacion)

## Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│    Backend      │───▶│   PostgreSQL    │
│  React + Vite   │    │ Express + Prisma│    │    Railway      │
│  localhost:5173 │    │  localhost:3001 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Requisitos

- Node.js 18+
- PostgreSQL (Railway recomendado)
- Git

## Instalacion Rapida

### 1. Clonar repositorio

```bash
git clone https://github.com/josecampoz/tienda-ddc.git
cd tienda-ddc
```

### 2. Instalar dependencias

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 3. Configurar variables de entorno

```bash
# En carpeta raiz
cp .env.example .env

# En carpeta server
cd server
cp .env.example .env
```

Editar `server/.env`:
```env
DATABASE_URL="postgresql://usuario:password@host:5432/database"
JWT_SECRET="tu_secret_seguro_de_64_caracteres_minimo"
PORT=3001
```

### 4. Configurar base de datos

```bash
cd server

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar datos iniciales
npx prisma db seed
```

### 5. Ejecutar aplicacion

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Credenciales de prueba

| Usuario | Email | Password |
|---------|-------|----------|
| Admin | root@tiendaddc.com | Admin123! |
| Manager | operaciones@tiendaddc.com | Manager123! |
| Catalogo | catalogo@tiendaddc.com | Catalogo123! |
| Analista | analitica@tiendaddc.com | Analyst123! |

## Tarjeta de prueba Stripe

- Numero: `4242 4242 4242 4242`
- Vencimiento: `12/28`
- CVV: `123`

## Estructura del proyecto

```
tienda-ddc/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── context/           # Context providers
│   ├── data/              # Datos estaticos
│   ├── lib/               # Utilidades
│   └── pages/             # Paginas
├── server/                 # Backend Node.js
│   ├── prisma/            # Schema y migraciones
│   └── src/
│       ├── lib/           # Prisma, JWT
│       ├── middleware/    # Auth middleware
│       └── routes/        # API routes
└── scripts/               # Scripts de utilidad
```

## API Endpoints

### Publicos
- `GET /api/health` - Estado del servidor
- `GET /api/store/bootstrap` - Productos y configuracion
- `POST /api/store/orders` - Crear orden

### Autenticacion
- `POST /api/auth/login` - Iniciar sesion
- `GET /api/auth/me` - Usuario actual

### Admin (requiere JWT)
- `GET /api/admin/bootstrap` - Datos admin
- `PATCH /api/admin/products/:id` - Actualizar producto
- `PATCH /api/admin/orders/:code/status` - Cambiar estado orden

### Integraciones
- `POST /api/integrations/stripe/payment-intent` - Crear pago
- `POST /api/integrations/shopify/orders/:code/push` - Sincronizar orden

## Railway (PostgreSQL)

1. Crear cuenta en [railway.app](https://railway.app)
2. Nuevo proyecto → Add PostgreSQL
3. Ir a Variables → Copiar `DATABASE_URL`
4. Pegar en `server/.env`

## Generar JWT_SECRET seguro

```bash
cd server
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Scripts disponibles

```bash
# Frontend
npm run dev          # Desarrollo
npm run build        # Build produccion
npm run preview      # Preview build

# Backend (desde carpeta server/)
npm run dev          # Desarrollo con nodemon
npm run start        # Produccion
npx prisma studio    # GUI base de datos
```

## Notas de seguridad

- JWT_SECRET debe ser unico y seguro (minimo 64 caracteres)
- En produccion: HTTPS obligatorio
- Configurar CORS para dominio especifico
- No usar credenciales por defecto en produccion
