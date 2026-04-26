#!/bin/bash

# Script para ejecutar el servidor backend

echo "[Tienda DDC] Iniciando servidor backend..."

cd server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "[backend] Instalando dependencias..."
  npm install
fi

# Run Prisma migrations
echo "[backend] Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

# Initialize database with sample data
echo "[backend] Inicializando base de datos..."
npm run db:init

# Start the server
echo "[backend] Iniciando servidor en puerto 4000..."
npm run dev
