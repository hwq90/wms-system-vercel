import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

// 生成条形码
const generateBarcode = (type, data) => {
  const prefix = type === 'material' ? 'M' : 'L'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${data}-${timestamp}-${random}`
}

export default function Barcode() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('material') // material 或 location
  const [materials, setMaterials] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [showGenerate, setShowGenerate] = useState(false)
  const [generateForm, setGenerateForm] = useState({ type: 'material', target_id: '', prefix: '' })
  const [generatedBarcodes, setGeneratedBarcodes] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [mat, loc, wh] = await Promise.all([
        api.getMaterials(),
        api.getLocations(),
        api.getWarehouses()
      ])
      setMaterials(mat || [])
      setLocations(loc || [])
      setWarehouses(wh || [])
    } catch (e) { console.error(e) }
  }

  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || '-'

  const handleGenerate = () => {
    if (!generateForm.target_id) {
      alert('请选择目标')
      return
    }

    const target = generateForm.type === 'material' 
      ? materials.find(m => m.id === generateForm.target_id)
      : locations.find(l => l.id === generateForm.target_id)

    if (!target) return

    const barcode = generateBarcode(generateForm.type, generateForm.target_id)
    const newBarcode = {
      type: generateForm.type,
      target_id: generateForm.target_id,
      target_name: target.name || target.code,
      barcode: barcode,
      created_at: new Date().toLocaleString()
    }

    setGeneratedBarcodes([newBarcode, ...generatedBarcodes])
    setGenerateForm({ type: 'material', target_id: '', prefix: '' })
  }

  const handlePrint = (barcode) => {
    // 打印条形码
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>条形码 - ${barcode.barcode}</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 20px; }
            .barcode { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .name { font-size: 16px; color: #666; }
            .type { font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="type">${barcode.type === 'material' ? '物料' : '库位'}条形码</div>
          <div class="name">${barcode.target_name}</div>
          <div class="barcode">${barcode.barcode}</div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/')
  }

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
        {/* Tab 切换 */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('material')}
            className={`px-6 py-3 rounded-lg font-medium ${activeTab === 'material' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
          >
            物料条形码
          </button>
          <button 
            onClick={() => setActiveTab('location')}
            className={`px-6 py-3 rounded-lg font-medium ${activeTab === 'location' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
          >
            库位条形码
          </button>
          <button 
            onClick={() => setShowGenerate(!showGenerate)}
            className={`px-6 py-3 rounded-lg font-medium ${showGenerate ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}
          >
            生成条形码
          </button>
        </div>

        {/* 生成条形码面板 */}
        {showGenerate && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">生成新条形码</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <select 
                  value={generateForm.type} 
                  onChange={(e) => setGenerateForm({...generateForm, type: e.target.value, target_id: ''})}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="material">物料</option>
                  <option value="location">库位</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {generateForm.type === 'material' ? '选择物料' : '选择库位'}
                </label>
                <select 
                  value={generateForm.target_id} 
                  onChange={(e) => setGenerateForm({...generateForm, target_id: e.target.value})}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">请选择</option>
                  {generateForm.type === 'material' 
                    ? materials.map(m => (<option key={m.id} value={m.id}>{m.name} ({m.code})</option>))
                    : locations.map(l => (<option key={l.id} value={l.id}>{l.code} - {getWarehouseName(l.warehouse_id)}</option>))
                  }
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleGenerate}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  生成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 已生成的条形码列表 */}
        {generatedBarcodes.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">生成的条形码</h2>
            <div className="grid grid-cols-2 gap-4">
              {generatedBarcodes.map((bc, idx) => (
                <div key={idx} className="border rounded p-4 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">{bc.type === 'material' ? '物料' : '库位'}</div>
                    <div className="font-medium">{bc.target_name}</div>
                    <div className="text-lg font-mono text-blue-600">{bc.barcode}</div>
                  </div>
                  <button 
                    onClick={() => handlePrint(bc)}
                    className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                  >
                    打印
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 条形码列表 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'material' ? '物料条形码' : '库位条形码'}
          </h2>
          
          {activeTab === 'material' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物料编码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物料名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">条形码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materials.map(mat => (
                    <tr key={mat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{mat.code}</td>
                      <td className="px-6 py-4 font-medium">{mat.name}</td>
                      <td className="px-6 py-4 font-mono text-blue-600">M-{mat.code}-{mat.id}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handlePrint({ type: 'material', target_name: mat.name, barcode: `M-${mat.code}-${mat.id}` })}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          打印
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {materials.length === 0 && <div className="text-center py-8 text-gray-500">暂无物料</div>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库位编码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">区域/货架</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">条形码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {locations.map(loc => (
                    <tr key={loc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{loc.code}</td>
                      <td className="px-6 py-4">{getWarehouseName(loc.warehouse_id)}</td>
                      <td className="px-6 py-4">{loc.zone || '-'} / {loc.shelf || '-'}</td>
                      <td className="px-6 py-4 font-mono text-blue-600">L-{loc.code}-{loc.id}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handlePrint({ type: 'location', target_name: loc.code, barcode: `L-${loc.code}-${loc.id}` })}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          打印
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {locations.length === 0 && <div className="text-center py-8 text-gray-500">暂无库位</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}