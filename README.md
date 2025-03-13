# Cortex - 思辨
>让AI思辨碰撞，智慧共生

## 📖 项目概述

Cortex思辨是一个基于Next.js和大型语言模型构建的创新型应用，旨在模拟思想辩论场景。该平台允许两个预设的AI角色就特定辩题进行结构化、深度的辩论。系统设计了主席AI主持辩论过程，并为每个AI角色提供独特的"AI笔记本"功能，透明地记录其思考过程和辩论策略。这一设计不仅让用户能够观察AI如何构建论证，还能洞察AI在辩论中的思维演变过程。


## 🛠️ 技术架构

### 前端技术

- **框架**：Next.js 15.2.2，采用App Router架构
- **UI库**：React 19 + TailwindCSS 4.0 + Shadcn UI组件
- **开发语言**：TypeScript 5.5.0
- **状态管理**：React Hooks（useState, useEffect, useRef, useReducer）
- **动画效果**：Framer Motion
- **响应式设计**：支持桌面、平板和移动设备

### 后端技术

- **API框架**：Next.js API Routes
- **AI接口**：OpenAI API，默认使用gpt-4o-mini模型（可配置）
- **文件系统**：基于Node.js fs模块的笔记本持久化存储
- **缓存策略**：内存缓存 + 本地存储
- **错误处理**：全局错误边界 + 异步错误处理中间件

### 部署选项

- **开发环境**：本地Node.js服务器
- **生产环境**：Vercel平台（推荐）、Docker容器或任何支持Node.js的服务器

## ✨ 核心功能

### 1. 多角色AI辩论系统

- **丰富的角色库**：
  - **哲学家**：注重概念分析和原则探讨
  - **科学家**：强调实证研究和方法论
  - **政治家**：关注实践性和社会影响
  - **可自定义扩展更多角色类型**

- **精细的角色设计**：
  - 每个AI角色具有独特的系统提示词，确保回答风格一致
  - 通过偏好设置引导AI形成特定的思考模式
  - 立场设置确保AI在辩论中保持一致性

- **立场量化系统**：
  - **进步性**（0-10）：对新思想和变革的接受度
  - **分析性**（0-10）：逻辑推理vs直觉思考的偏好
  - **情感性**（0-10）：表达中情感因素的占比
  - **风险接受度**（0-10）：对不确定性的态度
  
  这些维度共同构成一个立体的AI人格，使辩论更加多样化和真实。

- **主席AI**：
  - 独立的中立角色，负责主持整个辩论
  - 提供开场白和辩题介绍
  - 在辩论过程中进行适当引导和总结
  - 确保辩论遵循结构化流程
  - 在辩论偏离主题时进行调整

### 2. AI笔记本系统

- **实时思考记录**：
  - AI在辩论过程中实时记录自己的思考过程
  - 记录对手论点的分析和评估
  - 规划未来的辩论策略和关键点

- **智能更新机制**：
  - 设置消息积累阈值，当新消息数量达到阈值时触发笔记本更新
  - 自动合并和组织新信息，避免重复
  - 结构化整理思考内容，形成连贯的笔记

- **文件持久化**：
  - 笔记本内容保存为本地Markdown文件
  - 文件命名格式：`[AI角色]-[辩题].md`
  - 支持中文和其他Unicode字符的文件名
  - 自动创建文件目录，确保文件系统完整性

- **知识库集成**：
  - 支持为每个AI角色配置专属知识库
  - 知识库内容会融入系统提示，增强AI的专业性
  - 知识库以Markdown格式存储，便于编辑和管理

### 3. 用户交互功能

- **辩论控制**：
  - **手动模式**：用户控制辩论节奏，手动推进下一步
  - **自动模式**：系统自动进行辩论，用户可随时暂停
  - **回合设置**：支持设置辩论的最大回合数
  - **进度显示**：清晰显示当前辩论进度和回合数

- **实时笔记本查看**：
  - 随时切换查看参与辩论的任一AI笔记本
  - 笔记本内容实时更新，反映AI最新思考
  - 支持笔记本内容的复制和导出

