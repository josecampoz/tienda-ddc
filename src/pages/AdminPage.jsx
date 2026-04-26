import { useEffect, useMemo, useState } from 'react'
import { CATEGORY_OPTIONS, formatPrice } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { useAdminData } from '../context/AdminDataContext'

const STATUS_COLORS = {
  completed: 'text-success bg-success/10 border-success/20',
  processing: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  pending: 'text-muted bg-border/40 border-border',
  canceled: 'text-danger bg-danger/10 border-danger/20',
}

const STATUS_LABELS = {
  completed: 'Completada',
  processing: 'Procesando',
  pending: 'Pendiente',
  canceled: 'Cancelada',
}

const LAST_7_DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

const CUSTOMER_TIERS = ['Silver', 'Gold', 'Platinum']
const PRODUCT_CATEGORIES = CATEGORY_OPTIONS

export default function AdminPage() {
  const { currentUser, users, roleMeta, hasPermission, createUser, updateUser, logout } = useAuth()
  const {
    products,
    orders,
    activity,
    customers,
    campaigns,
    inventoryMovements,
    stripePayments,
    shopifySyncLogs,
    storeSettings,
    stats,
    updateProduct,
    createProduct,
    updateOrderStatus,
    pushOrderToShopify,
    createCustomer,
    updateCustomer,
    createCampaign,
    updateCampaign,
    updateStoreSettings,
    adjustInventory,
    addActivity,
  } = useAdminData()

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', permission: 'dashboard' },
    { id: 'analytics', label: 'Analitica', permission: 'analytics' },
    { id: 'products', label: 'Productos', permission: 'products' },
    { id: 'orders', label: 'Ordenes', permission: 'orders' },
    { id: 'customers', label: 'Clientes', permission: 'customers' },
    { id: 'campaigns', label: 'Promociones', permission: 'campaigns' },
    { id: 'users', label: 'Usuarios', permission: 'users' },
    { id: 'reports', label: 'Reportes', permission: 'reports' },
    { id: 'integrations', label: 'Integraciones', permission: 'reports' },
    { id: 'security', label: 'Seguridad', permission: 'security' },
    { id: 'settings', label: 'Configuracion', permission: 'settings' },
  ]

  const availableTabs = allTabs.filter((tab) => hasPermission(tab.permission))
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'dashboard')
  const [editId, setEditId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [flashMessage, setFlashMessage] = useState('')
  const [stripePaymentFilter, setStripePaymentFilter] = useState({ status: 'all', query: '' })
  const [shopifyLogFilter, setShopifyLogFilter] = useState({ status: 'all', query: '' })
  const [selectedStripePaymentId, setSelectedStripePaymentId] = useState('')
  const [selectedShopifyLogId, setSelectedShopifyLogId] = useState('')

  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: PRODUCT_CATEGORIES[0]?.id || 'audio',
    price: '',
    stock: '',
    image: '',
    description: '',
  })

  const [inventoryForm, setInventoryForm] = useState({
    productId: '',
    delta: 1,
    reason: 'Ajuste manual',
  })

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    role: 'support',
    department: 'Operaciones',
    password: '',
  })

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Bogota',
    tier: 'Silver',
  })

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    code: '',
    discountType: 'percent',
    discountValue: '',
    startsAt: '',
    endsAt: '',
  })

  const [settingsForm, setSettingsForm] = useState(storeSettings)

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id || 'dashboard')
    }
  }, [availableTabs, activeTab])

  useEffect(() => {
    setSettingsForm(storeSettings)
  }, [storeSettings])

  const setForm = (setter) => (field) => (event) => {
    setter((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const weeklySales = useMemo(() => {
    const byDay = LAST_7_DAYS.map((day) => ({ day, sales: 0 }))
    orders.forEach((order, index) => {
      byDay[index % 7].sales += order.total
    })
    return byDay
  }, [orders])

  const maxSale = Math.max(...weeklySales.map((d) => d.sales), 1)
  const topProducts = useMemo(() => [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 5), [products])
  const recentOrders = useMemo(() => orders.slice(0, 8), [orders])
  const filteredStripePayments = useMemo(() => {
    const query = stripePaymentFilter.query.trim().toLowerCase()
    return stripePayments.filter((payment) => {
      const matchesStatus = stripePaymentFilter.status === 'all' || payment.status === stripePaymentFilter.status
      const matchesQuery = !query || [payment.paymentIntentId, payment.orderCode, payment.status, payment.currency]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
      return matchesStatus && matchesQuery
    })
  }, [stripePayments, stripePaymentFilter])
  const filteredShopifySyncLogs = useMemo(() => {
    const query = shopifyLogFilter.query.trim().toLowerCase()
    return shopifySyncLogs.filter((log) => {
      const matchesStatus = shopifyLogFilter.status === 'all' || log.status === shopifyLogFilter.status
      const matchesQuery = !query || [log.orderCode, log.status, log.requestPayload, log.responsePayload]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
      return matchesStatus && matchesQuery
    })
  }, [shopifySyncLogs, shopifyLogFilter])

  useEffect(() => {
    if (!selectedStripePaymentId && filteredStripePayments[0]) {
      setSelectedStripePaymentId(filteredStripePayments[0].id)
    }
    if (selectedStripePaymentId && !filteredStripePayments.some((payment) => payment.id === selectedStripePaymentId)) {
      setSelectedStripePaymentId(filteredStripePayments[0]?.id || '')
    }
  }, [filteredStripePayments, selectedStripePaymentId])

  useEffect(() => {
    if (!selectedShopifyLogId && filteredShopifySyncLogs[0]) {
      setSelectedShopifyLogId(filteredShopifySyncLogs[0].id)
    }
    if (selectedShopifyLogId && !filteredShopifySyncLogs.some((log) => log.id === selectedShopifyLogId)) {
      setSelectedShopifyLogId(filteredShopifySyncLogs[0]?.id || '')
    }
  }, [filteredShopifySyncLogs, selectedShopifyLogId])

  const selectedStripePayment = filteredStripePayments.find((payment) => payment.id === selectedStripePaymentId) || null
  const selectedShopifyLog = filteredShopifySyncLogs.find((log) => log.id === selectedShopifyLogId) || null

  const announce = (message) => {
    setFlashMessage(message)
    window.setTimeout(() => setFlashMessage(''), 2400)
  }

  const startEdit = (product) => {
    setEditId(product.id)
    setEditPrice(product.price)
    setEditStock(product.stock)
  }

  const saveEdit = async () => {
    if (!editId) return
    await updateProduct(editId, { price: Number(editPrice), stock: Number(editStock) })
    addActivity({ type: 'catalog', text: `Producto ${editId} actualizado (precio/stock)` })
    announce('Producto actualizado con exito')
    setEditId(null)
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    const created = await createProduct({
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      tags: ['Nuevo', 'Gestionado'],
    })
    addActivity({ type: 'catalog', text: `SKU ${created.id} creado por ${currentUser?.fullName || 'admin'}` })
    announce('Nuevo producto creado')
    setProductForm({ name: '', brand: '', category: PRODUCT_CATEGORIES[0]?.id || 'audio', price: '', stock: '', image: '', description: '' })
  }

  const submitInventory = async (event) => {
    event.preventDefault()
    if (!inventoryForm.productId || Number(inventoryForm.delta) === 0) {
      announce('Selecciona producto y una cantidad valida')
      return
    }

    await adjustInventory({
      productId: inventoryForm.productId,
      delta: Number(inventoryForm.delta),
      reason: inventoryForm.reason,
      actor: currentUser?.fullName || 'Admin',
    })
    addActivity({ type: 'catalog', text: `Inventario ajustado para ${inventoryForm.productId} (${inventoryForm.delta})` })
    announce('Inventario actualizado')
    setInventoryForm((prev) => ({ ...prev, delta: 1, reason: 'Ajuste manual' }))
  }

  const submitUser = async (event) => {
    event.preventDefault()
    const result = await createUser(userForm)
    if (!result.ok) {
      announce(result.message)
      return
    }

    addActivity({ type: 'security', text: `Nuevo usuario ${result.user.email} creado con rol ${roleMeta[result.user.role]?.label}` })
    announce('Usuario creado correctamente')
    setUserForm({ fullName: '', email: '', role: 'support', department: 'Operaciones', password: '' })
  }

  const submitCustomer = async (event) => {
    event.preventDefault()
    const customer = await createCustomer(customerForm)
    addActivity({ type: 'crm', text: `Cliente ${customer.email} creado en CRM` })
    announce('Cliente agregado al CRM')
    setCustomerForm({ name: '', email: '', phone: '', city: 'Bogota', tier: 'Silver' })
  }

  const submitCampaign = async (event) => {
    event.preventDefault()
    if (!campaignForm.startsAt || !campaignForm.endsAt) {
      announce('Define fechas de inicio y fin')
      return
    }

    const campaign = await createCampaign(campaignForm)
    addActivity({ type: 'marketing', text: `Campaña ${campaign.code} creada en estado borrador` })
    announce('Campaña creada')
    setCampaignForm({ name: '', code: '', discountType: 'percent', discountValue: '', startsAt: '', endsAt: '' })
  }

  const submitSettings = async (event) => {
    event.preventDefault()
    await updateStoreSettings({
      ...settingsForm,
      taxRate: Number(settingsForm.taxRate),
      freeShippingThreshold: Number(settingsForm.freeShippingThreshold),
    })
    addActivity({ type: 'settings', text: 'Configuracion de tienda actualizada' })
    announce('Configuracion guardada')
  }

  const changeOrderStatus = async (orderId, status) => {
    await updateOrderStatus(orderId, status)
    addActivity({ type: 'order', text: `Orden ${orderId} cambio a estado ${STATUS_LABELS[status]}` })
    announce('Estado de orden actualizado')
  }

  const syncOrderToShopify = async (orderId) => {
    try {
      await pushOrderToShopify(orderId)
      addActivity({ type: 'integrations', text: `Orden ${orderId} sincronizada con Shopify` })
      announce('Orden sincronizada con Shopify')
    } catch (error) {
      announce(error.message || 'No se pudo sincronizar con Shopify')
    }
  }

  const toggleUserState = async (user) => {
    await updateUser(user.id, { active: !user.active })
    addActivity({
      type: 'security',
      text: `${user.email} ${user.active ? 'desactivado' : 'activado'} por ${currentUser?.email}`,
    })
    announce(`Usuario ${user.active ? 'desactivado' : 'activado'}`)
  }

  const toggleCampaignStatus = async (campaign) => {
    const next = campaign.status === 'active' ? 'paused' : 'active'
    await updateCampaign(campaign.id, { status: next })
    addActivity({ type: 'marketing', text: `Campaña ${campaign.code} cambió a ${next}` })
    announce(`Campaña ${next === 'active' ? 'activada' : 'pausada'}`)
  }

  const setCustomerTier = async (customer, tier) => {
    await updateCustomer(customer.id, { tier, status: tier === 'Platinum' ? 'vip' : 'active' })
    addActivity({ type: 'crm', text: `Cliente ${customer.email} actualizado a tier ${tier}` })
    announce('Tier de cliente actualizado')
  }

  const exportCsv = () => {
    const rows = [
      ['orderId', 'customer', 'total', 'status', 'date', 'channel'].join(','),
      ...orders.map((order) => [order.id, order.customer, order.total, order.status, order.date, order.channel].join(',')),
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'reporte-ordenes-ddc.csv'
    link.click()
    URL.revokeObjectURL(url)
    announce('Reporte CSV exportado')
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="section-label m-0">Control Center</div>
              <h1 className="font-display text-2xl font-black text-white mt-1">Admin Console · TiendaOnline DDC</h1>
              <p className="text-xs text-muted mt-2">
                Sesion activa: <span className="text-accent font-mono">{currentUser?.email}</span> · Perfil:{' '}
                <span className="text-white">{roleMeta[currentUser?.role]?.label}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-success font-mono">Sistema protegido</span>
              </div>
              <button onClick={logout} className="btn-ghost py-2 px-4 text-xs">Cerrar sesion</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mt-4">
            {availableTabs.map((tab) => (
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
        {flashMessage && (
          <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">
            {flashMessage}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8 animate-fade-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos cerrados', value: formatPrice(stats.totalRevenue), icon: 'COP', delta: 'Mensual' },
                { label: 'Ordenes', value: stats.totalOrders, icon: 'ORD', delta: `${stats.pendingOrders} pendientes` },
                { label: 'Clientes activos', value: stats.activeCustomers, icon: 'CRM', delta: `${stats.vipCustomers} VIP` },
                { label: 'Campañas activas', value: stats.activeCampaigns, icon: 'MKT', delta: `${campaigns.length} totales` },
              ].map((card) => (
                <div key={card.label} className="card p-5 bg-gradient-to-b from-panel to-surface">
                  <div className="text-xs font-mono text-accent mb-2">{card.icon}</div>
                  <div className="font-display text-xl font-black text-white">{card.value}</div>
                  <div className="text-xs text-muted mt-1">{card.label}</div>
                  <div className="text-xs text-success mt-1 font-mono">{card.delta}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-white">Ventas por dia</h3>
                  <span className="text-xs font-mono text-accent">Data Product live</span>
                </div>
                <div className="flex items-end gap-3 h-40">
                  {weeklySales.map(({ day, sales }) => (
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

              <div className="card p-6">
                <h3 className="font-display font-bold text-white mb-4">Alertas operativas</h3>
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-danger/20 bg-danger/10 p-3">
                    <div className="text-danger text-xs font-mono">Stock critico</div>
                    <div className="text-sm text-white mt-1">{stats.outOfStockCount} SKU sin inventario</div>
                  </div>
                  <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                    <div className="text-amber-300 text-xs font-mono">Ordenes en curso</div>
                    <div className="text-sm text-white mt-1">{stats.processingOrders} en procesamiento</div>
                  </div>
                  <div className="rounded-lg border border-accent/20 bg-accent/10 p-3">
                    <div className="text-accent text-xs font-mono">Free shipping</div>
                    <div className="text-sm text-white mt-1">Desde {formatPrice(storeSettings.freeShippingThreshold)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Top productos por interes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topProducts.map((p, index) => (
                  <div key={p.id} className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-border text-xs text-muted font-mono flex items-center justify-center">
                      {index + 1}
                    </div>
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{p.name}</div>
                      <div className="text-xs text-muted font-mono">{p.reviews} reseñas · ★ {p.rating}</div>
                    </div>
                    <div className="text-sm font-display text-white">{formatPrice(p.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-display text-xl font-bold text-white mb-5">Rendimiento por canal</h2>
              <div className="space-y-3">
                {['Web', 'Mobile', 'Marketplace'].map((channel) => {
                  const channelOrders = orders.filter((order) => order.channel === channel)
                  const revenue = channelOrders.reduce((sum, order) => sum + order.total, 0)
                  const pct = orders.length > 0 ? Math.round((channelOrders.length / orders.length) * 100) : 0
                  return (
                    <div key={channel} className="rounded-lg border border-border bg-surface p-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white">{channel}</span>
                        <span className="text-muted font-mono">{channelOrders.length} ordenes</span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-muted mt-2">Ingresos: <span className="text-white">{formatPrice(revenue)}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-white mb-4">KPI empresariales</h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-muted text-xs">Ticket promedio</div>
                  <div className="text-white text-lg font-display mt-1">
                    {formatPrice(orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-muted text-xs">Tasa de cumplimiento</div>
                  <div className="text-white text-lg font-display mt-1">
                    {orders.length ? Math.round((orders.filter((o) => o.status === 'completed').length / orders.length) * 100) : 0}%
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-muted text-xs">LTV promedio</div>
                  <div className="text-white text-lg font-display mt-1">
                    {formatPrice(customers.length ? Math.round(customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length) : 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="animate-fade-up space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <form onSubmit={submitProduct} className="card p-5 xl:col-span-1 space-y-3 bg-gradient-to-b from-surface to-void">
                <h2 className="font-display text-lg font-bold text-white">Nuevo producto</h2>
                <input value={productForm.name} onChange={setForm(setProductForm)('name')} className="input-field" placeholder="Nombre" required />
                <input value={productForm.brand} onChange={setForm(setProductForm)('brand')} className="input-field" placeholder="Marca" required />
                <select value={productForm.category} onChange={setForm(setProductForm)('category')} className="input-field" required>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input value={productForm.price} onChange={setForm(setProductForm)('price')} type="number" className="input-field" placeholder="Precio" required />
                  <input value={productForm.stock} onChange={setForm(setProductForm)('stock')} type="number" className="input-field" placeholder="Stock" required />
                </div>
                <input value={productForm.image} onChange={setForm(setProductForm)('image')} className="input-field" placeholder="URL imagen" required />
                <textarea value={productForm.description} onChange={setForm(setProductForm)('description')} className="input-field min-h-24" placeholder="Descripcion comercial" required />
                <button className="btn-primary w-full justify-center flex">Crear SKU</button>
              </form>

              <form onSubmit={submitInventory} className="card p-5 xl:col-span-1 space-y-3 bg-gradient-to-b from-panel to-surface">
                <h2 className="font-display text-lg font-bold text-white">Ajuste de inventario</h2>
                <select value={inventoryForm.productId} onChange={setForm(setInventoryForm)('productId')} className="input-field" required>
                  <option value="">Selecciona producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input value={inventoryForm.delta} onChange={setForm(setInventoryForm)('delta')} type="number" className="input-field" placeholder="Cantidad (+ / -)" required />
                <input value={inventoryForm.reason} onChange={setForm(setInventoryForm)('reason')} className="input-field" placeholder="Motivo del ajuste" required />
                <button className="btn-ghost w-full">Aplicar ajuste</button>

                <div className="pt-3 border-t border-border">
                  <div className="text-xs font-mono text-muted mb-2">ULTIMOS MOVIMIENTOS</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inventoryMovements.slice(0, 6).map((movement) => (
                      <div key={movement.id} className="rounded-lg border border-border bg-surface px-2 py-2 text-xs">
                        <div className="text-white truncate">{movement.productName}</div>
                        <div className="text-muted mt-1">
                          <span className={movement.delta > 0 ? 'text-success' : 'text-danger'}>{movement.delta > 0 ? '+' : ''}{movement.delta}</span> · {movement.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>

              <div className="card overflow-hidden xl:col-span-2">
                <div className="px-4 py-3 border-b border-border bg-surface/40 flex items-center justify-between">
                  <h3 className="font-display text-white font-bold">Catalogo activo ({products.length})</h3>
                  <div className="text-xs text-muted font-mono">Gestor de precios y stock</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-surface/30">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-mono text-muted">Producto</th>
                        <th className="text-left px-4 py-3 text-xs font-mono text-muted">Categoria</th>
                        <th className="text-right px-4 py-3 text-xs font-mono text-muted">Precio</th>
                        <th className="text-right px-4 py-3 text-xs font-mono text-muted">Stock</th>
                        <th className="text-right px-4 py-3 text-xs font-mono text-muted">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-panel/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={product.image} alt="" className="w-8 h-8 rounded object-cover" />
                              <div>
                                <div className="text-white text-xs truncate max-w-[180px]">{product.name}</div>
                                <div className="text-muted text-xs font-mono">{product.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted text-xs capitalize">{product.category}</td>
                          <td className="px-4 py-3 text-right">
                            {editId === product.id ? (
                              <input type="number" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} className="input-field w-28 text-xs text-right py-1 px-2" />
                            ) : (
                              <span className="text-white font-mono text-xs">{formatPrice(product.price)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editId === product.id ? (
                              <input type="number" value={editStock} onChange={(event) => setEditStock(event.target.value)} className="input-field w-16 text-xs text-right py-1 px-2" />
                            ) : (
                              <span className={`font-mono text-xs ${product.stock <= 5 ? 'text-danger' : 'text-success'}`}>{product.stock}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editId === product.id ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={saveEdit} className="text-xs text-success hover:text-success/70 font-mono">Guardar</button>
                                <button onClick={() => setEditId(null)} className="text-xs text-muted hover:text-white font-mono">Cancelar</button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(product)} className="text-xs text-accent hover:text-accent/70 font-mono">Editar</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fade-up">
            <h2 className="font-display text-xl font-bold text-white mb-6">Centro de ordenes ({orders.length})</h2>
            <div className="flex flex-col gap-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="card p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono text-accent">ORD</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-white text-sm font-semibold">{order.id}</div>
                      <div className="text-xs text-muted truncate">{order.customer}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="text-sm text-white font-display">{formatPrice(order.total)}</div>
                    <div className="text-xs text-muted font-mono">{order.items} items · {order.channel}</div>
                    <div className="text-xs text-muted font-mono">{order.date}</div>
                    <button onClick={() => syncOrderToShopify(order.id)} className="text-xs text-accent hover:text-white font-mono">
                      Sync Shopify
                    </button>
                    <select value={order.status} onChange={(event) => changeOrderStatus(order.id, event.target.value)} className="input-field py-1 px-2 text-xs min-w-36">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <span className={`badge border ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="animate-fade-up grid grid-cols-1 xl:grid-cols-3 gap-4">
            <form onSubmit={submitCustomer} className="card p-5 xl:col-span-1 space-y-3 bg-gradient-to-b from-surface to-void">
              <h2 className="font-display text-lg font-bold text-white">Nuevo cliente</h2>
              <input value={customerForm.name} onChange={setForm(setCustomerForm)('name')} className="input-field" placeholder="Nombre completo" required />
              <input value={customerForm.email} onChange={setForm(setCustomerForm)('email')} type="email" className="input-field" placeholder="Correo" required />
              <input value={customerForm.phone} onChange={setForm(setCustomerForm)('phone')} className="input-field" placeholder="Telefono" required />
              <input value={customerForm.city} onChange={setForm(setCustomerForm)('city')} className="input-field" placeholder="Ciudad" required />
              <select value={customerForm.tier} onChange={setForm(setCustomerForm)('tier')} className="input-field">
                {CUSTOMER_TIERS.map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
              <button className="btn-primary w-full justify-center flex">Crear cliente</button>
            </form>

            <div className="card p-4 xl:col-span-2">
              <h3 className="font-display text-lg font-bold text-white mb-3">Base de clientes ({customers.length})</h3>
              <div className="space-y-2">
                {customers.map((customer) => (
                  <div key={customer.id} className="rounded-lg border border-border bg-surface px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm">{customer.name}</div>
                      <div className="text-xs text-muted">{customer.email} · {customer.city}</div>
                    </div>
                    <div className="text-xs text-muted font-mono">{formatPrice(customer.lifetimeValue)} · {customer.orders} ordenes</div>
                    <select value={customer.tier} onChange={(event) => setCustomerTier(customer, event.target.value)} className="input-field py-1 px-2 text-xs min-w-32">
                      {CUSTOMER_TIERS.map((tier) => (
                        <option key={tier} value={tier}>{tier}</option>
                      ))}
                    </select>
                    <span className={`badge border ${customer.status === 'vip' ? 'text-accent bg-accent/10 border-accent/30' : 'text-success bg-success/10 border-success/30'}`}>
                      {customer.status === 'vip' ? 'VIP' : 'Activo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="animate-fade-up grid grid-cols-1 xl:grid-cols-3 gap-4">
            <form onSubmit={submitCampaign} className="card p-5 xl:col-span-1 space-y-3 bg-gradient-to-b from-panel to-void">
              <h2 className="font-display text-lg font-bold text-white">Nueva campaña</h2>
              <input value={campaignForm.name} onChange={setForm(setCampaignForm)('name')} className="input-field" placeholder="Nombre" required />
              <input value={campaignForm.code} onChange={setForm(setCampaignForm)('code')} className="input-field" placeholder="Codigo" required />
              <div className="grid grid-cols-2 gap-2">
                <select value={campaignForm.discountType} onChange={setForm(setCampaignForm)('discountType')} className="input-field">
                  <option value="percent">Porcentaje</option>
                  <option value="fixed">Valor fijo</option>
                </select>
                <input value={campaignForm.discountValue} onChange={setForm(setCampaignForm)('discountValue')} type="number" className="input-field" placeholder="Valor" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={campaignForm.startsAt} onChange={setForm(setCampaignForm)('startsAt')} type="date" className="input-field" required />
                <input value={campaignForm.endsAt} onChange={setForm(setCampaignForm)('endsAt')} type="date" className="input-field" required />
              </div>
              <button className="btn-primary w-full justify-center flex">Crear campaña</button>
            </form>

            <div className="card p-4 xl:col-span-2">
              <h3 className="font-display text-lg font-bold text-white mb-3">Marketing campaigns ({campaigns.length})</h3>
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-lg border border-border bg-surface px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm">{campaign.name}</div>
                      <div className="text-xs text-muted font-mono">{campaign.code} · {campaign.startsAt} a {campaign.endsAt}</div>
                    </div>
                    <div className="text-xs text-muted">Uso: {campaign.usageCount}</div>
                    <div className="text-xs text-white font-mono">
                      {campaign.discountType === 'percent' ? `${campaign.discountValue}%` : formatPrice(campaign.discountValue)}
                    </div>
                    <button onClick={() => toggleCampaignStatus(campaign)} className="text-xs text-accent hover:text-white font-mono">
                      {campaign.status === 'active' ? 'Pausar' : 'Activar'}
                    </button>
                    <span className={`badge border ${campaign.status === 'active' ? 'text-success bg-success/10 border-success/30' : 'text-muted bg-border/40 border-border'}`}>
                      {campaign.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-up grid grid-cols-1 xl:grid-cols-3 gap-4">
            <form onSubmit={submitUser} className="card p-5 xl:col-span-1 space-y-3">
              <h2 className="font-display text-lg font-bold text-white">Crear usuario interno</h2>
              <input value={userForm.fullName} onChange={setForm(setUserForm)('fullName')} className="input-field" placeholder="Nombre completo" required />
              <input value={userForm.email} onChange={setForm(setUserForm)('email')} className="input-field" type="email" placeholder="correo@empresa.com" required />
              <select value={userForm.role} onChange={setForm(setUserForm)('role')} className="input-field" required>
                {Object.entries(roleMeta).map(([key, role]) => (
                  <option key={key} value={key}>{role.label}</option>
                ))}
              </select>
              <input value={userForm.department} onChange={setForm(setUserForm)('department')} className="input-field" placeholder="Departamento" required />
              <input value={userForm.password} onChange={setForm(setUserForm)('password')} className="input-field" type="password" placeholder="Contrasena temporal" required />
              <button className="btn-primary w-full justify-center flex">Crear perfil</button>
            </form>

            <div className="card p-4 xl:col-span-2">
              <h3 className="font-display text-lg font-bold text-white mb-3">Perfiles y permisos</h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="rounded-lg border border-border bg-surface px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/15 text-accent font-mono text-xs flex items-center justify-center">{user.avatar}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{user.fullName}</div>
                      <div className="text-xs text-muted">{user.email} · {user.department}</div>
                    </div>
                    <div className="text-xs text-accent font-mono">{roleMeta[user.role]?.label}</div>
                    <span className={`badge border ${user.active ? 'text-success bg-success/10 border-success/30' : 'text-muted bg-border/40 border-border'}`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                    {user.id !== currentUser?.id && (
                      <button onClick={() => toggleUserState(user)} className="text-xs font-mono text-muted hover:text-white" type="button">
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-display text-xl text-white font-bold mb-4">Reporte ejecutivo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="text-xs text-muted">Ventas completadas</div>
                  <div className="text-2xl text-white font-display mt-1">{formatPrice(stats.totalRevenue)}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="text-xs text-muted">Nuevos clientes</div>
                  <div className="text-2xl text-white font-display mt-1">{customers.filter((c) => new Date(c.createdAt) > new Date('2026-01-01')).length}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="text-xs text-muted">Campañas en ejecución</div>
                  <div className="text-2xl text-white font-display mt-1">{campaigns.filter((c) => c.status === 'active').length}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="text-xs text-muted">Tickets procesados</div>
                  <div className="text-2xl text-white font-display mt-1">{orders.filter((o) => o.status !== 'pending').length}</div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-white mb-4">Exportaciones</h3>
              <p className="text-sm text-muted mb-4">Descarga datos para BI o carga en herramientas de analisis empresarial.</p>
              <button onClick={exportCsv} className="btn-primary w-full justify-center flex">Exportar ordenes CSV</button>
              <div className="mt-3 text-xs text-muted font-mono">Incluye id, cliente, total, estado, fecha y canal.</div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-xl font-bold text-white">Stripe Payments</h2>
                <span className="text-xs text-muted font-mono">{filteredStripePayments.length} / {stripePayments.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input
                  value={stripePaymentFilter.query}
                  onChange={(event) => setStripePaymentFilter((prev) => ({ ...prev, query: event.target.value }))}
                  className="input-field"
                  placeholder="Buscar por intent, orden, moneda o estado"
                />
                <select
                  value={stripePaymentFilter.status}
                  onChange={(event) => setStripePaymentFilter((prev) => ({ ...prev, status: event.target.value }))}
                  className="input-field"
                >
                  <option value="all">Todos los estados</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="processing">Processing</option>
                  <option value="requires_payment_method">Requires payment method</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              <div className="space-y-3">
                {filteredStripePayments.length ? (
                  filteredStripePayments.slice(0, 8).map((payment) => (
                    <button
                      key={payment.id}
                      type="button"
                      onClick={() => setSelectedStripePaymentId(payment.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedStripePaymentId === payment.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/40'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-white font-mono">{payment.paymentIntentId}</div>
                          <div className="text-xs text-muted mt-1">Orden {payment.orderCode || 'Sin orden'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">{payment.amount} {String(payment.currency || '').toUpperCase()}</div>
                          <div className="text-xs text-accent font-mono">{payment.status}</div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-surface/60 p-4 text-sm text-muted">
                    No hay pagos para los filtros actuales.
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                <div className="text-xs uppercase font-mono text-accent mb-2">Detalle</div>
                {selectedStripePayment ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-white font-mono break-all">{selectedStripePayment.paymentIntentId}</div>
                    <div className="text-muted">Orden: <span className="text-white">{selectedStripePayment.orderCode || 'Sin orden'}</span></div>
                    <div className="text-muted">Monto: <span className="text-white">{selectedStripePayment.amount} {String(selectedStripePayment.currency || '').toUpperCase()}</span></div>
                    <div className="text-muted">Estado: <span className="text-white">{selectedStripePayment.status}</span></div>
                    <div className="text-muted">Creado: <span className="text-white">{new Date(selectedStripePayment.createdAt).toLocaleString('es-CO')}</span></div>
                  </div>
                ) : (
                  <div className="text-sm text-muted">Selecciona un pago para ver su detalle.</div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-xl font-bold text-white">Shopify Sync Log</h2>
                <span className="text-xs text-muted font-mono">{filteredShopifySyncLogs.length} / {shopifySyncLogs.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input
                  value={shopifyLogFilter.query}
                  onChange={(event) => setShopifyLogFilter((prev) => ({ ...prev, query: event.target.value }))}
                  className="input-field"
                  placeholder="Buscar por orden, estado o payload"
                />
                <select
                  value={shopifyLogFilter.status}
                  onChange={(event) => setShopifyLogFilter((prev) => ({ ...prev, status: event.target.value }))}
                  className="input-field"
                >
                  <option value="all">Todos los estados</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="space-y-3">
                {filteredShopifySyncLogs.length ? (
                  filteredShopifySyncLogs.slice(0, 8).map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedShopifyLogId(log.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedShopifyLogId === log.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/40'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-white font-mono">Orden {log.orderCode}</div>
                          <div className="text-xs text-muted mt-1">{new Date(log.createdAt).toLocaleString('es-CO')}</div>
                        </div>
                        <div className="text-xs text-accent font-mono uppercase">{log.status}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-surface/60 p-4 text-sm text-muted">
                    No hay logs para los filtros actuales.
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                <div className="text-xs uppercase font-mono text-accent mb-2">Detalle</div>
                {selectedShopifyLog ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-white font-mono">Orden {selectedShopifyLog.orderCode}</div>
                    <div className="text-muted">Estado: <span className="text-white uppercase">{selectedShopifyLog.status}</span></div>
                    <div className="text-muted">Creado: <span className="text-white">{new Date(selectedShopifyLog.createdAt).toLocaleString('es-CO')}</span></div>
                    <div className="text-muted">
                      Request: <span className="text-white break-all">{selectedShopifyLog.requestPayload || 'Sin payload'}</span>
                    </div>
                    <div className="text-muted">
                      Response: <span className="text-white break-all">{selectedShopifyLog.responsePayload || 'Sin respuesta'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted">Selecciona un log para ver el detalle.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-display text-xl font-bold text-white mb-4">Bitacora de actividad</h2>
              <div className="space-y-2">
                {activity.slice(0, 12).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-surface p-3">
                    <div className="text-xs font-mono text-accent uppercase">{item.type}</div>
                    <div className="text-sm text-white mt-1">{item.text}</div>
                    <div className="text-xs text-muted mt-2">{new Date(item.timestamp).toLocaleString('es-CO')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-white mb-4">Controles</h3>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-xs text-muted">Politica de contrasenas</div>
                  <div className="text-white text-sm mt-1">Activa (rotacion cada 90 dias)</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-xs text-muted">2FA para administradores</div>
                  <div className="text-white text-sm mt-1">Habilitada para perfiles criticos</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-xs text-muted">Ultimo respaldo</div>
                  <div className="text-white text-sm mt-1">Hoy · 03:00 AM</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-3 gap-4">
            <form onSubmit={submitSettings} className="card p-6 lg:col-span-2 space-y-3">
              <h2 className="font-display text-xl font-bold text-white">Configuracion de tienda</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={settingsForm.storeName || ''} onChange={setForm(setSettingsForm)('storeName')} className="input-field" placeholder="Nombre de tienda" required />
                <input value={settingsForm.currency || ''} onChange={setForm(setSettingsForm)('currency')} className="input-field" placeholder="Moneda" required />
                <input value={settingsForm.supportEmail || ''} onChange={setForm(setSettingsForm)('supportEmail')} className="input-field" placeholder="Email soporte" required />
                <input value={settingsForm.supportPhone || ''} onChange={setForm(setSettingsForm)('supportPhone')} className="input-field" placeholder="Telefono soporte" required />
                <input value={settingsForm.taxRate ?? 19} onChange={setForm(setSettingsForm)('taxRate')} type="number" className="input-field" placeholder="IVA %" required />
                <input value={settingsForm.freeShippingThreshold ?? 500000} onChange={setForm(setSettingsForm)('freeShippingThreshold')} type="number" className="input-field" placeholder="Envio gratis desde" required />
              </div>
              <input value={settingsForm.timezone || ''} onChange={setForm(setSettingsForm)('timezone')} className="input-field" placeholder="Timezone" required />
              <button className="btn-primary">Guardar configuracion</button>
            </form>

            <div className="card p-6">
              <h3 className="font-display text-lg text-white font-bold mb-3">Estado actual</h3>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-xs text-muted">Tienda</div>
                  <div className="text-white mt-1">{storeSettings.storeName}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-xs text-muted">Impuestos</div>
                  <div className="text-white mt-1">{storeSettings.taxRate}%</div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="text-xs text-muted">Envio gratis</div>
                  <div className="text-white mt-1">Desde {formatPrice(storeSettings.freeShippingThreshold)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
