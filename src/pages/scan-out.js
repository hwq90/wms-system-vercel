import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function ScanOut() {
  const router = useRouter()
  const [scanMode, setScanMode] = useState('auto')
  const [scanCode, setScanCode] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [manualData, setManualData] = useState({
    material_id: '',
    warehouse_id: '',
    quantity: 1,
    remark: ''
  })
  const [materials, setMaterials] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMaterials()
    fetchWarehouses()
    fetchInventory()
  }, [])

  const fetchMaterials = async () => {
    try { const d = await api.getMaterials(); setMaterials(d || []) } catch(e){}
  }
  const fetchWarehouses = async () => {
    try { const d = await api.getWarehouses(); setWarehouses(d || []) } catch(e){}
  }
  const fetchInventory = async () => {
    try { const d = await api.getInventory(); setInventory(d || []) } catch(e){}
  }

  const handleScan = async () => {
    if (!scanCode) return
    setLoading(true)
    try {
      const result = {
        material: materials.find(m => m.code === scanCode) || null,
        code: scanCode,
        timestamp: new Date().toISOString()
      }
      setScanResult(result)
      if (result.material) {
        setManualData({
          material_id: result.material.id,
          warehouse_id: warehouses[0]?.id || '',
          quantity: 1,
          remark: `扫码出库: ${scanCode}`
        })
      }
    } catch (error) {
      alert('扫码失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const stock = inventory.find(i => 
      i.material_id === manualData.material_id && 
      i.warehouse_id === manualData.warehouse_id
    )
    if (!stock || stock.quantity < manualData.quantity) {
      alert('库存不足！')
      setLoading(false)
      return
    }
    try {
      await api.createInventoryLog({
        type: 'out',
        material_id: manualData.material_id,
        warehouse_id: manualData.warehouse_id,
        quantity: manualData.quantity,
        remark: manualData.remark,
        operator: JSON.parse(localStorage.getItem('currentUser')).name
      })
      alert('出库成功！')
      setManualData({ material_id: '', warehouse_id: '', quantity: 1, remark: '' })
      setScanCode('')
      setScanResult(null)
      fetchInventory()
    } catch (error) {
      alert('出库失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStock = (materialId, warehouseId) => {
    const item = inventory.find(i => i.material_id === materialId && i.warehouse_id === warehouseId)
    return item?.quantity || 0
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">扫码出库</h1>
          <div className="flex items-center space-x-4">
            <button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex gap-4">
          <button onClick={() => setScanMode('auto')} className={`px-4 py-2 rounded ${scanMode === 'auto' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>扫码出库</button>
          <button onClick={() => setScanMode('manual')} className={`px-4 py-2 rounded ${scanMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>手动出库</button>
        </div>

        {scanMode === 'auto' && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">扫码出库</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">扫描条形码</label>
              <div className="flex gap-2">
                <input type="text" value={scanCode} onChange={(e) => setScanCode(e.target.value)} className="flex-1 border border-gray-300 rounded p-2" placeholder="输入条形码" />
                <button onClick={handleScan} disabled={loading || !scanCode} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '处理中...' : '识别'}</button>
              </div>
            </div>
            {scanResult && (
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div>条形码: {scanResult.code}</div>
                <div>物料: {scanResult.material?.name || '未识别'}</div>
              </div>
            )}
            {scanResult?.material && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">物料</label>
                    <select value={manualData.material_id} onChange={(e) => setManualData({...manualData, material_id: e.target.value})} className="mt-1 block w-full border rounded p-2" required>
                      <option value="">请选择</option>
                      {materials.map(m => (<option key={m.id} value={m.id}>{m.name} ({m.code})</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">仓库</label>
                    <select value={manualData.warehouse_id} onChange={(e) => setManualData({...manualData, warehouse_id: e.target.value})} className="mt-1 block w-full border rounded p-2" required>
                      <option value="">请选择</option>
                      {warehouses.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">数量 (可用: {getStock(manualData.material_id, manualData.warehouse_id)})</label>
                  <input type="number" value={manualData.quantity} onChange={(e) => setManualData({...manualData, quantity: parseInt(e.target.value)})} className="mt-1 block w-full border rounded p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">备注</label>
                  <input type="text" value={manualData.remark} onChange={(e) => setManualData({...manualData, remark: e.target.value})} className="mt-1 block w-full border rounded p-2" />
                </div>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '出库中...' : '确认出库'}</button>
              </form>
            )}
          </div>
        )}

        {scanMode === 'manual' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">手动出库</h2>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">物料</label>
                  <select value={manualData.material_id} onChange={(e) => setManualData({...manualData, material_id: e.target.value})} className="mt-1 block w-full border rounded p-2" required>
                    <option value="">请选择</option>
                    {materials.map(m => (<option key={m.id} value={m.id}>{m.name} ({m.code})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">仓库</label>
                  <select value={manualData.warehouse_id} onChange={(e) => setManualData({...manualData, warehouse_id: e.target.value})} className="mt-1 block w-full border rounded p-2" required>
                    <option value="">请选择</option>
                    {warehouses.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">数量 (可用: {getStock(manualData.material_id, manualData.warehouse_id)})</label>
                <input type="number" value={manualData.quantity} onChange={(e) => setManualData({...manualData, quantity: parseInt(e.target.value)})} className="mt-1 block w-full border rounded p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">备注</label>
                <input type="text" value={manualData.remark} onChange={(e) => setManualData({...manualData, remark: e.target.value})} className="mt-1 block w-full border rounded p-2" />
              </div>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '出库中...' : '确认出库'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}