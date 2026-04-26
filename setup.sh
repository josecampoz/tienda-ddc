#!/bin/bash

# ========================================
# TIENDA DDC - SETUP RÁPIDO
# ========================================

echo "🚀 Tienda DDC - Setup Inicial"
echo "================================"

# 1. Verificar si .env existe
if [ ! -f "server/.env" ]; then
  echo "⚠️  Creando archivo server/.env..."
  cat > server/.env << 'EOF'
# Base de datos - ACTUALIZA ESTO CON TU DATABASE_URL DE RAILWAY
DATABASE_URL=postgresql://user:password@containers-us-west-xxx.railway.app:5432/railway

# Puerto del servidor
PORT=4000

# CORS - Frontend origin
FRONTEND_ORIGIN=http://localhost:5173

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_xxx

# Shopify (opcional)
SHOPIFY_STORE_DOMAIN=
SHOPIFY_ADMIN_TOKEN=
SHOPIFY_API_VERSION=2024-10
EOF
  echo "✓ Archivo .env creado. IMPORTANTE: Actualiza DATABASE_URL con tu conexión de Railway"
else
  echo "✓ server/.env ya existe"
fi

# 2. Instalar dependencias backend
echo ""
echo "📦 Instalando dependencias del backend..."
cd server
npm install
cd ..

# 3. Instalar dependencias frontend
echo "📦 Instalando dependencias del frontend..."
npm install

# 4. Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
cd server
npx prisma generate
cd ..

echo ""
echo "================================"
echo "✅ Setup completado"
echo "================================"
echo ""
echo "⏭️  PRÓXIMOS PASOS:"
echo ""
echo "1️⃣  Actualiza DATABASE_URL en server/.env"
echo "   • Ve a https://railway.app"
echo "   • Copia el DATABASE_URL de tu proyecto PostgreSQL"
echo ""
echo "2️⃣  Ejecuta las migraciones:"
echo "   cd server && npx prisma migrate deploy && npm run db:init"
echo ""
echo "3️⃣  Inicia el backend (Terminal 1):"
echo "   cd server && npm run dev"
echo ""
echo "4️⃣  Inicia el frontend (Terminal 2):"
echo "   npm run dev"
echo ""
echo "5️⃣  Abre http://localhost:5173"
echo ""
echo "🧪 Credenciales de prueba:"
echo "   Email: cliente@ejemplo.com"
echo "   Admin: admin@tiendaddc.com / admin123"
echo ""
echo "💡 Documentación: Lee DATABASE_CONNECTION_GUIDE.md"
