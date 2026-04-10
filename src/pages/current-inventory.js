import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function Inventory() {
  const router = useRouter()
  const [inventory, setInventory] = useState([])
  const [materials, setMaterials] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [filters, setFilters] = useState({ warehouse_id: '', material_id: '', search: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [inv, mat, wh, loc] = await Promise.all([
        api.getInventory(),
        api.getMaterials(),
        api.getWarehouses(),
        api.getLocations()
      ])
      setInventory(inv || [])
      setMaterials(mat || [])
      setWarehouses(wh || [])
      setLocations(loc || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const getMaterialName = (id) => materials.find(m => m.id === id)?.name || '-'
  const getMaterialCode = (id) => materials.find(m => m.id === id)?.code || '-'
  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || '-'
  const getLocationName = (id) => locations.find(l => l.id === id)?.name || '-'

  const filteredInventory = inventory.filter(item => {
    if (filters.warehouse_id && item.warehouse_id !== filters.warehouse_id) return false
    if (filters.material_id && item.material_id !== filters.material_id) return false
    if (filters.search) {
      const m = materials.find(m => m.id === item.material_id)
      const w = warehouses.find(w => w.id === item.warehouse_id)
      const search = filters.search.toLowerCase()
      return (m?.name || '').includes(search) || (m?.code || '').includes(search) || (w?.name || '').includes(search)
    }
    return true
  })

  const totalQuantity = filteredInventory.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const totalValue = filteredInventory.reduce((sum, i) => sum + ((i.quantity || 0) * (i.materials?.price || 0)), 0)

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">即时库存</h1>
          <div className="flex items-center space-x-4">
            <button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">物料种类</div>
              <div className="text-2xl font-bold text-blue-600">{new Set(filteredInventory.map(i => i.material_id)).size}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">总库存量</div>
              <div className="text-2xl font-bold text-green-600">{totalQuantity}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">仓库数量</div>
              <div className="text-2xl font-bold text-yellow-600">{new Set(filteredInventory.map(i => i.warehouse_id)).size}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">库存记录</div>
              <div className="text-2xl font-bold text-purple-600">{filteredInventory.length}</div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <input type="text" placeholder="搜索物料名称/编码..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="border rounded px-3 py-2 flex-1" />
            <select value={filters.warehouse_id} onChange={(e) => setFilters({...filters, warehouse_id: e.target.value})} className="border rounded px-3 py-2">
              <option value="">全部仓库</option>
              {warehouses.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
            </select>
            <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded">刷新</button>
          </div>

          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物料编码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物料名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库位</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">库存数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{getMaterialCode(item.material_id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{getMaterialName(item.material_id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{getWarehouseName(item.warehouse_id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{getLocationName(item.location_id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`px-2 py-1 rounded ${item.quantity < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.materials?.unit || '个'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInventory.length === 0 && <div className="text-center py-8 text-gray-500">暂无库存数据</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}