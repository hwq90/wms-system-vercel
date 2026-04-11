import { useState, useEffect, useRef } from 'react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>WMS 仓库管理系统</h1>
      <p>部署成功！</p>
    </div>
  )
}
