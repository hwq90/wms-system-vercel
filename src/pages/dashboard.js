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

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 多语言
  const langPack = {
    zh: {
      dashboard: '控制台', materials: '物料', inventory: '库存',
      warning: '预警', exportExcel: '导出Excel',
      searchPlaceholder: '搜索物料/批次/库位/规格'
    },
    en: {
      dashboard: 'Dashboard', materials: 'Materials', inventory: 'Inventory',
      warning: 'Warnings', exportExcel: 'Export Excel',
      searchPlaceholder: 'Search material/batch/location/spec'
    },
    ja: {
      dashboard: 'ダッシュボード', materials: '素材', inventory: '在庫',
      warning: '警告', exportExcel: 'エクセル出力',
      searchPlaceholder: '素材・ロット・棚番・規格を検索'
    }
  }
  const [lang, setLang] = useState('zh')
  const t = langPack[lang]

  // PDA 模式（大按钮）
  const [pdaMode, setPdaMode] = useState(false)

  // 统计
  const [stats, setStats] = useState({
    materials: 0, inventory: 0, orders: 0, warnings: 0,
    warehouses: 0, suppliers: 0, expireWarnings: 0, batches: 0
  })

  // 全局搜索
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState([])
  const searchRef = useRef(null)

  // 权限
  const permissions = {
    admin: ['*'],
    manager: ['materials','inventory','batches','scan-in','scan-out','transfer','check'],
    operator: ['materials','inventory','current-inventory']
  }
  const canAccess = (key) => user?.role === 'admin' || permissions[user.role]?.includes(key)

  // 日志（审计级：记录修改前后）
  const [auditLogs, setAuditLogs] = useState([])
  const addAuditLog = (action, target, oldVal, newVal) => {
    const log = {
      user: user?.username,
      action, target, oldVal, newVal,
      time: new Date().toLocaleString(),
      ip: 'client'
    }
    setAuditLogs(prev => [log, ...prev].slice(0, 100))
    localStorage.setItem('auditLogs', JSON.stringify([log, ...prev]))
  }

  // 回收站
  const [recycleBin, setRecycleBin] = useState([])
  const restoreItem = (item) => {
    addAuditLog('恢复数据', item.type, '已删除', '已恢复')
  }

  // 备份
  const autoBackup = () => {
    const data = { stats, auditLogs, time: new Date() }
    localStorage.setItem('backup_' + Date.now(), JSON.stringify(data))
    addAuditLog('自动备份', 'system', null, null)
  }

  // 加载数据
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
        materialApi.getAll() || [], inventoryApi.getAll() || [],
        orderApi.getAll() || [], warehouseApi.getAll() || [],
        supplierApi.getAll() || [], batchApi.getAll() || [],
        locationApi.getAll() || []
      ])

      const warnings = inv.filter(it => {
        const m = ms.find(x => x.id === it.material_id)
        return m && it.quantity <= m.min_stock
      }).length

      const expireWarnings = inv.filter(it =>
        it.expireDate && new Date(it.expireDate) <= Date.now() + 7 * 86400e3
      ).length

      setStats({
        materials: ms.length,
        inventory: inv.reduce((s, i) => s + (i.quantity || 0), 0),
        orders: od.length, warnings, expireWarnings,
        warehouses: ws.length, suppliers: su.length, batches: bt.length
      })
    } catch (e) {} finally { setLoading(false) }
  }

  // 全局搜索联想
  useEffect(() => {
    if (!search) return setSearchResult([])
    const mock = [
      { id: 1, text: `物料: ${search}`, type: 'material' },
      { id: 2, text: `批次: BATCH-${search.slice(0,4)}`, type: 'batch' },
      { id: 3, text: `库位: LOC-${search.toUpperCase()}`, type: 'location' }
    ]
    setSearchResult(mock)
  }, [search])

  // 退出
  const logout = () => {
    addAuditLog('退出', 'user', user?.username, null)
    localStorage.removeItem('currentUser')
    window.location.href = '/'
  }

  // 导出
  const exportReport = () => {
    const sheet = XLSX.utils.json_to_sheet(auditLogs.slice(0,50))
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, '流水报表')
    XLSX.writeFile(book, `WMS流水报表_${new Date().toLocaleDateString()}.xlsx`)
    addAuditLog('导出报表', 'report', null, 'Excel')
  }

  // 打印模板
  const printTemplate = (type) => {
    const content = {
      in: `入库单\n物料:XXX\n批次:BATCH-XXXX\n库位:LOC-A1\n操作员:${user?.username}`,
      out: '出库单...', check: '盘点单...', label: '条码标签...'
    }[type]
    window.open().document.write(`<pre>${content}</pre>`)
    addAuditLog('打印', type, null, content)
  }

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center">加载中...</div>

  return (
    <div className={`min-h-screen bg-gray-100 text-sm md:text-base ${pdaMode ? 'text-lg' : ''}`}>
      {/* 头部 */}
      <header className="bg-blue-600 text-white p-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <h1 className="font-bold">🏬 WMS</h1>
          <div className="flex gap-1 flex-wrap text-xs">
            <button onClick={()=>setLang('zh')} className="px-1 bg-white/20 rounded">中</button>
            <button onClick={()=>setLang('en')} className="px-1 bg-white/20 rounded">EN</button>
            <button onClick={()=>setLang('ja')} className="px-1 bg-white/20 rounded">日</button>
            <button onClick={()=>setPdaMode(!pdaMode)} className="px-1 bg-white/20 rounded">
              {pdaMode ? '普通' : 'PDA'}
            </button>
            <span className="px-2 bg-white/20 rounded">{user.name||user.username}</span>
            <button onClick={logout} className="bg-red-500 px-2 py-1 rounded text-xs">退出</button>
          </div>
        </div>
      </header>

      {/* 全局搜索 */}
      <div className="max-w-7xl mx-auto p-2 relative">
        <input
          ref={searchRef}
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full p-2 border rounded mb-2"
        />
        {searchResult.length > 0 && (
          <div className="absolute bg-white border w-full z-40 shadow-lg max-h-40 overflow-y-auto">
            {searchResult.map(r=>(
              <div key={r.id} className="p-2 border-b hover:bg-blue-50">{r.text}</div>
            ))}
          </div>
        )}
      </div>

      {/* 统计卡片 */}
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

      {/* 图表 */}
      <div className="max-w-7xl mx-auto px-2 mb-3">
        <div className="bg-white p-3 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[
              {day:'1',in:22,out:18},{day:'2',in:15,out:30},{day:'3',in:35,out:12}
            ]}>
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

      {/* 功能按钮区（PDA 大按钮） */}
      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className={`grid gap-2 
          ${pdaMode 
            ? 'grid-cols-2 sm:grid-cols-3' 
            : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'
          }`}>
          {canAccess('materials') && (
            <Link href="/materials" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50">
              <div className="text-xl">📦</div>
              <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>物料管理</div>
            </Link>
          )}
          {canAccess('batches') && (
            <Link href="/batches" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50">
              <div className="text-xl">📄</div>
              <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>批次管理</div>
            </Link>
          )}
          {canAccess('inventory') && (
            <Link href="/inventory" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50">
              <div className="text-xl">📊</div>
              <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>库存管理</div>
            </Link>
          )}
          {canAccess('scan-in') && (
            <Link href="/scan-in" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50">
              <div className="text-xl">📥</div>
              <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>扫码入库</div>
            </Link>
          )}
          {canAccess('scan-out') && (
            <Link href="/scan-out" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50">
              <div className="text-xl">📤</div>
              <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>扫码出库</div>
            </Link>
          )}
          {canAccess('transfer') && (
            <Link href="/transfer" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50">
              <div className="text-xl">🔁</div>
              <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>仓库调拨</div>
            </Link>
          )}
          {canAccess('check') && (
            <Link href="/check" className="bg-white p-3 rounded-xl text-center shadow hover:bg-blue-50">
              <div className="text-xl">🔍</div>
              <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>盘点</div>
            </Link>
          )}
          <button onClick={exportReport} className="bg-green-500 text-white p-3 rounded-xl text-center">
            <div className="text-xl">📥</div>
            <div className={pdaMode ? 'text-base mt-1' : 'text-xs'}>导出报表</div>
          </button>
        </div>
      </div>

      {/* 打印模板 */}
      <div className="max-w-7xl mx-auto px-2 mb-3 flex gap-2 flex-wrap">
        <button onClick={()=>printTemplate('in')} className="bg-blue-600 text-white px-3 py-1 rounded">打印入库单</button>
        <button onClick={()=>printTemplate('out')} className="bg-blue-600 text-white px-3 py-1 rounded">打印出库单</button>
        <button onClick={()=>printTemplate('check')} className="bg-blue-600 text-white px-3 py-1 rounded">打印盘点单</button>
        <button onClick={()=>printTemplate('label')} className="bg-blue-600 text-white px-3 py-1 rounded">打印条码</button>
      </div>

      {/* 审计日志 */}
      <div className="max-w-7xl mx-auto px-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow max-h-48 overflow-y-auto">
          <h3 className="font-bold text-sm mb-2">操作审计日志</h3>
          {auditLogs.slice(0,20).map((log,i)=>(
            <div key={i} className="text-xs border-b py-1 text-gray-700">
              [{log.time}] {log.user} | {log.action} | {log.target}
              {log.oldVal && ` ← ${log.oldVal}`}
              {log.newVal && ` → ${log.newVal}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
