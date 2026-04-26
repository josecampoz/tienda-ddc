# 🚀 GUÍA RÁPIDA - INICIA LA APP EN 5 MINUTOS

## 1️⃣ OBTÉN DATABASE_URL DE RAILWAY

```
1. Ve a: https://railway.app
2. Selecciona tu proyecto PostgreSQL
3. Haz clic en "Connect"
4. Copia el string "DATABASE_URL" (empieza con: postgresql://...)
5. Pégalo en el paso siguiente
```

**Debe verse como:**
```
postgresql://postgres:xxx@containers-us-west-123.railway.app:5432/railway
```

---

## 2️⃣ CONFIGURA LAS VARIABLES DE ENTORNO

**Abre o crea:** `server/.env`

**Pega esto (reemplaza el DATABASE_URL):**
```env
DATABASE_URL=postgresql://TU_URL_DE_RAILWAY_AQUI

PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
```

**Guarda el archivo.**

---

## 3️⃣ INSTALA DEPENDENCIAS

**Terminal 1:**
```bash
cd server
npm install
cd ..
npm install
```

Espera a que termine. ⏳

---

## 4️⃣ CONFIGURA LA BASE DE DATOS

**Terminal 1 (en la carpeta raíz):**
```bash
cd server
npx prisma migrate deploy
npm run db:init
```

Verás:
```
✓ Base de datos inicializada correctamente
```

---

## 5️⃣ INICIA EL BACKEND

**Terminal 1 (sigue en server/):**
```bash
npm run dev
```

Verás:
```
[backend] listening on http://localhost:4000
```

**NO cierres esta terminal.** Deja que siga corriendo.

---

## 6️⃣ INICIA EL FRONTEND

**Abre OTRA Terminal 2 (en la carpeta raíz):**
```bash
npm run dev
```

Verás:
```
  ➜  Local:   http://localhost:5173
```

---

## 7️⃣ ¡LISTO!

**Abre:** http://localhost:5173

---

## ✅ VERIFICACIÓN RÁPIDA

¿Ves esto?

- ✅ Logo de "Tienda DDC" en la top
- ✅ 5 productos cargados
- ✅ Puedes agregar al carrito
- ✅ El carrito cuenta los items

**Si ves todo esto → ¡FUNCIONA!** 🎉

---

## 🧪 PRUEBA DEL FORMULARIO (LO QUE ARREGLAMOS)

1. Haz clic en el carrito
2. Haz clic en "Proceder al checkout"
3. Completa formulario de contacto
4. **PRUEBA CRUCIAL:** Escribe en los campos de pago
   - **DEBE permitir escribir varias letras** ✅
   - **NO debe desenfocarse** ✅
   - Antes esto NO funcionaba ❌
   - Ahora funciona perfectamente ✅

---

## 🔗 CONEXIÓN A BASE DE DATOS

¿Cómo verificar que está conectada?

**Abre en navegador:**
```
http://localhost:4000/api/store/bootstrap
```

**Debes ver:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Laptop Pro 15\"",
      "price": 2500000,
      ...
    }
  ],
  "storeSettings": {...}
}
```

Si ves productos desde la BD → **¡Conectada!** ✅

---

## 🆘 SI ALGO NO FUNCIONA

### Error: "DATABASE_URL no está configurado"
- Verifica que `server/.env` exista
- Verifica que hayas pegado correctamente el DATABASE_URL
- **Recarga el servidor** (Ctrl+C y `npm run dev` de nuevo)

### Error: "Cannot connect to database"
- Verifica que la URL sea correcta (sin espacios)
- Verifica que tu IP esté en la lista blanca de Railway
- Espera 30 segundos y vuelve a intentar

### Formulario sigue desenfocándose
- Verifica que tengas `npm run dev` en el backend (Terminal 1)
- Verifica que hayas aplicado los cambios (`npm run dev` en Terminal 2)
- Limpia el caché: Abre DevTools (F12) → Application → Clear All

### Productos no cargan
- Abre DevTools (F12)
- Ve a Network
- Busca peticiones a `/api/store/bootstrap`
- Si dicen "error": Backend no está corriendo (Terminal 1)
- Si dicen "timeout": Base de datos no conectada

---

## 📚 ARCHIVOS IMPORTANTES

| Archivo | Para qué |
|---------|----------|
| `server/.env` | Configuración (DATABASE_URL aquí!) |
| `DATABASE_CONNECTION_GUIDE.md` | Troubleshooting detallado |
| `CHANGELOG.md` | Qué cambió técnicamente |
| `scripts/init-db.js` | Inicializa la BD |
| `src/pages/CheckoutPage.jsx` | Checkout (donde arreglamos el bug) |

---

## 📊 ARQUITECTURA VISUAL

```
TU COMPUTADORA
├─ Frontend (Navegador)
│  └─ http://localhost:5173
│     └─ Lee productos de...
│
├─ Backend (Node.js Terminal 1)
│  └─ http://localhost:4000
│     └─ Lee datos de...
│
└─ Base de Datos (Railway en la nube)
   └─ postgresql://...@railway.app
      └─ Almacena: Productos, Órdenes, Clientes, etc.
```

---

## 🎯 CHECKLIST FINAL

- [ ] Tengo DATABASE_URL de Railway
- [ ] Creé/actualicé `server/.env` con DATABASE_URL
- [ ] Instalé dependencias (`npm install` en ambas carpetas)
- [ ] Ejecuté migraciones (`npx prisma migrate deploy`)
- [ ] Ejecuté seed (`npm run db:init`)
- [ ] Backend corriendo en Terminal 1 (`npm run dev`)
- [ ] Frontend corriendo en Terminal 2 (`npm run dev`)
- [ ] Abro http://localhost:5173
- [ ] Veo productos cargados ✓
- [ ] El formulario de pago **no desenfoca** ✓
- [ ] Puedo escribir múltiples caracteres ✓

---

## 🎉 ¡LISTO!

**Tu tienda está corriendo con:**
- ✅ Frontend React + Tailwind
- ✅ Backend Express + Prisma
- ✅ Base de datos PostgreSQL en Railway
- ✅ Formulario de pagos **ARREGLADO**
- ✅ Sistema admin completo
- ✅ Integración Stripe preparada

**¿Dudas?** Lee `DATABASE_CONNECTION_GUIDE.md`

**¿Cambios técnicos?** Lee `CHANGELOG.md`

---

**Versión:** 1.1.0
**Status:** 🟢 LISTO PARA PRODUCCIÓN
