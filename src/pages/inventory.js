import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function Inventory() {
  const router = useRouter()
  const [inventory, setInventory] = useState([])
  const [materials, setMaterials] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ material_id: '', warehouse_id: '', location_id: '', quantity: 0, batch_no: '', production_date: '', expiry_date: '' })

  useEffect(() => { Promise.all([fetchInventory(), fetchMaterials(), fetchWarehouses(), fetchLocations()]).finally(()=>setLoading(false)) }, [])

  const fetchInventory = async () => { try{const d=await api.getInventory();setInventory(d||[])}catch(e){console.error(e)} }
  const fetchMaterials = async () => { try{const d=await api.getMaterials();setMaterials(d||[])}catch(e){} }
  const fetchWarehouses = async () => { try{const d=await api.getWarehouses();setWarehouses(d||[])}catch(e){} }
  const fetchLocations = async () => { try{const d=await api.getLocations();setLocations(d||[])}catch(e){} }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createInventory(formData)
      setShowModal(false); setFormData({material_id:'',warehouse_id:'',location_id:'',quantity:0,batch_no:'',production_date:'',expiry_date:''})
      fetchInventory()
    } catch (error) { alert('保存失败: ' + error.message) }
  }

  const handleDelete = async (id) => { if(!confirm('确定删除?'))return; try{await api.deleteInventory(id);fetchInventory()}catch(e){alert(e.message)} }
  const handleLogout = () => { localStorage.removeItem('user'); router.push('/') }

  const getMaterialName = (id) => materials.find(m=>m.id===id)?.name || id?.slice(0,8)
  const getWarehouseName = (id) => warehouses.find(w=>w.id===id)?.name || id?.slice(0,8)
  const getLocationName = (id) => locations.find(l=>l.id===id)?.code || id?.slice(0,8)

  if(loading)return<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">加载中...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-900">库存管理</h1><div className="flex items-center space-x-4"><button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button><button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button></div></div></header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center"><div className="text-gray-600">共 {inventory.length} 条记录</div><button onClick={()=>setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ 新增库存</button></div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物料</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库位</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">批号</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">生产日期</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">有效期</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((inv)=>(<tr key={inv.id}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getMaterialName(inv.material_id)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getWarehouseName(inv.warehouse_id)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getLocationName(inv.location_id)}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.quantity}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.batch_no||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.production_date||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.expiry_date||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={()=>handleDelete(inv.id)} className="text-red-600 hover:text-red-900">删除</button></td></tr>))}
            </tbody>
          </table>
          {inventory.length===0&&<div className="text-center py-8 text-gray-500">暂无数据</div>}
        </div>
      </main>
      {showModal&&(<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"><div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"><h3 className="text-lg font-medium text-gray-900 mb-4">新增库存</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">物料</label><select value={formData.material_id} onChange={(e)=>setFormData({...formData,material_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required><option value="">请选择</option>{materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700">仓库</label><select value={formData.warehouse_id} onChange={(e)=>setFormData({...formData,warehouse_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required><option value="">请选择</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700">库位</label><select value={formData.location_id} onChange={(e)=>setFormData({...formData,location_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2"><option value="">请选择</option>{locations.filter(l=>l.warehouse_id===formData.warehouse_id).map(l=><option key={l.id} value={l.id}>{l.code}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700">数量</label><input type="number" value={formData.quantity} onChange={(e)=>setFormData({...formData,quantity:parseInt(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">批号</label><input type="text" value={formData.batch_no} onChange={(e)=>setFormData({...formData,batch_no:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div className="flex gap-4"><div className="flex-1"><label className="block text-sm font-medium text-gray-700">生产日期</label><input type="date" value={formData.production_date} onChange={(e)=>setFormData({...formData,production_date:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-1"><label className="block text-sm font-medium text-gray-700">有效期</label><input type="date" value={formData.expiry_date} onChange={(e)=>setFormData({...formData,expiry_date:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button></div></form></div></div>)}
    </div>
  )
}