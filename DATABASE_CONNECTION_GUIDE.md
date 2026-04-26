# Tienda DDC - Guía de Conexión a Base de Datos

## 📋 Estado de la Aplicación

✅ **Completado:**
- App React con carrito de compras funcional
- Backend Express con rutas REST completamente implementadas
- Esquema Prisma ORM con todas las tablas necesarias
- Integración de Stripe preparada
- Sistema de administración robusto
- **ARREGLADO:** Problema del formulario de pagos (campos desenfocados)

## 🔧 Configuración Requerida

### 1. Variables de Entorno - Backend (`server/.env`)

Asegúrate de que tengas estas variables en tu archivo `.env`:

```env
# Base de datos PostgreSQL de Railway
DATABASE_URL=postgresql://user:password@railway.app:5432/tienda_ddc

# Puerto del servidor
PORT=4000

# Frontend origin (para CORS)
FRONTEND_ORIGIN=http://localhost:5173

# Stripe (opcional - para integración completa)
STRIPE_SECRET_KEY=sk_test_your_key_here

# Shopify (opcional)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_TOKEN=shpat_...
SHOPIFY_API_VERSION=2024-10
```

### 2. Variables de Entorno - Frontend (`src/.env`)

```env
VITE_API_URL=http://localhost:4000
# o en producción: https://tu-servidor.railway.app
```

## 📡 Conexión a PostgreSQL en Railway

### Obtener las credenciales:

1. Ve a https://railway.app
2. Abre tu proyecto de PostgreSQL
3. Haz clic en "Connect" o "Variables"
4. Copia el string `DATABASE_URL` completo
5. Pégalo en tu archivo `server/.env`

### El string de conexión se ve así:
```
postgresql://postgres:password@containers-us-west-XXX.railway.app:5432/railway
```

## 🚀 Pasos para Ejecutar

### Opción A: Desarrollo Local

**Terminal 1 - Backend:**
```bash
cd server
npm install
npx prisma migrate deploy      # Ejecuta migraciones
npm run db:init                 # Inicializa datos de ejemplo
npm run dev                     # Inicia servidor en puerto 4000
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev                     # Inicia en puerto 5173
```

### Opción B: Script Automatizado

```bash
chmod +x start-backend.sh
./start-backend.sh              # Maneja todo automáticamente
```

## 🗄️ Estructura de Base de Datos

La app usa estas tablas principales:

- **User** - Usuarios administrativos del sistema
- **Product** - Catálogo de productos
- **Order** - Órdenes de clientes
- **Customer** - Base de datos CRM de clientes
- **Campaign** - Campañas de marketing/descuentos
- **StripePayment** - Log de pagos Stripe
- **StoreSetting** - Configuración general de la tienda
- **ActivityLog** - Auditoria de acciones del sistema

## ✅ Verificar Conexión

Cuando todo esté conectado, verás:

1. **Backend iniciado:**
   ```
   [backend] listening on http://localhost:4000
   ```

2. **Base de datos sincronizada:**
   ```
   ✓ Base de datos inicializada correctamente
   ```

3. **Frontend conectado:**
   - Abre http://localhost:5173
   - Los productos se cargan desde la BD ✓
   - El carrito funciona ✓
   - El formulario de pago acepta input continuamente ✓

## 🔌 Endpoints Disponibles

### Públicos (sin autenticación)
- `GET /api/store/bootstrap` - Productos y configuración
- `POST /api/store/orders` - Crear orden
- `POST /api/integrations/stripe/payment-intent` - Crear intento de pago

### Admin (requiere token)
- `GET /api/admin/bootstrap` - Datos completos
- `POST/PATCH /api/admin/products` - Gestionar productos
- `POST/PATCH /api/admin/customers` - Gestionar clientes
- `POST/PATCH /api/admin/campaigns` - Gestionar campañas
- `PATCH /api/admin/settings` - Configuración de tienda

## 🐛 Problemas Comunes

### "DATABASE_URL no está configurado"
→ Verifica que esté en `server/.env` y que el archivo `.env` se cargue correctamente

### "Cannot connect to database"
→ Verifica que la cadena de conexión sea correcta y que tu IP esté en la lista blanca de Railway

### "Puerto 4000 ya está en uso"
→ Cambia el puerto en el archivo `.env` o mata el proceso anterior

### "CORS error"
→ Verifica que `FRONTEND_ORIGIN` esté configurado correctamente en `server/.env`

## 📝 Credenciales de Prueba

**Admin:**
- Email: `admin@tiendaddc.com`
- Password: `admin123`

## 🎯 Próximos Pasos

1. ✅ Conecta DATABASE_URL
2. ✅ Inicia el backend
3. ✅ Ejecuta migraciones
4. ✅ Inicializa datos
5. ✅ Prueba formulario de compra
6. ⭐ Integra Stripe completamente (opcional)
7. ⭐ Configura Shopify (opcional)

¡Listo! La app está completamente funcional. 🚀
