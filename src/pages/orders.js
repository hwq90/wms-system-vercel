import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

// Excel 模板下载
const downloadTemplate = (type) => {
  const headers = type === 'order' 
    ? ['订单号', '类型', '仓库', '供应商', '客户名称', '客户电话', '客户地址', '备注']
    : ['物料编码', '物料名称', '规格', '单位', '分类', '安全库存', '价格', '备注']
  
  const csvContent = headers.join(',') + '\n' + (type === 'order' 
    ? 'PO20240101001,in,仓库1,供应商A,张三,13800138000,北京市朝阳区,备注信息'
    : 'M001,物料名称,规格,个,分类A,100,10.00,备注')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${type === 'order' ? '订单' : '物料'}_导入模板.csv`
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
    if (values.length === headers.length) {
      const row = {}
      headers.forEach((h, idx) => { row[h] = values[idx] })
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

export default function Orders() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [orders, setOrders] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ 
    order_no: '', type: 'in', status: 'pending', warehouse_id: '', 
    supplier_id: '', customer_name: '', customer_phone: '', 
    customer_address: '', remark: '' 
  })

  useEffect(() => { 
    Promise.all([fetchOrders(), fetchWarehouses(), fetchSuppliers()]).finally(()=>setLoading(false)) 
  }, [])

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

  const handleStatusChange = async (id, status) => { 
    try{await api.updateOrder(id,{status});fetchOrders()}
    catch(e){alert(e.message)}
  }
  
  const handleDelete = async (id) => { 
    if(!confirm('确定删除?'))return
    try{await api.deleteOrder(id);fetchOrders()}
    catch(e){alert(e.message)}
  }

  // 导入订单
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = parseCSV(text)
      
      for (const row of data) {
        const warehouse = warehouses.find(w => w.name === row['仓库'])
        const supplier = suppliers.find(s => s.name === row['供应商'])
        
        await api.createOrder({
          order_no: row['订单号'] || generateOrderNo(),
          type: row['类型'] === '出库' ? 'out' : 'in',
          status: 'pending',
          warehouse_id: warehouse?.id || '',
          supplier_id: supplier?.id || '',
          customer_name: row['客户名称'] || '',
          customer_phone: row['客户电话'] || '',
          customer_address: row['客户地址'] || '',
          remark: row['备注'] || ''
        })
      }
      
      alert(`成功导入 ${data.length} 条订单`)
      fetchOrders()
    } catch (error) {
      alert('导入失败: ' + error.message)
    }
    
    fileInputRef.current.value = ''
  }

  // 导出订单
  const handleExport = () => {
    const exportData = orders.map(o => ({
      '订单号': o.order_no,
      '类型': o.type === 'in' ? '入库' : '出库',
      '仓库': getWarehouseName(o.warehouse_id),
      '供应商': getSupplierName(o.supplier_id),
      '客户名称': o.customer_name || '',
      '客户电话': o.customer_phone || '',
      '客户地址': o.customer_address || '',
      '状态': statusMap[o.status] || '',
      '备注': o.remark || '',
      '创建时间': o.created_at ? new Date(o.created_at).toLocaleString() : ''
    }))
    exportToCSV(exportData, `订单_${new Date().toISOString().slice(0,10)}.csv`)
  }

  const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/') }

  const getWarehouseName = (id) => warehouses.find(w=>w.id===id)?.name || '-'
  const getSupplierName = (id) => suppliers.find(s=>s.id===id)?.name || '-'
  const statusMap = {pending:'待处理',processing:'处理中',completed:'已完成',cancelled:'已取消'}
  const typeMap = {in:'入库',out:'出库'}

  if(loading)return<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">加载中...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <div className="flex items-center space-x-4">
            <button onClick={()=>router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">返回首页</button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-900">退出登录</button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 操作按钮栏 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + 新建订单
            </button>
            <button onClick={() => downloadTemplate('order')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
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
          <div className="text-gray-600">共 {orders.length} 个订单</div>
        </div>

        {/* 订单列表 */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">供应商</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((o)=>(
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{o.order_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${o.type==='in'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>
                      {typeMap[o.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${o.status==='completed'?'bg-green-100 text-green-800':o.status==='cancelled'?'bg-gray-100 text-gray-800':'bg-yellow-100 text-yellow-800'}`}>
                      {statusMap[o.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getWarehouseName(o.warehouse_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSupplierName(o.supplier_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.customer_name||'-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.created_at?new Date(o.created_at).toLocaleString():'-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={()=>handleStatusChange(o.id,o.status==='pending'?'processing':o.status==='processing'?'completed':'pending')} className="text-blue-600 hover:text-blue-900 mr-4">
                      {o.status==='pending'?'开始':o.status==='processing'?'完成':'重置'}
                    </button>
                    <button onClick={()=>handleDelete(o.id)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length===0&&<div className="text-center py-8 text-gray-500">暂无数据</div>}
        </div>
      </main>

      {/* 新建订单弹窗 */}
      {showModal&&(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">新建订单</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">订单号(留空自动生成)</label>
                <input type="text" value={formData.order_no} onChange={(e)=>setFormData({...formData,order_no:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">类型</label>
                  <select value={formData.type} onChange={(e)=>setFormData({...formData,type:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="in">入库</option>
                    <option value="out">出库</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">仓库</label>
                  <select value={formData.warehouse_id} onChange={(e)=>setFormData({...formData,warehouse_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="">请选择</option>
                    {warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">供应商</label>
                <select value={formData.supplier_id} onChange={(e)=>setFormData({...formData,supplier_id:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="">请选择</option>
                  {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">客户名称</label>
                <input type="text" value={formData.customer_name} onChange={(e)=>setFormData({...formData,customer_name:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">客户电话</label>
                <input type="text" value={formData.customer_phone} onChange={(e)=>setFormData({...formData,customer_phone:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">客户地址</label>
                <input type="text" value={formData.customer_address} onChange={(e)=>setFormData({...formData,customer_address:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">备注</label>
                <textarea value={formData.remark} onChange={(e)=>setFormData({...formData,remark:e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" />
              </div>
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