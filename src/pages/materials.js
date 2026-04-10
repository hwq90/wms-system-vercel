import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function Materials() {
  const router = useRouter()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    spec: '',
    unit: '件',
    min_stock: 0,
    max_stock: 99999,
    barcode: '',
    remark: ''
  })

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      const data = await api.getMaterials()
      setMaterials(data || [])
    } catch (error) {
      console.error('获取物料列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMaterial) {
        await api.updateMaterial(editingMaterial.id, formData)
      } else {
        await api.createMaterial(formData)
      }
      setShowModal(false)
      setEditingMaterial(null)
      setFormData({
        code: '', name: '', category: '', spec: '', unit: '件',
        min_stock: 0, max_stock: 99999, barcode: '', remark: ''
      })
      fetchMaterials()
    } catch (error) {
      alert('保存失败: ' + error.message)
    }
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
    } catch (error) {
      alert('删除失败: ' + error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

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
        <div className="mb-6 flex justify-between items-center">
          <div className="text-gray-600">共 {materials.length} 个物料</div>
          <button onClick={() => { setEditingMaterial(null); setFormData({code:'',name:'',category:'',spec:'',unit:'件',min_stock:0,max_stock:99999,barcode:'',remark:''}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ 新增物料</button>
        </div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物料编码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物料名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存预警</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.category || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.spec || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.min_stock} - {material.max_stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(material)} className="text-blue-600 hover:text-blue-900 mr-4">编辑</button>
                    <button onClick={() => handleDelete(material.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {materials.length === 0 && <div className="text-center py-8 text-gray-500">暂无物料数据</div>}
        </div>
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingMaterial ? '编辑物料' : '新增物料'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">物料编码</label><input type="text" value={formData.code} onChange={(e)=>setFormData({...formData,code:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700">物料名称</label><input type="text" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700">分类</label><input type="text" value={formData.category} onChange={(e)=>setFormData({...formData,category:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700">规格</label><input type="text" value={formData.spec} onChange={(e)=>setFormData({...formData,spec:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700">单位</label><input type="text" value={formData.unit} onChange={(e)=>setFormData({...formData,unit:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
              <div className="flex gap-4"><div className="flex-1"><label className="block text-sm font-medium text-gray-700">最小库存</label><input type="number" value={formData.min_stock} onChange={(e)=>setFormData({...formData,min_stock:parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-1"><label className="block text-sm font-medium text-gray-700">最大库存</label><input type="number" value={formData.max_stock} onChange={(e)=>setFormData({...formData,max_stock:parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700">条码</label><input type="text" value={formData.barcode} onChange={(e)=>setFormData({...formData,barcode:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700">备注</label><textarea value={formData.remark} onChange={(e)=>setFormData({...formData,remark:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" /></div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
