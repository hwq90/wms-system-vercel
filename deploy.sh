#!/bin/bash

# WMS 仓库管理系统一键部署脚本

echo "🚀 WMS 仓库管理系统部署脚本"
echo "========================================"

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "1. 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ 环境检查完成"

echo "2. 安装依赖..."
npm install

echo "3. 配置 Supabase..."
echo "请访问 https://supabase.com 创建项目"
echo "创建完成后，请配置以下环境变量："
echo ""
echo "在项目目录创建 .env.local 文件，填入："
echo "NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase Anon Key"
echo ""
echo "或者直接在 Vercel 中设置"

echo "4. 数据库迁移..."
echo "请进入 Supabase Dashboard → SQL Editor"
echo "执行 supabase/migrations/001_initial_schema.sql"

echo "5. 本地测试..."
echo "运行 npm run dev 测试系统"
echo "默认账号: hwq / 568394"

echo "6. 部署选项..."
echo "A. GitHub + Vercel (推荐)"
echo "   - 创建 GitHub 仓库"
echo "   - git push 代码"
echo "   - 在 Vercel 导入仓库"
echo ""
echo "B. 命令行部署"
echo "   - npm i -g vercel"
echo "   - vercel --prod"
echo ""
echo "C. Vercel 一键部署"
echo "   - 访问 https://vercel.com/new"
echo "   - 导入本项目"

echo ""
echo "🎉 部署指南完成！"
echo "详细步骤请查看 DEPLOY.md"
