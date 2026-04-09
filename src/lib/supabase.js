// Supabase Client Configuration
// 获取方式：
// 1. 访问 https://supabase.com 创建项目
// 2. 进入 Settings > API
// 3. 复制 Project URL 和 anon/public key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = {
  url: supabaseUrl,
  key: supabaseAnonKey,
  options: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
}

// 数据库表结构说明：
// 系统会自动创建以下表：
// - users (用户表)
// - materials (物料表)
// - inventory (库存表)
// - orders (订单表)
// - warehouses (仓库表)
// - locations (库位表)
// - suppliers (供应商表)
// - categories (分类表)
// - customers (客户表)