# AMZAST 云端化架构规划方案 (Cloud & Backend Roadmap)

## 1. 总体愿景 (Overall Vision)
将 AMZAST 从一个“纯本地 Excel 工具”升级为“云端 SaaS 平台”。实现用户账号管理、数据持久化存储、以及更强大的后台自动化分析能力。

---

## 2. 部署方案 (Deployment Strategy)

### 2.1 推荐方案：Vercel / Cloudflare Pages (Serverless)
*   **适用场景**：前期快速上线，低成本。
*   **优势**：
    *   **CI/CD**: Git Push 自动部署。
    *   **Edge Functions**: 极速的全球访问。
    *   **集成**: 完美支持 Next.js 或 Vite 静态部署。
*   **中国访问优化 (针对您的疑问)**：
    *   **现状**: Vercel 在中国境内无节点，默认 `.vercel.app` 域名访问可能较慢甚至被墙。
    *   **优化方案**:
        1.  **自定义域名**: 必须绑定自己的域名（如 `.com` 或 `.cn`），避免使用默认子域名。
        2.  **CNAME 优化**: 针对中国流量，可将 CNAME 指向 Vercel 专门为中国线路优化的地址 `cname-china.vercel-dns.com`。
        3.  **CDN 加速**: 前置一层阿里云/腾讯云 CDN 或 Cloudflare，能显著提升国内加载速度。

### 2.2 进阶方案：国内云服务商 (阿里云/腾讯云 OSS + CDN)
*   **适用场景**：追求极致的国内打开速度。
*   **方案**: 将 Vite 打包后的静态文件部署到国内 OSS 存储，配合国内 CDN，速度可达毫秒级。需准备 ICP 备案。

---

## 3. 后端架构 (Backend Architecture)

### 3.1 技术选型：Next.js (Full-stack) 或 Node.js + Express/NestJS
*   **理由**：
    *   **代码统一**：前后端均使用 TypeScript，共享类型定义。
    *   **SSR/ISR**: 优化页面加载速度和 SEO。
    *   **API Routes**: 直接在项目中编写后端逻辑。

### 3.2 备选方案：Python (FastAPI/Django)
*   **理由**：如果后续涉及大规模亚马逊数据爬取、AI 分析（复杂预测模型），Python 生态更具优势。

---

## 4. 数据库规划 (Database Schema)

### 4.1 选型：PostgresSQL (关系型数据库)
*   **ORM**: Prisma (与 TS 配合体验极佳)。
*   **存储内容**：
    *   **User**: 账号信息、订阅状态。
    *   **Projects**: 用户上传的记录元数据。
    *   **Market Snapshot**: 核心竞品历史数据（避免重复处理 Excel）。

### 4.2 存储介质
*   **阿里云 RDS / Supabase / PlanetScale**。

---

## 5. 核心挑战与应对 (Challenges)

### 5.1 数据隐私 (Data Privacy)
*   **方案**：保留“本地处理”选项。用户可以选择“仅本地预览”或“保存到云端”。
*   **加密**：对敏感字段（如利润、成本）进行服务端加密存储。

### 5.2 大文件上传优化
*   **方案**：使用 S3 直传技术 (Pre-signed URLs)，减轻后端流量压力。

---

## 6. 开发路径 (Roadmap)

1.  **阶段 1: 静态部署** - 使用 Vercel 部署当前版本，配置自定义域名。
2.  **阶段 2: 账户系统** - 接入 Clerk 或 Auth0，实现用户登录。
3.  **阶段 3: 数据上云** - 实现项目的保存、分享和导出历史记录。
4.  **阶段 4: 自动化同步** - (可选) 通过 API 自动获取亚马逊 API 数据。

---

## 7. 成本评估 (Cost Estimate)
*   **初期**: $0 (使用 Vercel/Supabase 免费额度)。
*   **成长期**: 约 $30-$100/月 (包含数据库托管与基础算力)。
