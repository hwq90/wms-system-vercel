import { useState, useEffect } from 'react'
import { userApi, materialApi, inventoryApi, orderApi } from '../lib/api'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    materials: 0,
    inventory: 0,
    orders: 0,
    warnings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('currentUser')
    if (!userData) {
      window.location.href = '/'
      return
    }
    setUser(JSON.parse(userData))
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const materials = await materialApi.getAll() || []
      const inventory = await inventoryApi.getAll() || []
      const orders = await orderApi.getAll() || []

      const warnings = inventory.filter(item => {
        const material = materials.find(m => m.id === item.material_id)
        return material && item.quantity <= material.min_stock
      }).length

      setStats({
        materials: materials.length,
        inventory: inventory.reduce((sum, item) => sum + (item.quantity || 0), 0),
        orders: orders.length,
        warnings
      })
    } catch (err) {
      console.error('加载统计失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    window.location.href = '/'
  }

  if (!user) return null

  const roleText = { admin: '超级管理员', manager: '管理员', operator: '操作员' }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold">WMS仓库管理系统</h1>
          <div className="flex items-center gap-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{user.name || user.username}</span>
            <span className="bg-white/30 px-2 py-1 rounded-full text-xs">{roleText[user.role]}</span>
            <button onClick={handleLogout} className="bg-white/20 px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition">退出</button>
          </div>
        </div>
      </header>

      {stats.warnings > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <span>⚠️ 库存预警：{stats.warnings}个物料需要处理</span>
            <span className="bg-white text-red-500 px-3 py-1 rounded-full font-bold">{stats.warnings}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-2xl font-bold text-gray-800">{stats.materials}</div>
            <div className="text-sm text-gray-500">物料总数</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-2xl font-bold text-gray-800">{stats.inventory.toLocaleString()}</div>
            <div className="text-sm text-gray-500">库存总数</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-2xl font-bold text-gray-800">{stats.orders}</div>
            <div className="text-sm text-gray-500">订单总数</div>
          </div>
          <div className={`bg-white rounded-xl p-6 shadow-sm text-center ${stats.warnings > 0 ? 'border-l-4 border-red-500' : ''}`}>
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-gray-800">{stats.warnings}</div>
            <div className="text-sm text-gray-500">库存预警</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">功能模块</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <Link href="/users" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm text-gray-600">用户管理</div>
            </Link>
            <Link href="/materials" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm text-gray-600">物料管理</div>
            </Link>
            <Link href="/inventory" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-600">库存管理</div>
            </Link>
            <Link href="/orders" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm text-gray-600">订单管理</div>
            </Link>
            <Link href="/warehouses" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">🏭</div>
              <div className="text-sm text-gray-600">仓库管理</div>
            </Link>
            <Link href="/suppliers" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">🏢</div>
              <div className="text-sm text-gray-600">供应商</div>
            </Link>
            <Link href="/scan-in" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">📥</div>
              <div className="text-sm text-gray-600">扫码入库</div>
            </Link>
            <Link href="/scan-out" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">📤</div>
              <div className="text-sm text-gray-600">扫码出库</div>
            </Link>
            <Link href="/current-inventory" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm text-gray-600">即时库存</div>
            </Link>
            <Link href="/smart-picking" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">🤖</div>
              <div className="text-sm text-gray-600">智能拣货</div>
            </Link>
            <Link href="/barcode-management" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">🏷️</div>
              <div className="text-sm text-gray-600">条形码管理</div>
            </Link>
            <Link href="/locations" className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-2">📍</div>
              <div className="text-sm text-gray-600">库位管理</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
