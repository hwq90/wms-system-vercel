import { useState, useEffect } from 'react'
import { userApi } from '../lib/api'
import Link from 'next/link'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'operator',
    remark: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await userApi.getAll()
      setUsers(data)
    } catch (err) {
      console.error('加载用户失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, formData)
      } else {
        await userApi.create(formData)
      }
      setShowForm(false)
      setEditingUser(null)
      setFormData({ username: '', name: '', password: '', role: 'operator', remark: '' })
      loadUsers()
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      name: user.name || '',
      password: user.password,
      role: user.role,
      remark: user.remark || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该用户吗？')) return
    try {
      await userApi.delete(id)
      loadUsers()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const roleText = { admin: '超级管理员', manager: '管理员', operator: '操作员' }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-white hover:underline">← 返回</Link>
          <h1 className="text-lg font-bold">用户管理</h1>
          <button
            onClick={() => {
              setEditingUser(null)
              setFormData({ username: '', name: '', password: '', role: 'operator', remark: '' })
              setShowForm(true)
            }}
            className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            + 添加用户
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">加载中...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm">
            {users.length === 0 ? (
              <div className="text-center py-10 text-gray-500">暂无用户数据</div>
            ) : (
              <div className="divide-y">
                {users.map(user => (
                  <div key={user.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        <span className={`px-2 py-1 rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-600' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {roleText[user.role]}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? '编辑用户' : '添加用户'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-600 text-sm mb-2">用户名 *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 text-sm mb-2">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 text-sm mb-2">密码 *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 text-sm mb-2">角色</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 outline-none"
                >
                  <option value="admin">超级管理员</option>
                  <option value="manager">管理员</option>
                  <option value="operator">操作员</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 text-sm mb-2">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={e => setFormData({...formData, remark: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 outline-none"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
