import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function Warehouses() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [formData, setFormData] = useState({ code: '', name: '', address: '', manager: '', phone: '', remark: '' })

  useEffect(() => { fetchWarehouses() }, [])

  const fetchWarehouses = async () => {
    try {
      const data = await api.getWarehouses()
      setWarehouses(data || [])
    } catch (error) { console.error('获取仓库列表失败:', error) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingWarehouse) { await api.updateWarehouse(editingWarehouse.id, formData) }
      else { await api.createWarehouse(formData) }
      setShowModal(false); setEditingWarehouse(null); setFormData({code:'',name:'',address:'',manager:'',phone:'',remark:''})
      fetchWarehouses()
    } catch (error) { alert('保存失败: ' + error.message) }
  }

  const handleEdit = (w) => { setEditingWarehouse(w); setFormData(w); setShowModal(true) }
  const handleDelete = async (id) => { if(!confirm('确定删除?'))return; try{await api.deleteWarehouse(id);fetchWarehouses()}catch(e){alert(e.message)} }
  const handleLogout = () => { localStorage.removeItem('user'); router.push('/') }

  if(loading)return<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">加载中...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-900">仓库管理</h1><div className="flex items-center space-x-4"><button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button><button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button></div></div></header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center"><div className="text-gray-600">共 {warehouses.length} 个仓库</div><button onClick={()=>{setEditingWarehouse(null);setFormData({code:'',name:'',address:'',manager:'',phone:'',remark:''});setShowModal(true)}} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ 新增仓库</button></div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">编码</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">地址</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">负责人</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">电话</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {warehouses.map((w)=>(<tr key={w.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.code}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.name}</td><td className="px-6 py-4 text-sm text-gray-500">{w.address||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.manager||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.phone||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={()=>handleEdit(w)} className="text-blue-600 hover:text-blue-900 mr-4">编辑</button><button onClick={()=>handleDelete(w.id)} className="text-red-600 hover:text-red-900">删除</button></td></tr>))}
            </tbody>
          </table>
          {warehouses.length===0&&<div className="text-center py-8 text-gray-500">暂无数据</div>}
        </div>
      </main>
      {showModal&&(<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"><div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"><h3 className="text-lg font-medium text-gray-900 mb-4">{editingWarehouse?'编辑仓库':'新增仓库'}</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">编码</label><input type="text" value={formData.code} onChange={(e)=>setFormData({...formData,code:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">名称</label><input type="text" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">地址</label><input type="text" value={formData.address} onChange={(e)=>setFormData({...formData,address:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">负责人</label><input type="text" value={formData.manager} onChange={(e)=>setFormData({...formData,manager:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">电话</label><input type="text" value={formData.phone} onChange={(e)=>setFormData({...formData,phone:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">备注</label><textarea value={formData.remark} onChange={(e)=>setFormData({...formData,remark:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" /></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button></div></form></div></div>)}
    </div>
  )
}
