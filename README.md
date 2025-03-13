# Cortex - 思辨

## 项目概述

Cortex思辨是一个基于Next.js和OpenAI API构建的创新型应用，允许两个预设的AI角色就特定辩题进行结构化辩论。平台设计了主席AI主持辩论，并为每个AI角色提供独特的"AI笔记本"功能，记录其思考过程和辩论策略。

## 技术架构

- **前端框架**：Next.js 15.2.2，采用App Router架构
- **UI库**：React 19 + TailwindCSS 4
- **语言**：TypeScript
- **AI接口**：OpenAI API，使用gpt-4o-mini模型
- **状态管理**：React Hooks（useState, useEffect, useRef）
- **部署**：可直接部署到Vercel平台

## 核心功能

### 1. 多角色AI辩论

- **角色系统**：预设包括哲学家、科学家、政治家三种截然不同的AI角色
- **角色个性化**：每个AI角色具有独特的系统提示词、偏好和立场倾向
- **立场量化**：通过进步性、分析性、情感性、风险接受度四个维度量化AI立场
- **主席AI**：独立的主席AI负责开场白和辩论主持，确保辩论进行有序

### 2. AI笔记本系统

- **自动笔记记录**：AI在辩论过程中自动记录思考、立场和策略
- **文件持久化**：笔记本内容保存到本地文件系统，确保内容持久化
- **智能更新**：当对话积累到阈值时，自动更新笔记本内容
- **思考透明化**：让用户看到AI如何思考和制定辩论策略

### 3. 交互功能

- **手动/自动模式**：支持手动推进辩论或全自动辩论模式
- **笔记本查看**：随时查看当前AI的笔记本内容
- **灵活主题**：用户可以自由指定任何辩题，系统自动分配角色开始辩论

## 系统架构

### 前端组件

- **DebateForm**：用户创建新辩论的表单组件
- **DebateViewer**：展示辩论内容、控制辩论进程、显示笔记本

### 后端API

- **/api/debate/start**：开始新辩论，获取主席开场白
- **/api/debate/continue**：继续辩论，获取下一个AI的回应
- **/api/models**：获取可用的AI模型信息

### 数据模型

- **AIModel**：AI角色的定义，包含ID、名称、描述、系统提示词、偏好和立场
- **DebateSession**：辩论会话，包含主题、回合数、消息历史、参与AI及笔记本状态
- **DebateMessage**：辩论消息，包含角色、内容和发言者名称

## 快速开始

### 前提条件

- Node.js 18.0.0或更高版本
- OpenAI API密钥（需支持gpt-4o-mini模型）

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/zippland/cortex.git
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.local.example .env.local
```
   编辑`.env.local`文件，添加你的OpenAI API密钥。

4. 启动开发服务器
```bash
npm run dev
```

5. 访问 [http://localhost:3000](http://localhost:3000) 开始使用应用

### 部署到Vercel

项目可直接通过GitHub仓库部署到Vercel平台：

1. 将代码推送到GitHub仓库
2. 在Vercel中创建新项目并连接仓库
3. 设置环境变量`OPENAI_API_KEY`
4. 部署项目

## 扩展与自定义

### 添加新的AI角色

1. 在`app/models`目录创建新的TypeScript文件（如`economist.ts`）
2. 使用AIModel接口定义角色属性
3. 在`app/models/index.ts`中注册新角色

```typescript
import economist from './economist';

export const aiModels: AIModel[] = [
  philosopher,
  scientist,
  politician,
  economist // 添加新角色
];
```

### 自定义AI立场参数

每个AI角色可以通过以下四个维度（0-10分）定义其立场特点：

- **进步性**：表示AI对新事物的接受程度，高分表示更进步
- **分析性**：表示AI的思考方式，高分表示更倾向于逻辑分析
- **情感性**：表示AI的表达方式，高分表示更情感化
- **风险接受度**：表示AI的决策偏好，高分表示更愿意接受风险

## 许可证

MIT