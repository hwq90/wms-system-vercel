import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function BarcodeManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('material')
  const [materials, setMaterials] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mat, loc, wh] = await Promise.all([
        api.getMaterials(), api.getLocations(), api.getWarehouses()
      ])
      setMaterials(mat || [])
      setLocations(loc || [])
      setWarehouses(wh || [])
    } catch (e) {}
    setLoading(false)
  }

  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || '-'

  const generateBarcode = (code) => {
    // 生成条形码SVG
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(code)}&code=Code128&dpi=96`
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSelectAll = (items) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(i => i.id))
    }
  }

  const handleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const filteredMaterials = materials.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.code?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredLocations = locations.filter(l => 
    l.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.code?.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/') }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">条形码管理</h1>
          <div className="flex items-center space-x-4">
            <button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button onClick={() => setActiveTab('material')} className={`px-4 py-2 rounded ${activeTab === 'material' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>物料条形码</button>
              <button onClick={() => setActiveTab('location')} className={`px-4 py-2 rounded ${activeTab === 'location' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>库位条形码</button>
            </div>
            <div className="flex gap-4">
              <input type="text" placeholder="搜索..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-3 py-2" />
              <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">打印条形码</button>
            </div>
          </div>

          {activeTab === 'material' && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" checked={selectedItems.length === filteredMaterials.length && filteredMaterials.length > 0} onChange={() => handleSelectAll(filteredMaterials)} />
                <span className="text-sm text-gray-600">全选 ({selectedItems.length}/{filteredMaterials.length})</span>
              </div>
              {loading ? <div className="text-center py-8">加载中...</div> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMaterials.map(m => (
                    <div key={m.id} className={`border rounded-lg p-4 ${selectedItems.includes(m.id) ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <input type="checkbox" checked={selectedItems.includes(m.id)} onChange={() => handleSelect(m.id)} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.code}</div>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <img src={generateBarcode(m.code)} alt={m.code} className="w-full h-16 object-contain" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" checked={selectedItems.length === filteredLocations.length && filteredLocations.length > 0} onChange={() => handleSelectAll(filteredLocations)} />
                <span className="text-sm text-gray-600">全选 ({selectedItems.length}/{filteredLocations.length})</span>
              </div>
              {loading ? <div className="text-center py-8">加载中...</div> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredLocations.map(l => (
                    <div key={l.id} className={`border rounded-lg p-4 ${selectedItems.includes(l.id) ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <input type="checkbox" checked={selectedItems.includes(l.id)} onChange={() => handleSelect(l.id)} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{l.name}</div>
                          <div className="text-xs text-gray-500">{getWarehouseName(l.warehouse_id)}</div>
                          <div className="text-xs text-gray-400">{l.code}</div>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <img src={generateBarcode(l.code)} alt={l.code} className="w-full h-16 object-contain" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}