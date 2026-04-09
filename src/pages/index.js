import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    if (username === 'hwq' && password === '568394') {
      localStorage.setItem('currentUser', JSON.stringify({ username: 'hwq', role: 'admin' }))
      window.location.href = '/dashboard'
    } else {
      alert('用户名或密码错误')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>WMS仓库管理系统</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>V5.2 云端版</p>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#4b5563', fontSize: '14px', marginBottom: '8px' }}>用户名</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none' }} placeholder="请输入用户名" />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#4b5563', fontSize: '14px', marginBottom: '8px' }}>密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none' }} placeholder="请输入密码" />
        </div>
        <button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: 'linear-gradient(to right, #3b82f6, #9333ea)', color: 'white', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>登录</button>
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          <p>默认账号: hwq / 568394</p>
        </div>
      </div>
    </div>
  )
}
