import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function Locations() {
  const router = useRouter()
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({ code: '', warehouse_id: '', zone: '', shelf: '', layer: '', position: '', capacity: 999, remark: '' })

  useEffect(() => { Promise.all([fetchLocations(), fetchWarehouses()]).finally(()=>setLoading(false)) }, [])

  const fetchLocations = async () => { try{const d=await api.getLocations();setLocations(d||[])}catch(e){console.error(e)} }
  const fetchWarehouses = async () => { try{const d=await api.getWarehouses();setWarehouses(d||[])}catch(e){} }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingLocation) { await api.updateLocation(editingLocation.id, formData) }
      else { await api.createLocation(formData) }
      setShowModal(false); setEditingLocation(null); setFormData({code:'',warehouse_id:'',zone:'',shelf:'',layer:'',position:'',capacity:999,remark:''})
      fetchLocations()
    } catch (error) { alert('保存失败: ' + error.message) }
  }

  const handleEdit = (l) => { setEditingLocation(l); setFormData(l); setShowModal(true) }
  const handleDelete = async (id) => { if(!confirm('确定删除?'))return; try{await api.deleteLocation(id);fetchLocations()}catch(e){alert(e.message)} }
  const handleLogout = () => { localStorage.removeItem('user'); router.push('/') }

  const getWarehouseName = (id) => warehouses.find(w=>w.id===id)?.name || id?.slice(0,8)

  if(loading)return<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">加载中...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-900">库位管理</h1><div className="flex items-center space-x-4"><button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button><button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button></div></div></header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center"><div className="text-gray-600">共 {locations.length} 个库位</div><button onClick={()=>{setEditingLocation(null);setFormData({code:'',warehouse_id:'',zone:'',shelf:'',layer:'',position:'',capacity:999,remark:''});setShowModal(true)}} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ 新增库位</button></div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库位编码</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">区域</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">货架</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">层</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">容量</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.map((l)=>(<tr key={l.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{l.code}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getWarehouseName(l.warehouse_id)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.zone||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.shelf||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.layer||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.position||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.capacity}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={()=>handleEdit(l)} className="text-blue-600 hover:text-blue-900 mr-4">编辑</button><button onClick={()=>handleDelete(l.id)} className="text-red-600 hover:text-red-900">删除</button></td></tr>))}
            </tbody>
          </table>
          {locations.length===0&&<div className="text-center py-8 text-gray-500">暂无数据</div>}
        </div>
      </main>
      {showModal&&(<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"><div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"><h3 className="text-lg font-medium text-gray-900 mb-4">{editingLocation?'编辑库位':'新增库位'}</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">库位编码</label><input type="text" value={formData.code} onChange={(e)=>setFormData({...formData,code:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">仓库</label><select value={formData.warehouse_id} onChange={(e)=>setFormData({...formData,warehouse_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required><option value="">请选择</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div><div className="flex gap-4"><div className="flex-1"><label className="block text-sm font-medium text-gray-700">区域</label><input type="text" value={formData.zone} onChange={(e)=>setFormData({...formData,zone:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-1"><label className="block text-sm font-medium text-gray-700">货架</label><input type="text" value={formData.shelf} onChange={(e)=>setFormData({...formData,shelf:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div></div><div className="flex gap-4"><div className="flex-1"><label className="block text-sm font-medium text-gray-700">层</label><input type="text" value={formData.layer} onChange={(e)=>setFormData({...formData,layer:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-1"><label className="block text-sm font-medium text-gray-700">位置</label><input type="text" value={formData.position} onChange={(e)=>setFormData({...formData,position:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div></div><div><label className="block text-sm font-medium text-gray-700">容量</label><input type="number" value={formData.capacity} onChange={(e)=>setFormData({...formData,capacity:parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">备注</label><textarea value={formData.remark} onChange={(e)=>setFormData({...formData,remark:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" /></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button></div></form></div></div>)}
    </div>
  )
}