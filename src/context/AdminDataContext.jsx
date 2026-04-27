import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../lib/apiClient'
import { PRODUCTS as LOCAL_PRODUCTS } from '../data/catalog'

const AdminDataContext = createContext(null)

const EMPTY_SETTINGS = {
  storeName: 'Tienda DDC - Distribuidor Digital Colombia',
  supportEmail: 'soporte@tiendaddc.com.co',
  supportPhone: '+57 602 831 2000',
  taxRate: 19,
  freeShippingThreshold: 500000,
  currency: 'COP',
  timezone: 'America/Bogota',
}

export function AdminDataProvider({ children }) {
  const { token, currentUser } = useAuth()

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [activity, setActivity] = useState([])
  const [customers, setCustomers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [inventoryMovements, setInventoryMovements] = useState([])
  const [stripePayments, setStripePayments] = useState([])
  const [shopifySyncLogs, setShopifySyncLogs] = useState([])
  const [storeSettings, setStoreSettings] = useState(EMPTY_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  const hydrateFromPublicApi = async () => {
    try {
      const data = await api.storeBootstrap()
      setProducts(data.products?.length > 0 ? data.products : LOCAL_PRODUCTS)
      setStoreSettings(data.storeSettings || EMPTY_SETTINGS)
    } catch {
      // Fallback to local products if API is not available
      setProducts(LOCAL_PRODUCTS)
      setStoreSettings(EMPTY_SETTINGS)
    }
  }

  const hydrateFromAdminApi = async (authToken) => {
    const data = await api.adminBootstrap(authToken)
    setProducts(data.products || [])
    setOrders(data.orders || [])
    setActivity(data.activity || [])
    setCustomers(data.customers || [])
    setCampaigns(data.campaigns || [])
    setInventoryMovements(data.inventoryMovements || [])
    setStripePayments(data.stripePayments || [])
    setShopifySyncLogs(data.shopifySyncLogs || [])
    setStoreSettings(data.storeSettings || EMPTY_SETTINGS)
    return data
  }

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setIsLoading(true)

      try {
        if (token && currentUser) {
          await hydrateFromAdminApi(token)
        } else {
          await hydrateFromPublicApi()
          setOrders([])
          setActivity([])
          setCustomers([])
          setCampaigns([])
          setInventoryMovements([])
          setStripePayments([])
          setShopifySyncLogs([])
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading admin data:', error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [token, currentUser])

  const refreshAdminData = async () => {
    if (!token) return null
    const data = await hydrateFromAdminApi(token)
    return data
  }

  const updateProduct = async (id, patch) => {
    if (!token) return
    const response = await api.updateProduct(token, id, patch)
    setProducts((prev) => prev.map((product) => (product.id === id ? response.product : product)))
  }

  const adjustInventory = async ({ productId, delta, reason, actor }) => {
    if (!token) return
    const response = await api.adjustInventory(token, { productId, delta, reason, actor })
    setProducts((prev) => prev.map((product) => (product.id === productId ? response.product : product)))
    setInventoryMovements((prev) => [response.movement, ...prev])
  }

  const createProduct = async (payload) => {
    if (!token) throw new Error('No autorizado')
    const response = await api.createProduct(token, payload)
    setProducts((prev) => [response.product, ...prev])
    return response.product
  }

  const updateOrderStatus = async (orderCode, status) => {
    if (!token) return
    const response = await api.updateOrderStatus(token, orderCode, status)
    setOrders((prev) => prev.map((order) => (order.id === orderCode ? response.order : order)))
  }

  const createOrder = async ({ customer, total, items, paymentProvider = 'stripe', stripePaymentIntent }) => {
    const response = await api.createStoreOrder({
      customer,
      total,
      items,
      channel: 'Web',
      paymentProvider,
      stripePaymentIntent,
    })

    if (token) {
      await refreshAdminData()
    }

    return response.order
  }

  const createStripePaymentIntent = async ({ amount, currency = 'cop', orderCode }) => {
    return api.createPaymentIntent({ amount, currency, orderCode })
  }

  const pushOrderToShopify = async (orderCode) => {
    if (!token) throw new Error('No autorizado')
    return api.pushOrderToShopify(token, orderCode)
  }

  const createCustomer = async (payload) => {
    if (!token) throw new Error('No autorizado')
    const response = await api.createCustomer(token, payload)
    setCustomers((prev) => [response.customer, ...prev])
    return response.customer
  }

  const updateCustomer = async (id, patch) => {
    if (!token) return
    const response = await api.updateCustomer(token, id, patch)
    setCustomers((prev) => prev.map((customer) => (customer.id === id ? response.customer : customer)))
  }

  const createCampaign = async (payload) => {
    if (!token) throw new Error('No autorizado')
    const response = await api.createCampaign(token, payload)
    setCampaigns((prev) => [response.campaign, ...prev])
    return response.campaign
  }

  const updateCampaign = async (id, patch) => {
    if (!token) return
    const response = await api.updateCampaign(token, id, patch)
    setCampaigns((prev) => prev.map((campaign) => (campaign.id === id ? response.campaign : campaign)))
  }

  const updateStoreSettings = async (patch) => {
    if (!token) return
    const response = await api.updateSettings(token, patch)
    setStoreSettings(response.storeSettings)
  }

  const addActivity = ({ type, text }) => {
    setActivity((prev) => [
      {
        id: crypto.randomUUID(),
        type,
        text,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const stats = useMemo(() => {
    const completedRevenue = orders
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0)

    const lowStock = products.filter((product) => product.stock <= 5)

    return {
      totalRevenue: completedRevenue,
      totalOrders: orders.length,
      activeProducts: products.filter((product) => product.stock > 0).length,
      lowStockCount: lowStock.length,
      outOfStockCount: products.filter((product) => product.stock <= 0).length,
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
      processingOrders: orders.filter((order) => order.status === 'processing').length,
      activeCustomers: customers.filter((customer) => customer.status !== 'inactive').length,
      vipCustomers: customers.filter((customer) => customer.status === 'vip').length,
      activeCampaigns: campaigns.filter((campaign) => campaign.status === 'active').length,
    }
  }, [orders, products, customers, campaigns])

  const value = {
    isLoading,
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
    adjustInventory,
    createProduct,
    updateOrderStatus,
    createOrder,
    createStripePaymentIntent,
    pushOrderToShopify,
    createCustomer,
    updateCustomer,
    createCampaign,
    updateCampaign,
    updateStoreSettings,
    addActivity,
    refreshAdminData,
  }

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData must be inside AdminDataProvider')
  return ctx
}
