import { useState, useEffect } from 'react'
import { userApi } from '../lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 检查是否已登录
    const user = localStorage.getItem('currentUser')
    if (user) {
      window.location.href = '/dashboard'
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = await userApi.login(username, password)
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
        window.location.href = '/dashboard'
      } else {
        // 如果数据库中没有，检查是否是超级管理员硬编码
        if (username === 'hwq' && password === '568394') {
          const adminUser = {
            id: 1,
            username: 'hwq',
            name: '超级管理员',
            role: 'admin'
          }
          localStorage.setItem('currentUser', JSON.stringify(adminUser))
          window.location.href = '/dashboard'
        } else {
          setError('用户名或密码错误')
        }
      }
    } catch (err) {
      setError('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          WMS仓库管理系统
        </h1>
        <p className="text-center text-gray-500 mb-8">V5.2 云端版</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition"
              placeholder="请输入密码"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-600 text-sm mb-2">角色</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition"
            >
              <option value="admin">超级管理员</option>
              <option value="manager">管理员</option>
              <option value="operator">操作员</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            }`}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>请使用您的账号登录</p>
        </div>
      </div>
    </div>
  )
}