- **主题自定义**：
  - 用户可自由指定任何辩题
  - 系统智能分析辩题，自动为AI分配合适的立场
  - 支持保存和加载历史辩题

## 🚀 快速开始

### 系统要求

- **Node.js**: 18.0.0或更高版本
- **npm**: 9.0.0或更高版本
- **内存**: 至少4GB RAM（推荐8GB以上）
- **存储**: 至少100MB可用空间
- **OpenAI API密钥**：需支持gpt-4o-mini或其他GPT-4模型

### 详细安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/zippland/cortex.git
cd cortex
```

2. **安装依赖**
```bash
npm install
# 或使用yarn
yarn install
# 或使用pnpm
pnpm install
```

3. **配置环境变量**
```bash
cp .env.local.example .env.local
```
   
   编辑`.env.local`文件，至少需要设置以下变量：
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini  # 或其他支持的模型
   ```
   
   可选环境变量：
   ```
   MAX_TOKENS=4000  # 单次API请求的最大token数
   TEMPERATURE=0.7  # 模型温度设置
   ```

4. **创建必要的目录**
```bash
mkdir -p notebooks
mkdir -p knowledge
```

5. **启动开发服务器**
```bash
npm run dev
# 或使用yarn
yarn dev
# 或使用pnpm
pnpm dev
```

6. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🔧 扩展与自定义

### 添加新的AI角色

1. **创建角色定义文件**
   在`app/models`目录创建新的TypeScript文件（如`economist.ts`）:

```typescript
import { AIModel } from '../types';

const economist: AIModel = {
  id: 'economist',
  name: '经济学家',
  description: '专注于经济分析和市场规律，擅长从经济学视角分析社会问题',
  systemPrompt: `你是一位资深经济学家，擅长运用经济学理论和数据分析来探讨问题。
在辩论中，你应当:
- 关注激励机制和市场效率
- 使用经济学术语和概念
- 引用经济学理论和实证研究
- 考虑成本效益和长期经济影响
- 保持客观但不忽视社会公平`,
  preferences: [
    '经常引用经济学家的观点和经济学理论',
    '使用数据和统计信息支持观点',
    '分析问题的经济成本和效益',
    '从市场机制角度思考问题',
    '关注长期经济可持续性'
  ],
  stance: {
    progressiveness: 6,
    analytical: 8,
    emotional: 3,
    riskTolerance: 5
  },
  portraitUrl: '/portraits/economist.png'
};

export default economist;
```

2. **注册新角色**
   在`app/models/index.ts`中注册新角色:

```typescript
import philosopher from './philosopher';
import scientist from './scientist';
import politician from './politician';
import economist from './economist';

export const aiModels: AIModel[] = [
  philosopher,
  scientist,
  politician,
  economist // 添加新角色
];
```

### 自定义知识库

1. **创建知识库文件**
   在`knowledge`目录创建新的Markdown文件，文件名应与AI角色ID一致:

```
knowledge/economist.md
```

内容示例:
```markdown
# 经济学知识库

## 核心经济学理论
- 供需理论
- 博弈论
- 宏观经济政策
- 行为经济学

## 主要经济学流派
- 古典经济学
- 凯恩斯主义
- 新自由主义
- 制度经济学

## 重要经济现象解释
...
```

2. **知识库将自动加载**
   系统会在生成AI回复时自动读取并融入相应的知识库内容

## 🤝 贡献指南

欢迎为Cortex思辨项目做出贡献！以下是贡献流程：

1. Fork仓库并克隆到本地
2. 创建新的特性分支: `git checkout -b feature/amazing-feature`
3. 提交你的更改: `git commit -m 'Add some amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码风格指南

- 遵循TypeScript官方风格指南
- 使用ESLint和Prettier保持代码风格一致
- 组件使用函数式组件和React Hooks
- 所有公共函数和组件需要添加JSDoc注释

## 📄 许可证

MIT