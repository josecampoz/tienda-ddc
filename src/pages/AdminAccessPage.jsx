import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO_USERS = [
  { role: 'Super Admin', email: 'root@tiendaddc.com', password: 'Admin123!' },
  { role: 'Operations Manager', email: 'operaciones@tiendaddc.com', password: 'Manager123!' },
  { role: 'Catalog Manager', email: 'catalogo@tiendaddc.com', password: 'Catalogo123!' },
  { role: 'Data Analyst', email: 'analitica@tiendaddc.com', password: 'Analyst123!' },
]

export default function AdminAccessPage() {
  const navigate = useNavigate()
  const { login, authError, clearAuthError } = useAuth()
  const [email, setEmail] = useState('root@tiendaddc.com')
  const [password, setPassword] = useState('Admin123!')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    clearAuthError()
    setLoading(true)

    const ok = await login({ email, password })
    setLoading(false)
    if (ok) navigate('/admin')
  }

  const autofill = (user) => {
    setEmail(user.email)
    setPassword(user.password)
    clearAuthError()
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] px-4 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-8 bg-gradient-to-b from-surface to-void">
          <div className="section-label">Admin Security</div>
          <h1 className="font-display text-4xl font-black text-white leading-tight">
            Portal de administracion
            <br />
            <span className="text-accent">con control de perfiles</span>
          </h1>
          <p className="text-muted mt-4 leading-relaxed">
            El acceso al modulo de gestion requiere autenticacion, control de permisos por rol y trazabilidad
            de eventos para operar la tienda de forma profesional.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'SSO Ready', detail: 'Roles y permisos escalables' },
              { label: 'Audit Trail', detail: 'Registro de acciones criticas' },
              { label: 'RBAC', detail: 'Accesos por modulo funcional' },
              { label: 'Multi-user', detail: 'Equipos de operaciones y BI' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-panel/60 p-3">
                <div className="text-white font-display text-sm font-bold">{item.label}</div>
                <div className="text-xs text-muted mt-1">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-8">
          <h2 className="font-display text-2xl font-black text-white">Iniciar sesion</h2>
          <p className="text-muted text-sm mt-2">Ingresa con una cuenta de perfil administrativo.</p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted font-mono">Correo corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field mt-1"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted font-mono">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field mt-1"
                autoComplete="current-password"
                required
              />
            </div>

            {authError && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {authError}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 justify-center flex">
              {loading ? 'Validando credenciales...' : 'Ingresar al dashboard'}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-4">
            <div className="text-xs font-mono text-muted mb-3">ACCESOS DEMO</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => autofill(user)}
                  className="text-left rounded-lg border border-border bg-surface px-3 py-2 hover:border-accent/50 hover:bg-panel transition-colors"
                >
                  <div className="text-xs text-accent font-mono">{user.role}</div>
                  <div className="text-xs text-muted mt-1">{user.email}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
