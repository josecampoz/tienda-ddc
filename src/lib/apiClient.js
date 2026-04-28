export const AUTH_TOKEN_KEY = 'tienda_ddc_auth_token'

// Detectar si VITE_API_URL es incorrectamente una URL de base de datos
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  
  // Si no hay URL configurada, usar localhost
  if (!envUrl) {
    return 'http://localhost:3001'
  }
  
  // Si es una URL de PostgreSQL (error comun), ignorarla y usar localhost
  if (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://')) {
    console.warn('VITE_API_URL contiene una URL de base de datos. Usando localhost:3001 en su lugar.')
    return 'http://localhost:3001'
  }
  
  return envUrl.replace(/\/$/, '')
}

const BASE_URL = getApiUrl()

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return {}
  }
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token, headers = {} } = options

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await parseJson(response)

    if (!response.ok) {
      const message = data?.message || 'Error en la solicitud'
      const error = new Error(message)
      error.status = response.status
      error.payload = data
      throw error
    }

    return data
  } catch (error) {
    // Si es un error de red (backend no disponible)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const message = `No se pudo conectar al servidor (${BASE_URL}). ¿Está el backend corriendo en el puerto 3001?`
      const err = new Error(message)
      err.status = 0
      err.isNetworkError = true
      throw err
    }
    throw error
  }
}

export const api = {
  health: () => apiRequest('/api/health'),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => apiRequest('/api/auth/me', { token }),
  listUsers: (token) => apiRequest('/api/auth/users', { token }),
  createUser: (token, payload) => apiRequest('/api/auth/users', { method: 'POST', token, body: payload }),
  setUserStatus: (token, userId, active) => apiRequest(`/api/auth/users/${userId}/status`, { method: 'PATCH', token, body: { active } }),

  storeBootstrap: () => apiRequest('/api/store/bootstrap'),
  createStoreOrder: (payload) => apiRequest('/api/store/orders', { method: 'POST', body: payload }),

  adminBootstrap: (token) => apiRequest('/api/admin/bootstrap', { token }),
  createProduct: (token, payload) => apiRequest('/api/admin/products', { method: 'POST', token, body: payload }),
  updateProduct: (token, productId, payload) => apiRequest(`/api/admin/products/${productId}`, { method: 'PATCH', token, body: payload }),
  adjustInventory: (token, payload) => apiRequest('/api/admin/inventory/adjust', { method: 'POST', token, body: payload }),
  updateOrderStatus: (token, orderCode, status) => apiRequest(`/api/admin/orders/${orderCode}/status`, { method: 'PATCH', token, body: { status } }),
  createCustomer: (token, payload) => apiRequest('/api/admin/customers', { method: 'POST', token, body: payload }),
  updateCustomer: (token, customerId, payload) => apiRequest(`/api/admin/customers/${customerId}`, { method: 'PATCH', token, body: payload }),
  createCampaign: (token, payload) => apiRequest('/api/admin/campaigns', { method: 'POST', token, body: payload }),
  updateCampaign: (token, campaignId, payload) => apiRequest(`/api/admin/campaigns/${campaignId}`, { method: 'PATCH', token, body: payload }),
  updateSettings: (token, payload) => apiRequest('/api/admin/settings', { method: 'PATCH', token, body: payload }),

  createPaymentIntent: (payload) => apiRequest('/api/integrations/stripe/payment-intent', { method: 'POST', body: payload }),
  pushOrderToShopify: (token, orderCode) => apiRequest(`/api/integrations/shopify/orders/${orderCode}/push`, { method: 'POST', token }),
}
