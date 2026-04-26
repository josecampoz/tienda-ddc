export const ROLE_META = {
  super_admin: {
    label: 'Super Admin',
    permissions: ['dashboard', 'analytics', 'products', 'orders', 'users', 'security', 'customers', 'campaigns', 'reports', 'settings'],
  },
  operations_manager: {
    label: 'Operations Manager',
    permissions: ['dashboard', 'analytics', 'orders', 'products', 'customers', 'reports'],
  },
  catalog_manager: {
    label: 'Catalog Manager',
    permissions: ['dashboard', 'products', 'campaigns'],
  },
  analyst: {
    label: 'Data Analyst',
    permissions: ['dashboard', 'analytics', 'reports'],
  },
  support: {
    label: 'Customer Support',
    permissions: ['dashboard', 'orders', 'customers'],
  },
}

export const hasPermission = (role, permission) => {
  if (!role) return false
  return ROLE_META[role]?.permissions.includes(permission) || false
}
