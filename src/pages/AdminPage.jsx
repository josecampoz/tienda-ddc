import { useState } from 'react'
import { PRODUCTS, formatPrice } from '../data/products'

// Mock analytics data
const MOCK_ORDERS = [
  { id: 'ORD-001', customer: 'cliente@ejemplo.com', total: 869000, status: 'completed', date: '2026-04-20', items: 2 },
  { id: 'ORD-002', customer: 'ana.garcia@gmail.com', total: 5200000, status: 'completed', date: '2026-04-21', items: 1 },
  { id: 'ORD-003', customer: 'carlos.m@hotmail.com', total: 1410000, status: 'processing', date: '2026-04-22', items: 3 },
  { id: 'ORD-004', customer: 'maria.l@yahoo.com', total: 320000, status: 'completed', date: '2026-04-23', items: 1 },
  { id: 'ORD-005', customer: 'pedro.r@gmail.com', total: 2880000, status: 'pending', date: '2026-04-24', items: 2 },
]

const WEEKLY_SALES = [
  { day: 'Lun', sales: 1200000 },
  { day: 'Mar', sales: 2800000 },
  { day: 'Mié', sales: 1900000 },
  { day: 'Jue', sales: 3500000 },
  { day: 'Vie', sales: 4200000 },
  { day: 'Sáb', sales: 2100000 },
  { day: 'Dom', sales: 980000 },
]

const maxSale = Math.max(...WEEKLY_SALES.map(d => d.sales))

const STATUS_COLORS = {
  completed: 'text-success bg-success/10 border-success/20',
  processing: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  pending: 'text-muted bg-border/40 border-border',
}

const STATUS_LABELS = {
  completed: 'Completada',
  processing: 'Procesando',
  pending: 'Pendiente',
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState(PRODUCTS)
  const [editId, setEditId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')

  const totalRevenue = MOCK_ORDERS.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0)
  const topProducts = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 5)

  const startEdit = (p) => { setEditId(p.id); setEditPrice(p.price); setEditStock(p.stock) }
  const saveEdit = () => {
    setProducts(ps => ps.map(p => p.id === editId ? { ...p, price: Number(editPrice), stock: Number(editStock) } : p))
    setEditId(null)
  }

  const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'products', label: 'Productos' },
    { id: 'orders', label: 'Órdenes' },
  ]

  return (
    <div className="min-h-screen">
      {/* Admin header */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-label m-0">Panel de administración</div>
              <h1 className="font-display text-2xl font-black text-white mt-1">TiendaOnline DDC</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-success font-mono">Sistema activo</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-body transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-muted hover:text-white hover:bg-panel'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8 animate-fade-up">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos totales', value: formatPrice(totalRevenue), icon: '💰', delta: '+12%' },
                { label: 'Órdenes totales', value: MOCK_ORDERS.length, icon: '📦', delta: '+3' },
                { label: 'Productos activos', value: PRODUCTS.filter(p => p.stock > 0).length, icon: '🛍️', delta: null },
                { label: 'Clientes únicos', value: '42', icon: '👥', delta: '+8' },
              ].map(({ label, value, icon, delta }) => (
                <div key={label} className="card p-5">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="font-display text-xl font-black text-white">{value}</div>
                  <div className="text-xs text-muted mt-1">{label}</div>
                  {delta && <div className="text-xs text-success mt-1 font-mono">{delta} esta semana</div>}
                </div>
              ))}
            </div>

            {/* Sales chart */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-white">Ventas esta semana</h3>
                <span className="text-xs font-mono text-accent">DuckDB Analytics ·  Data Product</span>
              </div>
              <div className="flex items-end gap-3 h-40">
                {WEEKLY_SALES.map(({ day, sales }) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative flex-1 flex items-end">
                      <div
                        className="w-full bg-accent/20 border border-accent/30 rounded-t-sm hover:bg-accent/30 transition-colors"
                        style={{ height: `${(sales / maxSale) * 100}%` }}
                        title={formatPrice(sales)}
                      />
                    </div>
                    <span className="text-xs text-muted font-mono">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Productos más vendidos</h3>
              <div className="flex flex-col gap-3">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-xs font-mono text-muted flex-shrink-0">
                      {i + 1}
                    </div>
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted font-mono">{p.reviews} reseñas · ★ {p.rating}</div>
                    </div>
                    <div className="text-sm font-display font-semibold text-white flex-shrink-0">
                      {formatPrice(p.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">Gestión de productos ({products.length})</h2>
              <div className="text-xs font-mono text-muted">Edita precio y stock directamente</div>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-surface/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-mono text-muted">Producto</th>
                      <th className="text-left px-4 py-3 text-xs font-mono text-muted">Categoría</th>
                      <th className="text-right px-4 py-3 text-xs font-mono text-muted">Precio</th>
                      <th className="text-right px-4 py-3 text-xs font-mono text-muted">Stock</th>
                      <th className="text-right px-4 py-3 text-xs font-mono text-muted">Rating</th>
                      <th className="text-right px-4 py-3 text-xs font-mono text-muted">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-panel/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            <div>
                              <div className="text-white font-medium text-xs leading-snug max-w-[180px] truncate">{p.name}</div>
                              <div className="text-muted text-xs font-mono">{p.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted capitalize text-xs">{p.category}</td>
                        <td className="px-4 py-3 text-right">
                          {editId === p.id ? (
                            <input
                              type="number"
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              className="input-field w-28 text-xs text-right py-1 px-2"
                            />
                          ) : (
                            <span className="font-mono text-white text-xs">{formatPrice(p.price)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editId === p.id ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={e => setEditStock(e.target.value)}
                              className="input-field w-16 text-xs text-right py-1 px-2"
                            />
                          ) : (
                            <span className={`font-mono text-xs ${p.stock <= 5 ? 'text-danger' : p.stock <= 10 ? 'text-amber-400' : 'text-success'}`}>
                              {p.stock}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-amber-400 font-mono text-xs">★ {p.rating}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editId === p.id ? (
                            <div className="flex gap-2 justify-end">
                              <button onClick={saveEdit} className="text-xs text-success hover:text-success/70 font-mono">Guardar</button>
                              <button onClick={() => setEditId(null)} className="text-xs text-muted hover:text-white font-mono">Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(p)} className="text-xs text-accent hover:text-accent/70 font-mono">
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {activeTab === 'orders' && (
          <div className="animate-fade-up">
            <h2 className="font-display text-xl font-bold text-white mb-6">Órdenes recientes ({MOCK_ORDERS.length})</h2>
            <div className="flex flex-col gap-3">
              {MOCK_ORDERS.map(order => (
                <div key={order.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono text-accent">📦</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-white text-sm font-semibold">{order.id}</div>
                      <div className="text-xs text-muted truncate">{order.customer}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-display font-bold text-white text-sm">{formatPrice(order.total)}</div>
                      <div className="text-xs text-muted">{order.items} producto{order.items > 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-xs text-muted font-mono">{order.date}</div>
                    <span className={`badge border ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
