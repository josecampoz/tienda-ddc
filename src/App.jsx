import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminDataProvider } from './context/AdminDataContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminPage from './pages/AdminPage'
import AdminAccessPage from './pages/AdminAccessPage'

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function AdminGuard() {
  const { currentUser, hasPermission, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="font-mono text-accent text-xs">AUTH</div>
          <p className="text-white mt-2">Validando sesion...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) return <AdminAccessPage />

  if (!hasPermission('dashboard')) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card max-w-xl w-full p-8 text-center">
          <div className="section-label">Acceso denegado</div>
          <h1 className="font-display text-3xl font-black text-white">No tienes permisos para este modulo</h1>
          <p className="text-muted mt-3">
            Tu perfil no incluye acceso a administracion. Solicita permisos a un Super Admin.
          </p>
        </div>
      </div>
    )
  }

  return <AdminPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminDataProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/admin" element={<AdminGuard />} />
                <Route path="*" element={
                  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <div className="font-display text-6xl font-black text-border">404</div>
                    <p className="text-muted">Pagina no encontrada</p>
                    <a href="/" className="btn-primary">Volver al inicio</a>
                  </div>
                } />
              </Routes>
            </Layout>
          </CartProvider>
        </AdminDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
