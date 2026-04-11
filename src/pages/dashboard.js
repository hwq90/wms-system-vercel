import { useState, useEffect, useRef } from 'react'
import {
  userApi, materialApi, inventoryApi, orderApi,
  supplierApi, warehouseApi, logApi, backupApi,
  batchApi, locationApi, checkApi, transferApi
} from '../lib/api'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts'
import * as XLSX from 'xlsx'
import JsBarcode from 'jsbarcode'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const langPack = {
    zh: {
      dashboard: '控制台', materials: '物料', inventory: '库存',
      warning: '预警', exportExcel: '导出Excel',
      searchPlaceholder: '搜索物料/批次/库位/规格',
      realTimeInventory: '即时库存',
      pickList: '智能拣货', generatePick: '生成拣货单', pickEmpty: '暂无需要拣货',
      location: '库位', batch: '批次', qty: '数量', expireDate: '有效期', pickQty: '需拣货',
      returnManage: '退货管理', returnList: '退货列表', returnAdd: '登记退货',
      returnMaterial: '退货物料', returnQty: '退货数量', returnReason: '退货原因',
      returnStatus: '状态', returnTime: '退货时间', returnWait: '待处理', returnDone: '已完成',
      locationManage: '库位管理', locationEdit: '编辑库位', locationBarcode: '库位条码',
      locationName: '库位名称', printBarcode: '打印条码',
    },
    en: {
      dashboard: 'Dashboard', materials: 'Materials', inventory: 'Inventory',
      warning: 'Warnings', exportExcel: 'Export Excel',
      searchPlaceholder: 'Search material/batch/location/spec',
      realTimeInventory: 'Real-time Inventory',
      pickList: 'Smart Picking', generatePick: 'Generate Pick', pickEmpty: 'Nothing to pick',
      location: 'Location', batch: 'Batch', qty: 'Qty', expireDate: 'Expire', pickQty: 'Pick Qty',
      returnManage: 'Return', returnList: 'Return List', returnAdd: 'Add Return',
      returnMaterial: 'Material', returnQty: 'Qty', returnReason: 'Reason',
      returnStatus: 'Status', returnTime: 'Time', returnWait: 'Waiting', returnDone: 'Completed',
      locationManage: 'Locations', locationEdit: 'Edit', locationBarcode: 'Barcode',
      locationName: 'Name', printBarcode: 'Print',
    },
    ja: {
      dashboard: 'ダッシュボード', materials: '素材', inventory: '在庫',
      warning: '警告', exportExcel: 'エクセル出力',
      searchPlaceholder: '素材・ロット・棚番・規格を検索',
      realTimeInventory: 'リアルタイム在庫',
      pickList: 'スマートピッキング', generatePick: 'ピッキングリスト作成', pickEmpty: 'ピッキング対象なし',
      location: '棚番', batch: 'ロット', qty: '数', expireDate: '有効期間', pickQty: 'ピッキング数',
      returnManage: '返品', returnList: '返品一覧', returnAdd: '返品登録',
      returnMaterial: '素材', returnQty: '返品数', returnReason: '理由',
      returnStatus: '状態', returnTime: '時間', returnWait: '待処理', returnDone: '完了',
      locationManage: '棚番管理', locationEdit: '編集', locationBarcode: 'バーコード',
      locationName: '棚番名', printBarcode: '印刷',
    }
  }

  const [lang, setLang] = useState('zh')
  const t = langPack[lang]

  const [pdaMode, setPdaMode] = useState(false)

  const [stats, setStats] = useState({
    materials: 0, inventory: 0, orders: 0, warnings: 0,
    warehouses: 0, suppliers: 0, expireWarnings: 0, batches: 0
  })

  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState([])
  const searchRef = useRef(null)

  const permissions = {
    admin: ['*'],
    manager: ['materials','inventory','batches','scan-in','scan-out','transfer','check'],
    operator: ['materials','inventory','current-inventory']
  }

  const canAccess = (key) => user?.role === 'admin' || permissions[user.role]?.includes(key)

  const [auditLogs, setAuditLogs] = useState([])
  const addAuditLog = (action, target, oldVal, newVal) => {
    const log = {
      user: user?.username, action, target, oldVal, newVal,
      time: new Date().toLocaleString(), ip: 'client'
    }
    setAuditLogs(prev => [log, ...prev].slice(0, 100))
  }

  const autoBackup = () => {
    const data = { stats, auditLogs, time: new Date() }
    addAuditLog('自动备份', 'system', null, null)
  }

  const [realTimeInventory, setRealTimeInventory] = useState([])
  const [pickList, setPickList] = useState([])

  const generatePickList = () => {
    const pick = realTimeInventory.filter(i => i.quantity < i.minStock && i.quantity > 0)
      .map(i => ({ ...i, pickQty: i.minStock - i.quantity }))
    setPickList(pick)
    addAuditLog('生成拣货单', 'picking', null, pick.length)
  }

  const [returnList, setReturnList] = useState([])
  const [returnForm, setReturnForm] = useState({ material: '', qty: 1, reason: '' })

  const addReturn = () => {
    if (!returnForm.material || returnForm.qty < 1) return
    const newReturn = {
      id: Date.now(),
      material: returnForm.material,
      qty: returnForm.qty,
      reason: returnForm.reason,
      status: 'waiting',
      time: new Date().toLocaleString()
    }
    setReturnList(prev => [newReturn, ...prev])
    setReturnForm({ material: '', qty: 1, reason: '' })
    addAuditLog('登记退货', 'return', null, newReturn.material)
  }

  const finishReturn = (id) => {
    setReturnList(prev => prev.map(r => r.id === id ? { ...r, status: 'done' } : r))
    addAuditLog('退货完成', 'return', 'waiting', 'done')
  }

  const [locations, setLocations] = useState([])
  const [editLoc, setEditLoc] = useState(null)
  const barcodeRef = useRef(null)

  const addLocation = () => {
    const name = prompt(t.locationName)
    if (!name) return
    const newLoc = { id: Date.now(), name, code: 'LOC' + Date.now().toString().slice(-6) }
    setLocations(prev => [...prev, newLoc])
    addAuditLog('新增库位', 'location', null, name)
  }

  const updateLocation = () => {
    if (!editLoc?.name) return
    setLocations(prev => prev.map(l => l.id === editLoc.id ? editLoc : l))
    setEditLoc(null)
    addAuditLog('编辑库位', 'location', editLoc.name, editLoc.name)
  }

  const printBarcode = (code) => {
    JsBarcode(barcodeRef.current, code, { format: 'CODE128', width: 2, height: 60 })
    setTimeout(() => window.print(), 100)
    addAuditLog('打印库位条码', 'barcode', null, code)
  }

  useEffect(() => {
    const userData = localStorage.getItem('currentUser')
    if (!userData) return (window.location.href = '/')
    const u = JSON.parse(userData)
    setUser(u)
    addAuditLog('登录', 'user', null, u.username)
    loadAll()
    setInterval(autoBackup, 24 * 3600 * 1000)
  }, [])

  const loadAll = async () => {
    try {
      const [ms, inv, od, ws, su, bt, loc] = await Promise.all([
        materialApi.getAll() || [], inventoryApi.getAll() || [], orderApi.getAll() || [],
        warehouseApi.getAll() || [], supplierApi.getAll() || [], batchApi.getAll() || [], locationApi.getAll() || []
      ])

      const realTime = inv.map((it, idx) => {
        const m = ms.find(x => x.id === it.material_id) || {}
        const b = bt.find(x => x.material_id === it.material_id) || {}
        const l = loc.find(x => x.id === it.location_id) || {}
        return {
          id: idx, materialName: m.name || '物料' + it.material_id,
          batchNo: b.no || '-', location: l.name || '-',
          quantity: it.quantity || 0, minStock: m.min_stock || 5,
          expireDate: it.expireDate ? new Date(it.expireDate).toLocaleDateString() : '-'
        }
      })
      setRealTimeInventory(realTime)
      setLocations(loc.length ? loc : [{ id:1, name:'A1', code:'LOC001' },{ id:2, name:'B2', code:'LOC002' }])

      const warnings = inv.filter(it => {
        const m = ms.find(x => x.id === it.material_id)
        return m && it.quantity <= m.min_stock
      }).length

      const expireWarnings = inv.filter(it =>
        it.expireDate && new Date(it.expireDate) <= Date.now() + 7 * 86400000
      ).length

      setStats({
        materials: ms.length, inventory: inv.reduce((s,i)=>s+(i.quantity||0),0),
        orders: od.length, warnings, expireWarnings,
        warehouses: ws.length, suppliers: su.length, batches: bt.length
      })
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!search) return setSearchResult([])
    setSearchResult([
      { id:1, text:'物料: ' + search, type:'material' },
      { id:2, text:'批次: BATCH-' + search.slice(0,4), type:'batch' },
      { id:3, text:'库位: LOC-' + search.toUpperCase(), type:'location' }
    ])
  }, [search])

  const logout = () => {
    addAuditLog('退出', 'user', user?.username, null)
    localStorage.removeItem('currentUser')
    window.location.href = '/'
  }

  const exportReport = () => {
    const sheet = XLSX.utils.json_to_sheet(auditLogs.slice(0,50))
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, '流水报表')
    XLSX.writeFile(book, 'WMS流水报表_' + new Date().toLocaleDateString() + '.xlsx')
    addAuditLog('导出报表', 'report', null, 'Excel')
  }

  const printTemplate = (type) => {
    let content = ""
    if (type === "in") {
      content = "入库单"
    } else if (type === "out") {
      content = "出库单"
    } else if (type === "check") {
      content = "盘点单"
    } else if (type === "label") {
      content = "条码标签"
    }
    const w = window.open()
    w.document.write("<pre>" + content + "</pre>")
    w.document.close()
  }

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center">加载中...</div>

  return (
    <div className={`min-h-screen bg-gray-100 text-sm md:text-base ${pdaMode ? 'text-lg' : ''}`}>
      <header className="bg-blue-600 text-white p-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <h1 className="font-bold">WMS 仓库管理系统</h1>
          <div className="flex gap-1 flex-wrap text-xs">
            <button onClick={()=>setLang('zh')} className="px-1 bg-white/20 rounded">中</button>
            <button onClick={()=>setLang('en')} className="px-1 bg-white/20 rounded">EN</button>
            <button onClick={()=>setLang('ja')} className="px-1 bg-white/20 rounded">日</button>
            <button onClick={()=>setPdaMode(!pdaMode)} className="px-1 bg-white/20 rounded">{pdaMode ? '普通' : 'PDA'}</button>
            <span className="px-2 bg-white/20 rounded">{user.name||user.username}</span>
            <button onClick={logout} className="bg-red-500 px-2 py-1 rounded text-xs">退出</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-2 relative">
        <input ref={searchRef} value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={t.searchPlaceholder} className="w-full p-2 border rounded mb-2" />
        {searchResult.length > 0 && (
          <div className="absolute bg-white border w-full z-40 shadow-lg max-h-40 overflow-y-auto">
            {searchResult.map(r=>(<div key={r.id} className="p-2 border-b hover:bg-blue-50">{r.text}</div>))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-3">
        {[
          { icon:'📦', val:stats.materials, label:t.materials },
          { icon:'📊', val:stats.inventory, label:t.inventory },
          { icon:'📦', val:stats.batches, label:'批次' },
          { icon:'⚠️', val:stats.warnings, label:t.warning },
          { icon:'⏳', val:stats.expireWarnings, label:'到期' },
          { icon:'🏭', val:stats.warehouses, label:'仓库' },
          { icon:'🏢', val:stats.suppliers, label:'供应商' },
        ].map((it,i)=>(
          <div key={i} className="bg-white p-2 rounded-xl text-center shadow">
            <div className="text-xl">{it.icon}</div>
            <div className="font-bold">{it.val}</div>
            <div className="text-xs text-gray-500">{it.label}</div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-3">
        <div className="bg-white p-3 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[{day:'1',in:22,out:18},{day:'2',in:15,out:30},{day:'3',in:35,out:12}]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="in" stroke="#3b82f6" name="入库" />
              <Line type="monotone" dataKey="out" stroke="#ef4444" name="出库" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow">
          <h3 className="font-bold mb-2">{t.realTimeInventory}</h3>
          <div className="overflow-x-auto max-h-44">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-1 text-left">物料</th>
                  <th className="p-1 text-left">{t.batch}</th>
                  <th className="p-1 text-left">{t.location}</th>
                  <th className="p-1 text-right">{t.qty}</th>
                  <th className="p-1 text-left">{t.expireDate}</th>
                </tr>
              </thead>
              <tbody>
                {realTimeInventory.slice(0,20).map(i=>(
                  <tr key={i.id} className="border-b">
                    <td className="p-1">{i.materialName}</td>
                    <td className="p-1">{i.batchNo}</td>
                    <td className="p-1">{i.location}</td>
                    <td className="p-1 text-right">{i.quantity}</td>
                    <td className="p-1">{i.expireDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">{t.pickList}</h3>
            <button onClick={generatePickList} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">{t.generatePick}</button>
          </div>
          <div className="overflow-x-auto max-h-44">
            {pickList.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">{t.pickEmpty}</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-1 text-left">物料</th>
                    <th className="p-1 text-left">{t.location}</th>
                    <th className="p-1 text-left">{t.batch}</th>
                    <th className="p-1 text-right">库存</th>
                    <th className="p-1 text-right text-orange-600">{t.pickQty}</th>
                  </tr>
                </thead>
                <tbody>
                  {pickList.map(i=>(
                    <tr key={i.id} className="border-b">
                      <td className="p-1">{i.materialName}</td>
                      <td className="p-1">{i.location}</td>
                      <td className="p-1">{i.batchNo}</td>
                      <td className="p-1 text-right">{i.quantity}</td>
                      <td className="p-1 text-right font-bold text-orange-600">{i.pickQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow">
          <h3 className="font-bold mb-2">{t.returnManage}</h3>
          <div className="flex gap-2 mb-2">
            <input value={returnForm.material} onChange={(e)=>setReturnForm({...returnForm, material:e.target.value})} placeholder={t.returnMaterial} className="p-1 border rounded flex-1 text-xs" />
            <input type="number" value={returnForm.qty} onChange={(e)=>setReturnForm({...returnForm, qty:+e.target.value})} className="p-1 border rounded w-16 text-xs" />
            <input value={returnForm.reason} onChange={(e)=>setReturnForm({...returnForm, reason:e.target.value})} placeholder={t.returnReason} className="p-1 border rounded flex-1 text-xs" />
            <button onClick={addReturn} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{t.returnAdd}</button>
          </div>
          <div className="overflow-x-auto max-h-40 text-xs">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-1 text-left">{t.returnMaterial}</th>
                  <th className="p-1 text-right">{t.returnQty}</th>
                  <th className="p-1 text-left">{t.returnReason}</th>
                  <th className="p-1 text-left">{t.returnStatus}</th>
                  <th className="p-1 text-left">{t.returnTime}</th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {returnList.map(r=>(
                  <tr key={r.id} className="border-b">
                    <td className="p-1">{r.material}</td>
                    <td className="p-1 text-right">{r.qty}</td>
                    <td className="p-1">{r.reason}</td>
                    <td className="p-1">
                      {r.status==='done' ? (
                        <span className="text-green-600">{t.returnDone}</span>
                      ) : (
                        <span className="text-orange-600">{t.returnWait}</span>
                      )}
                    </td>
                    <td className="p-1 text-xs">{r.time}</td>
                    {r.status!=='done' && (
                      <button onClick={()=>finishReturn(r.id)} className="bg-green-600 text-white p-1 rounded text-xs">完成</button>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">{t.locationManage}</h3>
            <button onClick={addLocation} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">+ 库位</button>
          </div>
          <div className="overflow-x-auto max-h-44 text-xs">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-1 text-left">{t.locationName}</th>
                  <th className="p-1 text-left">{t.locationBarcode}</th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {locations.map(l=>(
                  <tr key={l.id} className="border-b">
                    <td className="p-1">{l.name}</td>
                    <td className="p-1 font-mono">{l.code}</td>
                    <td><button onClick={()=>setEditLoc(l)} className="text-blue-600 p-1 text-xs">{t.locationEdit}</button></td>
                    <td><button onClick={()=>printBarcode(l.code)} className="text-green-600 p-1 text-xs">{t.printBarcode}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editLoc && (
            <div className="mt-2 flex gap-2">
              <input value={editLoc.name} onChange={(e)=>setEditLoc({...editLoc, name:e.target.value})} className="p-1 border rounded flex-1 text-xs" />
              <button onClick={updateLocation} className="bg-green-600 text-white px-2 py-1 rounded text-xs">保存</button>
              <button onClick={()=>setEditLoc(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs">取消</button>
            </div>
          )}
          <div className="hidden"><svg ref={barcodeRef}></svg></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className={`grid gap-2 ${pdaMode ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'}`}>
          {canAccess('materials') && <Link href="/materials" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50"><div className="text-xl">📦</div><div className={pdaMode?'text-base mt-1':'text-xs'}>物料管理</div></Link>}
          {canAccess('batches') && <Link href="/batches" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50"><div className="text-xl">📄</div><div className={pdaMode?'text-base mt-1':'text-xs'}>批次管理</div></Link>}
          {canAccess('inventory') && <Link href="/inventory" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50"><div className="text-xl">📊</div><div className={pdaMode?'text-base mt-1':'text-xs'}>库存管理</div></Link>}
          {canAccess('scan-in') && <Link href="/scan-in" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50"><div className="text-xl">📥</div><div className={pdaMode?'text-base mt-1':'text-xs'}>扫码入库</div></Link>}
          {canAccess('scan-out') && <Link href="/scan-out" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50"><div className="text-xl">📤</div><div className={pdaMode?'text-base mt-1':'text-xs'}>扫码出库</div></Link>}
          {canAccess('transfer') && <Link href="/transfer" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50"><div className="text-xl">🔁</div><div className={pdaMode?'text-base mt-1':'text-xs'}>仓库调拨</div></Link>}
          {canAccess('check') && <Link href="/check" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50"><div className="text-xl">🔍</div><div className={pdaMode?'text-base mt-1':'text-xs'}>盘点</div></Link>}
          <button onClick={exportReport} className="bg-green-500 text-white p-3 rounded-xl text-center"><div className="text-xl">📥</div><div className={pdaMode?'text-base mt-1':'text-xs'}>{t.exportExcel}</div></button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-3 flex gap-2 flex-wrap">
        <button onClick={()=>printTemplate('in')} className="bg-blue-600 text-white px-3 py-1 rounded">打印入库单</button>
        <button onClick={()=>printTemplate('out')} className="bg-blue-600 text-white px-3 py-1 rounded">打印出库单</button>
        <button onClick={()=>printTemplate('check')} className="bg-blue-600 text-white px-3 py-1 rounded">打印盘点单</button>
        <button onClick={()=>printTemplate('label')} className="bg-blue-600 text-white px-3 py-1 rounded">打印条码</button>
      </div>

      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow max-h-48 overflow-y-auto">
          <h3 className="font-bold text-sm mb-2">操作审计日志</h3>
          {auditLogs.slice(0,20).map((log,i)=>(
            <div key={i} className="text-xs border-b py-1 text-gray-700">
              [{log.time}] {log.user} | {log.action} | {log.target}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
