# TiendaOnline DDC 🛍️
**Arquitectura Centrada en Datos · React + Vite + Tailwind + React Router**

> Proyecto académico — José Luis Campo Zúñiga · Arquitectura del Software · UnicomfaCauca 2026

---

## 🚀 Ejecución Local

### Requisitos
- **Node.js 18+** → [descargar](https://nodejs.org/)
- **npm 9+** (viene con Node)
- **VS Code** (recomendado)

### Pasos

```bash
# 1. Entra a la carpeta del proyecto
cd tienda-ddc

# 2. Instala dependencias (solo la primera vez)
npm install

# 3. Levanta el servidor de desarrollo
npm run dev
```

La app abre en → **http://localhost:5173**

### Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor local con hot-reload |
| `npm run build` | Compila para producción (carpeta `dist/`) |
| `npm run preview` | Previsualiza el build de producción |

---

## 🌐 Despliegue en la Nube (gratis)

### Opción A — Vercel (⭐ Recomendada · más fácil)

1. Crea cuenta en [vercel.com](https://vercel.com) con tu GitHub
2. Sube el proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: TiendaOnline DDC inicial"
   git remote add origin https://github.com/TU_USUARIO/tienda-ddc.git
   git push -u origin main
   ```
3. En Vercel → **"Add New Project"** → selecciona el repo
4. Vercel detecta Vite automáticamente — solo clic en **"Deploy"**
5. En ~60 segundos tienes URL pública: `https://tienda-ddc.vercel.app`

> Cada `git push` hace redeploy automático. ¡Comparte la URL con tus compañeros!

---

### Opción B — Netlify (también gratis)

1. Crea cuenta en [netlify.com](https://netlify.com)
2. **Opción drag-and-drop** (sin GitHub):
   ```bash
   npm run build   # genera la carpeta dist/
   ```
   Arrastra la carpeta `dist/` al dashboard de Netlify
3. URL pública instantánea: `https://tienda-ddc.netlify.app`

**O conecta con GitHub** igual que Vercel para deploys automáticos.

Configuración manual si la pide:
- Build command: `npm run build`
- Publish directory: `dist`

---

### Opción C — GitHub Pages (100% gratis, sin cuenta extra)

1. Instala el plugin:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Agrega al `vite.config.js`:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/tienda-ddc/',  // nombre de tu repo
   })
   ```

3. Agrega a `package.json` → scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

4. Despliega:
   ```bash
   npm run deploy
   ```

URL: `https://TU_USUARIO.github.io/tienda-ddc/`

---

## 🗂️ Estructura del Proyecto

```
tienda-ddc/
├── index.html              # Entry point HTML
├── vite.config.js          # Configuración Vite
├── tailwind.config.js      # Tokens de diseño
├── package.json
└── src/
    ├── main.jsx            # Punto de entrada React
    ├── App.jsx             # Router principal
    ├── index.css           # Estilos globales + Tailwind
    ├── context/
    │   └── CartContext.jsx # Estado global del carrito (useReducer)
    ├── data/
    │   └── products.js     # Catálogo de 20 productos + helpers
    ├── components/
    │   ├── Navbar.jsx      # Barra de navegación sticky
    │   ├── ProductCard.jsx # Tarjeta de producto
    │   └── Footer.jsx      # Footer con info demo
    └── pages/
        ├── HomePage.jsx       # Catálogo + filtros + búsqueda
        ├── ProductPage.jsx    # Detalle de producto
        ├── CartPage.jsx       # Carrito de compras
        ├── CheckoutPage.jsx   # Flujo de pago (3 pasos)
        └── AdminPage.jsx      # Panel admin (Dashboard/Productos/Órdenes)
```

---

## 🔑 Credenciales Demo

| Acceso | Valor |
|--------|-------|
| **URL Admin** | `/admin` |
| **Email admin** | `admin@tienda.com` |
| **Email cliente** | `cliente@ejemplo.com` |
| **Stripe test card** | `4242 4242 4242 4242` |
| **Vencimiento** | `12/28` |
| **CVV** | `123` |

---

## 🏗️ Stack Técnico

```
Node + npm
   ↓
Vite 5 (bundler + dev server)
   ↓
React 18 (componentes + hooks)
   ↓
React Router 6 (SPA navigation)
   ↓
Tailwind CSS 3 (utility-first styles)
   ↓
Context API + useReducer (state management)
   ↓
localStorage (carrito persistente)
```

---

## 📊 Páginas y Funcionalidades

| Ruta | Funcionalidad |
|------|---------------|
| `/` | Catálogo con búsqueda, filtros por categoría y ordenamiento |
| `/product/:id` | Detalle completo, selector de cantidad, productos relacionados |
| `/cart` | Carrito persistente, actualización de cantidades, resumen con IVA |
| `/checkout` | Flujo de 3 pasos: Contacto → Envío → Pago → Confirmación |
| `/admin` | Dashboard con métricas, gestión de productos/órdenes |

---

*TiendaOnline DDC · Arquitectura Centrada en Datos · Popayán 2026*
