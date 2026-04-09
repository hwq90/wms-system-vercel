# WMS 仓库管理系统 - Vercel + Supabase 版

## 技术栈
- **前端**: Next.js 14 + React 18 + Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth)
- **部署**: Vercel

## 功能特性
- ✅ 用户管理（超级管理员、管理员、操作员）
- ✅ 物料管理（条形码、分类、规格）
- ✅ 库存管理（多仓库、库位、批次）
- ✅ 订单管理（入库/出库、审核流程）
- ✅ 供应商管理
- ✅ 报表统计
- ✅ Excel 导入/导出
- ✅ 扫码功能（入库/出库/库位转移）
- ✅ 库存预警

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目名称和密码
5. 等待项目创建完成（约2分钟）

### 2. 配置数据库

1. 进入 Supabase Dashboard
2. 点击左侧 "SQL Editor"
3. 新建查询，粘贴 `supabase/migrations/001_initial_schema.sql` 内容
4. 点击 "Run" 执行

### 3. 获取 API 密钥

1. 点击左侧 "Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon/public**: `eyJ...` (以 eyJ 开头的长字符串)

### 4. 部署到 Vercel

#### 方式一：一键部署（推荐）

点击下方按钮：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

#### 方式二：命令行部署

```bash
# 安装依赖
npm install

# 配置环境变量
# 创建 .env.local 文件，填入：
NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase Anon Key

# 本地开发
npm run dev

# 部署到 Vercel
npm i -g vercel
vercel --prod
```

### 5. 配置环境变量

在 Vercel Dashboard 中：
1. 进入项目 Settings → Environment Variables
2. 添加以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase Anon Key

## 默认账号

- **超级管理员**: `hwq` / `568394`

## 项目结构

```
wms-vercel/
├── src/
│   ├── components/     # React 组件
│   ├── pages/          # Next.js 页面
│   ├── lib/            # 工具函数
│   └── styles/         # 样式文件
├── supabase/
│   └── migrations/     # 数据库迁移脚本
├── public/             # 静态资源
├── package.json
├── next.config.js
└── README.md
```

## 数据迁移

如需从旧版（localStorage）迁移数据：

1. 登录旧版系统
2. 打开浏览器控制台 (F12)
3. 运行以下代码导出数据：

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
console.log(JSON.stringify(data, null, 2));
```

4. 复制输出的 JSON
5. 在新版系统中使用导入功能

## 自定义域名

1. 在 Vercel Dashboard 中进入项目
2. Settings → Domains
3. 添加你的域名
4. 按提示配置 DNS 记录

## 技术支持

如有问题，请提交 Issue 或联系支持。

## License

MIT
