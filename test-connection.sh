#!/bin/bash

# Test de conexión a la base de datos y endpoints

echo "🧪 Tienda DDC - Test de Conexión"
echo "===================================="
echo ""

# Test 1: Verificar que el backend está corriendo
echo "1. Verificando backend en http://localhost:4000..."
if curl -s http://localhost:4000 > /dev/null; then
  echo "   ✅ Backend respondiendo"
else
  echo "   ❌ Backend no responde"
  echo "   Solución: Inicia el backend con 'cd server && npm run dev'"
  exit 1
fi

# Test 2: Verificar que el frontend está corriendo
echo ""
echo "2. Verificando frontend en http://localhost:5173..."
if curl -s http://localhost:5173 > /dev/null; then
  echo "   ✅ Frontend respondiendo"
else
  echo "   ⚠️  Frontend no responde (opcional si solo usas backend)"
fi

# Test 3: Verificar que la BD está conectada
echo ""
echo "3. Verificando conexión a PostgreSQL..."
curl -s http://localhost:4000/api/store/bootstrap | jq . > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✅ Base de datos conectada"
  echo "   Productos encontrados:"
  curl -s http://localhost:4000/api/store/bootstrap | jq '.products | length'
else
  echo "   ❌ Error conectando a base de datos"
  echo "   Verifica:"
  echo "   • DATABASE_URL en server/.env"
  echo "   • Migraciones ejecutadas: npx prisma migrate deploy"
  echo "   • Base de datos inicializada: npm run db:init"
  exit 1
fi

echo ""
echo "===================================="
echo "✅ Todos los tests pasaron"
echo ""
echo "La app está lista para usar! 🚀"
echo ""
echo "Abre: http://localhost:5173"
