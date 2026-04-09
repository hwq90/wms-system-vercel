# WMS 仓库管理系统 - Vercel + Supabase 部署指南

## 架构
- **前端**: Next.js 14 + React 18 + Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth)
- **部署**: Vercel

## 部署步骤

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project"
4. 填写：
   - Name: `wms-system`
   - Database Password: （设置强密码）
   - Region: 选择离你最近的（如 Singapore）
5. 等待创建完成（约2分钟）

### 2. 配置数据库

1. 进入 Supabase Dashboard
2. 点击左侧 "SQL Editor"
3. 点击 "New query"
4. 粘贴 `supabase/migrations/001_initial_schema.sql` 的全部内容
5. 点击 "Run" 执行

### 3. 获取 API 密钥

1. 点击左侧 "Settings"（齿轮图标）
2. 选择 "API"
3. 复制以下信息：
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon/public**: `eyJ...` （以 eyJ 开头的长字符串）

### 4. 部署到 Vercel

#### 方式一：GitHub + Vercel（推荐）

1. **创建 GitHub 仓库**
   ```bash
   # 在项目目录执行
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wms-system.git
   git push -u origin main
   ```

2. **在 Vercel 部署**
   - 访问 [https://vercel.com](https://vercel.com)
   - 点击 "Add New Project"
   - 导入 GitHub 仓库
   - 配置环境变量（见下方）
   - 点击 Deploy

#### 方式二：命令行部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 5. 配置环境变量

在 Vercel Dashboard 中：
1. 进入项目
2. 点击 "Settings" → "Environment Variables"
3. 添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. 点击 "Save"
5. 重新部署项目

### 6. 验证部署

1. 访问 Vercel 提供的域名
2. 使用默认账号登录：
   - 用户名: `hwq`
   - 密码: `568394`
3. 测试各功能是否正常

## 数据迁移（从旧版）

如需迁移旧版 localStorage 数据：

1. 在旧版系统打开控制台 (F12)
2. 运行：
```javascript
const data = {
  users: JSON.parse(localStorage.getItem('wms_users') || '[]'),
  materials: JSON.parse(localStorage.getItem('wms_materials') || '[]'),
  inventory: JSON.parse(localStorage.getItem('wms_inventory') || '[]'),
  orders: JSON.parse(localStorage.getItem('wms_orders') || '[]'),
  warehouses: JSON.parse(localStorage.getItem('wms_warehouses') || '[]'),
  locations: JSON.parse(localStorage.getItem('wms_locations') || '[]'),
  suppliers: JSON.parse(localStorage.getItem('wms_suppliers') || '[]')
};
copy(JSON.stringify(data));
```

3. 在新版系统使用导入功能

## 自定义域名

1. 在 Vercel Dashboard → Domains
2. 添加你的域名
3. 按提示配置 DNS

## 费用

- **Supabase**: 免费版 500MB 数据库 + 2GB 存储
- **Vercel**: 免费版 100GB 带宽 + 无限制部署

适合中小型仓库使用。

## 技术支持

如有问题，请提交 Issue。
