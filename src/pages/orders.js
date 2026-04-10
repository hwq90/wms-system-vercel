import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

export default function Orders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ order_no: '', type: 'in', status: 'pending', warehouse_id: '', supplier_id: '', customer_name: '', customer_phone: '', customer_address: '', remark: '' })

  useEffect(() => { Promise.all([fetchOrders(), fetchWarehouses(), fetchSuppliers()]).finally(()=>setLoading(false)) }, [])

  const fetchOrders = async () => { try{const d=await api.getOrders();setOrders(d||[])}catch(e){console.error(e)} }
  const fetchWarehouses = async () => { try{const d=await api.getWarehouses();setWarehouses(d||[])}catch(e){} }
  const fetchSuppliers = async () => { try{const d=await api.getSuppliers();setSuppliers(d||[])}catch(e){} }

  const generateOrderNo = () => { return 'PO' + Date.now() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createOrder({...formData, order_no: formData.order_no || generateOrderNo()})
      setShowModal(false); setFormData({order_no:'',type:'in',status:'pending',warehouse_id:'',supplier_id:'',customer_name:'',customer_phone:'',customer_address:'',remark:''})
      fetchOrders()
    } catch (error) { alert('保存失败: ' + error.message) }
  }

  const handleStatusChange = async (id, status) => { try{await api.updateOrder(id,{status});fetchOrders()}catch(e){alert(e.message)} }
  const handleDelete = async (id) => { if(!confirm('确定删除?'))return; try{await api.deleteOrder(id);fetchOrders()}catch(e){alert(e.message)} }
  const handleLogout = () => { localStorage.removeItem('user'); router.push('/') }

  const getWarehouseName = (id) => warehouses.find(w=>w.id===id)?.name || '-'
  const getSupplierName = (id) => suppliers.find(s=>s.id===id)?.name || '-'
  const statusMap = {pending:'待处理',processing:'处理中',completed:'已完成',cancelled:'已取消'}
  const typeMap = {in:'入库',out:'出库'}

  if(loading)return<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">加载中...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-900">订单管理</h1><div className="flex items-center space-x-4"><button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button><button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button></div></div></header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center"><div className="text-gray-600">共 {orders.length} 个订单</div><button onClick={()=>setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ 新建订单</button></div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状��</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">供应商</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((o)=>(<tr key={o.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{o.order_no}</td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded text-xs ${o.type==='in'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>{typeMap[o.type]}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded text-xs ${o.status==='completed'?'bg-green-100 text-green-800':o.status==='cancelled'?'bg-gray-100 text-gray-800':'bg-yellow-100 text-yellow-800'}`}>{statusMap[o.status]}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getWarehouseName(o.warehouse_id)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSupplierName(o.supplier_id)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.customer_name||'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.created_at?new Date(o.created_at).toLocaleString():'-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={()=>handleStatusChange(o.id,o.status==='pending'?'processing':o.status==='processing'?'completed':'pending')} className="text-blue-600 hover:text-blue-900 mr-4">{o.status==='pending'?'开始':o.status==='processing'?'完成':'重置'}</button><button onClick={()=>handleDelete(o.id)} className="text-red-600 hover:text-red-900">删除</button></td></tr>))}
            </tbody>
          </table>
          {orders.length===0&&<div className="text-center py-8 text-gray-500">暂无数据</div>}
        </div>
      </main>
      {showModal&&(<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"><div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"><h3 className="text-lg font-medium text-gray-900 mb-4">新建订单</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">订单号(留空自动生成)</label><input type="text" value={formData.order_no} onChange={(e)=>setFormData({...formData,order_no:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div className="flex gap-4"><div className="flex-1"><label className="block text-sm font-medium text-gray-700">类型</label><select value={formData.type} onChange={(e)=>setFormData({...formData,type:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2"><option value="in">入库</option><option value="out">出库</option></select></div><div className="flex-1"><label className="block text-sm font-medium text-gray-700">仓库</label><select value={formData.warehouse_id} onChange={(e)=>setFormData({...formData,warehouse_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2"><option value="">请选择</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div></div><div><label className="block text-sm font-medium text-gray-700">供应商</label><select value={formData.supplier_id} onChange={(e)=>setFormData({...formData,supplier_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2"><option value="">请��择</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700">客户名称</label><input type="text" value={formData.customer_name} onChange={(e)=>setFormData({...formData,customer_name:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">客户电话</label><input type="text" value={formData.customer_phone} onChange={(e)=>setFormData({...formData,customer_phone:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">客户地址</label><input type="text" value={formData.customer_address} onChange={(e)=>setFormData({...formData,customer_address:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700">备注</label><textarea value={formData.remark} onChange={(e)=>setFormData({...formData,remark:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" /></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button></div></form></div></div>)}
    </div>
  )
}