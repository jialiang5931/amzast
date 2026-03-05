# Technical Design Document - AMZAST

## 1. 技术栈选择 (Technology Stack)

### 前端 (Frontend)
- **Core Framework**: React 19 + TypeScript (构建现代、类型安全的 UI)
- **Build Tool**: Vite (极速开发服务器与构建)
- **Styling**: Tailwind CSS v3 (原子化 CSS) + `tailwind-merge` (类名合并)
- **UI Logic**: Custom Hooks for data processing
- **Visualization**: Recharts (基于 React 的 SVG 图表库，轻量且定制性强)
- **Animations**: `framer-motion` (首页动效) + Tailwind CSS Animate
- **Icons**: `lucide-react` (通用的 Icon 库)

### 数据处理 (Data Layer)
- **Excel Parser**: `xlsx` (SheetJS Community Edition) - 浏览器端直接解析二进制流。
- **State Management**: React `useState` / `useMemo` (由于应用规模较小，暂不需要 Redux/Zustand，利用内存直接管理解析后的 JSON 数据)。

### 后端 / 数据库 (Backend / Database)
- **Supabase Edge Functions (Edge Computing)**: 
  - 应用作为 API 代理，处理跨域 (CORS) 请求并安全调用 Apify Scraper。
  - 采用 Deno 环境，实现高性能的数据转发。
- **No Database Storage**: 实时数据抓取后直接注入前端 State，不进行持久化，确保隐私与响应速度。

## 2. 项目结构 (Project Structure)

```
c:/AMZAST/
├── src/
│   ├── assets/             # 静态资源
│   ├── components/         # UI 组件
│   │   ├── charts/         # 图表组件
│   │   │   ├── BrandBarChart.tsx       # 品牌垄断分析 (柱状图)
│   │   │   ├── BrandProductList.tsx    # 品牌详情列表 (下钻视图)
│   │   │   ├── MonthlySalesChart.tsx   # 月度销量趋势
│   │   │   └── PriceScatterChart.tsx   # 价格分布散点图
│   │   ├── layout/         # 布局组件 (Sidebar)
│   │   └── FileUpload.tsx  # 文件上传组件
│   ├── pages/              # 页面级组件
│   │   ├── Home.tsx            # 首页 (功能卡片)
│   │   ├── MarketAnalysis.tsx  # 市场分析核心页
│   │   └── toolbox/
│   │       └── MetaSpyRealtime.tsx  # MetaSpy 实时查询主页
│   ├── lib/                # 工具库
│   │   ├── data-parser.ts  # Excel 解析逻辑 (含父ASIN去重)
│   │   ├── types.ts        # TS 类型定义
│   │   └── utils.ts        # 通用辅助函数 (cn 等)
│   ├── App.tsx             # 主应用入口 (Tab Navigation & State)
│   ├── index.css           # 全局样式 & Tailwind 指令
│   └── main.tsx            # React 挂载点
├── public/                 # 公共资源
└── package.json            # 依赖管理
```

## 3. 数据模型 (Data Model)

### 3.1 原始数据 (Raw Data)
对应 Excel 的每一行，由 `RawAmazonRow` 接口定义，保留中文 Key 以对应 Excel 表头：
```typescript
interface RawAmazonRow {
  ASIN: string;
  '品牌': string;
  '价格': number;
  '近30天销量': number;
  // ... 动态列如 '2025-01': number
}
```

### 3.2 视图数据 (View Data - In Memory)
解析后的数据将根据图表需求转换为特定的数组格式：

#### A. Trend Data (for Monthly Chart)
```typescript
interface YearlyTrendData {
  year: string;
  data: {
    month: number;    // 1-12
    units: number | null; // 销量，若无数据则为 null
  }[];
}
```

#### B. Brand Data (for Bar Chart)
```typescript
interface BrandSharePoint {
  brand: string;
  units: number;
  percentage: number;
}
```

#### C. Scatter Data (for Price Distribution)
```typescript
interface ScatterDataPoint {
  price: number;
  units: number;
  brand: string;
  launchDate: string | number;
  url: string;
  asin: string;
  title?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  coupon?: string | number;
}
```

## 4. 关键技术点与挑战 (Key Technical Points)

### 4.1 动态列解析与父ASIN去重
- **挑战**：多变列名及变体数据导致的重复统计。
- **方案**：
  - 使用正则识别 `YYYY-MM` 列。
  - 在每个月份聚合时，使用 `Set` 记录已计入的 `父ASIN`，确保每个父体在当月只贡献一次销量数据。

### 4.2 路由与导航系统 (Mock Routing)
- **方案**：使用 `activeTab` 状态管理页面级组件的切换。
- **侧边栏**：实现 `isCollapsed` 状态控制宽度，配合 CSS Transition 实现丝滑动效。

### 4.3 大数据量渲染 (Large Dataset Rendering)
- **挑战**：如果 Excel 行数过多 (>5000行)，散点图渲染可能卡顿。
- **方案**：
  - Recharts 对散点图优化较好，一般 2k-3k 点无压力。
  - 如遇性能瓶颈，可考虑数据降采样 (Downsampling) 或 Canvas 绘图（暂不涉及）。

### 4.4 样式隔离与暗黑模式
- **方案**：使用 Tailwind 的 `dark` 类策略，配合 CSS 变量定义颜色系统（`bg-zinc-950` 等），确保玻璃拟态效果在不同背景下清晰可见。

### 4.5 实时查询表格的布局校准 (Layout Calibration)
- **挑战**：多列固定 (`sticky`) 在复杂布局下易出现对齐偏差，且半透明背景会导致“透字”。
- **方案**：
  - **硬编码偏移 (Hardcoded Offsets)**: 手动计算并应用累加的 `left-[px]` 值，确保在 Chrome/Safari 等不同内核下的稳定性。
  - **不透明斑马纹 (Opaque Striping)**: 弃用透明度方案，针对固定列 cells 使用实色背景 (`bg-white` / `bg-slate-50`)，解决图层叠加产生的视觉异常。
  - **动态行宽**: 核心字段（标题/摘要）使用 `min-w` + `line-clamp` 组合，防止自动列宽撑破固定布局。

## 5. API 接口
- **Supabase Edge Function (`metaspy`)**: 
  - **Method**: POST
  - **Body**: `{ adLibraryUrl: string, maxResults: number }`
  - **Auth**: 无需用户登录，通过前端内置匿名密钥调用。
