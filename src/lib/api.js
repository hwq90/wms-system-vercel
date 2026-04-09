import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 用户管理
export const userApi = {
  login: async (username, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()
    
    if (error) return null
    return data
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  create: async (user) => {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
    return error ? null : data
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
    return error ? null : data
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    return error ? false : true
  }
}

// 物料管理
export const materialApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  create: async (material) => {
    const { data, error } = await supabase
      .from('materials')
      .insert(material)
    return error ? null : data
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
    return error ? null : data
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id)
    return error ? false : true
  },

  search: async (keyword) => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .or(`code.ilike.%${keyword}%,name.ilike.%${keyword}%`)
    return error ? [] : data
  }
}

// 库存管理
export const inventoryApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, materials(*), warehouses(*), locations(*)')
    return error ? [] : data
  },

  getByWarehouse: async (warehouseId) => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, materials(*), locations(*)')
      .eq('warehouse_id', warehouseId)
    return error ? [] : data
  },

  updateQuantity: async (materialId, warehouseId, quantity) => {
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity })
      .eq('material_id', materialId)
      .eq('warehouse_id', warehouseId)
    return error ? null : data
  },

  createLog: async (log) => {
    const { data, error } = await supabase
      .from('inventory_logs')
      .insert(log)
    return error ? null : data
  }
}

// 订单管理
export const orderApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, warehouses(*), suppliers(*), users(*)')
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  create: async (order) => {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
    return error ? null : data
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
    return error ? null : data
  }
}

// 供应商管理
export const supplierApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })
    return error ? [] : data
  },

  create: async (supplier) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
    return error ? null : data
  }
}

// 仓库管理
export const warehouseApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
    return error ? [] : data
  },

  create: async (warehouse) => {
    const { data, error } = await supabase
      .from('warehouses')
      .insert(warehouse)
    return error ? null : data
  }
}

// 库位管理
export const locationApi = {
  getByWarehouse: async (warehouseId) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('warehouse_id', warehouseId)
    return error ? [] : data
  },

  create: async (location) => {
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
    return error ? null : data
  }
}