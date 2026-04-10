import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

// Excel 模板下载
const downloadTemplate = () => {
  const headers = ['物料编码', '物料名称', '规格', '单位', '分类', '安全库存', '最大库存', '价格', '备注']
  const csvContent = headers.join(',') + '\n' + 'M001,测试物料,规格A,个,分类A,100,1000,10.00,备注信息'
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '物料_导入模板.csv'
  link.click()
}

// 解析 CSV
const parseCSV = (text) => {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.length >= 2) {
      const row = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      data.push(row)
    }
  }
  return data
}

// 导出为 CSV
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = '\ufeff' + headers.join(',') + '\n' + 
    data.map(row => headers.map(h => row[h] || '').join(',')).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export default function Materials() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [formData, setFormData] = useState({
    code: '', name: '', category: '', spec: '', unit: '件',
    min_stock: 0, max_stock: 99999, price: 0, barcode: '', remark: ''
  })

  useEffect(() => { fetchMaterials() }, [])

  const fetchMaterials = async () => {
    try {
      const data = await api.getMaterials()
      setMaterials(data || [])
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const generateCode = () => { return 'M' + Date.now() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMaterial) {
        await api.updateMaterial(editingMaterial.id, formData)
      } else {
        await api.createMaterial({...formData, code: formData.code || generateCode()})
      }
      setShowModal(false)
      setEditingMaterial(null)
      setFormData({code:'',name:'',category:'',spec:'',unit:'件',min_stock:0,max_stock:99999,price:0,barcode:'',remark:''})
      fetchMaterials()
    } catch (error) { alert('保存失败: ' + error.message) }
  }

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setFormData(material)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个物料吗？')) return
    try {
      await api.deleteMaterial(id)
      fetchMaterials()
    } catch (error) { alert('删除失败: ' + error.message) }
  }

  // 导入物料
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = parseCSV(text)
      
      for (const row of data) {
        await api.createMaterial({
          code: row['物料编码'] || generateCode(),
          name: row['物料名称'] || '',
          spec: row['规格'] || '',
          unit: row['单位'] || '件',
          category: row['分类'] || '',
          min_stock: parseInt(row['安全库存']) || 0,
          max_stock: parseInt(row['最大库存']) || 99999,
          price: parseFloat(row['价格']) || 0,
          remark: row['备注'] || ''
        })
      }
      
      alert(`成功导入 ${data.length} 条物料`)
      fetchMaterials()
    } catch (error) { alert('导入失败: ' + error.message) }
    
    fileInputRef.current.value = ''
  }

  // 导出物料
  const handleExport = () => {
    const exportData = materials.map(m => ({
      '物料编码': m.code,
      '物料名称': m.name,
      '规格': m.spec || '',
      '单位': m.unit || '件',
      '分类': m.category || '',
      '安全库存': m.min_stock || 0,
      '最大库存': m.max_stock || 99999,
      '价格': m.price || 0,
      '条形码': m.barcode || '',
      '备注': m.remark || ''
    }))
    exportToCSV(exportData, `物料_${new Date().toISOString().slice(0,10)}.csv`)
  }

  const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/') }

  const filteredMaterials = materials.filter(m => 
    !searchKeyword || m.name?.includes(searchKeyword) || m.code?.includes(searchKeyword)
  )

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">加载中...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">物料管理</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 操作按钮栏 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => { setEditingMaterial(null); setFormData({code:'',name:'',category:'',spec:'',unit:'件',min_stock:0,max_stock:99999,price:0,barcode:'',remark:''}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + 新增物料
            </button>
            <button onClick={downloadTemplate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              下载模板
            </button>
            <label className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 cursor-pointer">
              导入Excel
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv,.xlsx,.xls" className="hidden" />
            </label>
            <button onClick={handleExport} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              导出Excel
            </button>
          </div>
          <input 
            type="text" 
            placeholder="搜索物料..." 
            value={searchKeyword} 
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
        </div>

        {/* 物料列表 */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">编码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">安全库存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">条形码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.spec || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.category || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.unit || '件'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.min_stock || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">¥{m.price || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{m.barcode || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(m)} className="text-blue-600 hover:text-blue-900 mr-4">编辑</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMaterials.length===0&&<div className="text-center py-8 text-gray-500">暂无数据</div>}
        </div>
      </main>

      {/* 新增/编辑物料弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingMaterial ? '编辑物料' : '新增物料'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">物料编码</label>
                  <input type="text" value={formData.code} onChange={(e)=>setFormData({...formData,code:e.target.value})} className="mt-1 block w-full border rounded p-2" placeholder="留空自动生成" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">物料名称 *</label>
                  <input type="text" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} className="mt-1 block w-full border rounded p-2" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">规格</label>
                  <input type="text" value={formData.spec} onChange={(e)=>setFormData({...formData,spec:e.target.value})} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">单位</label>
                  <select value={formData.unit} onChange={(e)=>setFormData({...formData,unit:e.target.value})} className="mt-1 block w-full border rounded p-2">
                    <option value="件">件</option>
                    <option value="个">个</option>
                    <option value="箱">箱</option>
                    <option value="盒">盒</option>
                    <option value="kg">kg</option>
                    <option value="米">米</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">分类</label>
                  <input type="text" value={formData.category} onChange={(e)=>setFormData({...formData,category:e.target.value})} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">价格</label>
                  <input type="number" step="0.01" value={formData.price} onChange={(e)=>setFormData({...formData,price:parseFloat(e.target.value)})} className="mt-1 block w-full border rounded p-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">安全库存</label>
                  <input type="number" value={formData.min_stock} onChange={(e)=>setFormData({...formData,min_stock:parseInt(e.target.value)})} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">最大库存</label>
                  <input type="number" value={formData.max_stock} onChange={(e)=>setFormData({...formData,max_stock:parseInt(e.target.value)})} className="mt-1 block w-full border rounded p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">条形码</label>
                <input type="text" value={formData.barcode} onChange={(e)=>setFormData({...formData,barcode:e.target.value})} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">备注</label>
                <textarea value={formData.remark} onChange={(e)=>setFormData({...formData,remark:e.target.value})} className="mt-1 block w-full border rounded p-2" rows="2" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}