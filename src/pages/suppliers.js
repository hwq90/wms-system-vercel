import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function Suppliers() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({ code: '', name: '', contact: '', phone: '', email: '', address: '', status: 'active', remark: '' })

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    try {
      const data = await api.getSuppliers()
      setSuppliers(data || [])
    } catch (error) { console.error('获取供应商列表失败:', error) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSupplier) { await api.updateSupplier(editingSupplier.id, formData) }
      else { await api.createSupplier(formData) }
      setShowModal(false); setEditingSupplier(null); setFormData({code:'',name:'',contact:'',phone:'',email:'',address:'',status:'active',remark:''})
      fetchSuppliers()
    } catch (error) { alert('保存失败: ' + error.message) }
  }

  const handleEdit = (s) => { setEditingSupplier(s); setFormData(s); setShowModal(true) }
  const handleDelete = async (id) => { if(!confirm('确定删除?'))return; try{await api.deleteSupplier(id);fetchSuppliers()}catch(e){alert(e.message)} }
  const handleLogout = () => { localStorage.removeItem('user'); router.push('/') }

  if(loading)return<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">加载中...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-900">供应商管理</h1><div className="flex items-center space-x-4"><button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button><button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button></div></div></header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center"><div className="text-gray-600">共 {suppliers.length} 个供应商</div><button onClick={()=>{setEditingSupplier(null);setFormData({code:'',name:'',contact:'',phone:'',email:'',address:'',status:'active',remark:''});setShowModal(true)}} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ 新增供应商</button></div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">编码</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系人</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">电话</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((s)=>(<tr key={s.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.code}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.contact||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phone||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded text-xs ${s.status==='active'?'bg-green-100 text-green-800':'bg-gray-100 text-gray-800'}`}>{s.status==='active'?'启用':'停用'}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={()=>handleEdit(s)} className="text-blue-600 hover:text-blue-900 mr-4">编辑</button><button onClick={()=>handleDelete(s.id)} className="text-red-600 hover:text-red-900">删除</button></td></tr>))}
            </tbody>
          </table>
          {suppliers.length===0&&<div className="text-center py-8 text-gray-500">暂无数据</div>}
        </div>
      </main>
      {showModal&&(<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"><div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"><h3 className="text-lg font-medium text-gray-900 mb-4">{editingSupplier?'编辑供应商':'新增供应商'}</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">编码</label><input type="text" value={formData.code} onChange={(e)=>setFormData({...formData,code:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">名称</label><input type="text" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">联系人</label><input type="text" value={formData.contact} onChange={(e)=>setFormData({...formData,contact:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">电话</label><input type="text" value={formData.phone} onChange={(e)=>setFormData({...formData,phone:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">邮箱</label><input type="email" value={formData.email} onChange={(e)=>setFormData({...formData,email:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">地址</label><input type="text" value={formData.address} onChange={(e)=>setFormData({...formData,address:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">状态</label><select value={formData.status} onChange={(e)=>setFormData({...formData,status:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2"><option value="active">启用</option><option value="inactive">停用</option></select></div><div><label className="block text-sm font-medium text-gray-700">备注</label><textarea value={formData.remark} onChange={(e)=>setFormData({...formData,remark:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" /></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button></div></form></div></div>)}
    </div>
  )
}
