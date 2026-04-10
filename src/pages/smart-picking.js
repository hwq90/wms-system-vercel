import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function SmartPicking() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [materials, setMaterials] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [pickingList, setPickingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [pickingMode, setPickingMode] = useState('optimal')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ord, inv, mat, wh, loc] = await Promise.all([
        api.getOrders(), api.getInventory(), api.getMaterials(),
        api.getWarehouses(), api.getLocations()
      ])
      setOrders((ord || []).filter(o => o.status === 'pending'))
      setInventory(inv || [])
      setMaterials(mat || [])
      setWarehouses(wh || [])
      setLocations(loc || [])
    } catch (e) {}
    setLoading(false)
  }

  const getMaterialName = (id) => materials.find(m => m.id === id)?.name || '-'
  const getMaterialCode = (id) => materials.find(m => m.id === id)?.code || '-'
  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || '-'
  const getLocationName = (id) => locations.find(l => l.id === id)?.name || '-'

  const generatePickingList = (order) => {
    const list = []
    const orderItems = order.items || []
    orderItems.forEach(item => {
      const needed = item.quantity
      let remaining = needed
      const stockItems = inventory
        .filter(inv => inv.material_id === item.material_id && inv.quantity > 0)
        .sort((a, b) => {
          if (pickingMode === 'optimal') return (a.location_id || '').localeCompare(b.location_id || '')
          if (pickingMode === 'fifo') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
          return 0
        })
      for (const stock of stockItems) {
        if (remaining <= 0) break
        const pickQty = Math.min(remaining, stock.quantity)
        list.push({
          material_id: item.material_id, material_name: getMaterialName(item.material_id),
          material_code: getMaterialCode(item.material_id), warehouse_id: stock.warehouse_id,
          warehouse_name: getWarehouseName(stock.warehouse_id), location_id: stock.location_id,
          location_name: getLocationName(stock.location_id), needed, pick_qty: pickQty,
          available: stock.quantity, status: pickQty >= needed ? 'ok' : pickQty > 0 ? 'partial' : 'shortage'
        })
        remaining -= pickQty
      }
      if (remaining > 0) {
        list.push({ material_id: item.material_id, material_name: getMaterialName(item.material_id),
          material_code: getMaterialCode(item.material_id), needed, pick_qty: 0, available: 0,
          status: 'shortage', shortage: remaining })
      }
    })
    return list
  }

  const handleOrderSelect = (order) => {
    setSelectedOrder(order)
    setPickingList(generatePickingList(order))
  }

  const handleConfirmPicking = async () => {
    if (!selectedOrder) return
    try {
      for (const item of pickingList.filter(i => i.pick_qty > 0)) {
        await api.createInventoryLog({
          type: 'out', material_id: item.material_id, warehouse_id: item.warehouse_id,
          location_id: item.location_id, quantity: item.pick_qty,
          remark: `智能拣货 - 订单: ${selectedOrder.order_no}`,
          operator: JSON.parse(localStorage.getItem('currentUser')).name
        })
      }
      await api.updateOrderStatus(selectedOrder.id, 'picking')
      alert('拣货完成！')
      fetchData()
      setSelectedOrder(null)
      setPickingList([])
    } catch (error) { alert('拣货失败: ' + error.message) }
  }

  const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/') }
  const totalPickQty = pickingList.reduce((sum, i) => sum + i.pick_qty, 0)
  const totalNeeded = pickingList.reduce((sum, i) => sum + i.needed, 0)
  const hasShortage = pickingList.some(i => i.status === 'shortage')

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">智能拣货</h1>
          <div className="flex items-center space-x-4">
            <button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">待拣货订单</h2>
            <div className="mb-4">
              <select value={pickingMode} onChange={(e) => setPickingMode(e.target.value)} className="border rounded px-3 py-2 w-full">
                <option value="optimal">最优路径</option>
                <option value="fifo">先进先出</option>
              </select>
            </div>
            {loading ? <div className="text-center py-8">加载中...</div> : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.map(order => (
                  <div key={order.id} onClick={() => handleOrderSelect(order)}
                    className={`p-4 border rounded cursor-pointer ${selectedOrder?.id === order.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex justify-between">
                      <div><div className="font-medium">{order.order_no}</div><div className="text-sm text-gray-500">{order.customer_name}</div></div>
                      <div className="text-sm text-gray-500">{(order.items || []).length} 项</div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <div className="text-center py-8 text-gray-500">暂无待拣货订单</div>}
              </div>
            )}
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">拣货清单</h2>
            {selectedOrder ? (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm">订单: {selectedOrder.order_no}</div>
                  <div className="text-sm">客户: {selectedOrder.customer_name}</div>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span>需拣: <strong>{totalNeeded}</strong></span>
                    <span>可拣: <strong className={hasShortage ? 'text-red-600' : 'text-green-600'}>{totalPickQty}</strong></span>
                  </div>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                  {pickingList.map((item, idx) => (
                    <div key={idx} className={`p-3 border rounded ${item.status === 'shortage' ? 'border-red-300 bg-red-50' : item.status === 'partial' ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
                      <div className="flex justify-between">
                        <div><div className="font-medium">{item.material_name}</div><div className="text-sm text-gray-500">{item.material_code}</div></div>
                        <div className="text-right"><div className="font-medium">{item.pick_qty} / {item.needed}</div>{item.location_name && <div className="text-sm text-gray-500">{item.warehouse_name} - {item.location_name}</div>}</div>
                      </div>
                    </