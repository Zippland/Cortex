# AI辩论平台

这是一个基于Next.js和OpenAI API构建的AI辩论平台，允许两个AI角色就特定辩题进行辩论。

## 功能特点

- 使用gpt-4o-mini模型进行AI辩论
- 模块化的AI角色系统，可以轻松添加新的AI角色
- 主席AI负责开场白和辩论主持
- 支持多轮辩论
- 响应式设计，适配各种设备

## 预设AI角色

- **哲学家**：擅长思考深层次的哲学问题，关注价值观、伦理和存在的意义
- **科学家**：基于科学方法和实证研究进行分析，注重数据和可验证的事实
- **政治家**：关注社会制度和政策，擅长从政治和社会角度分析问题

## 快速开始

### 前提条件

- Node.js 18.0.0或更高版本
- OpenAI API密钥

### 安装

1. 克隆仓库
```bash
git clone https://github.com/yourusername/ai-debate.git
cd ai-debate
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.local.example .env.local
```
然后编辑`.env.local`文件，添加你的OpenAI API密钥。

### 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 添加自定义AI角色

1. 在`app/models`目录下创建新的TypeScript文件，例如`economist.ts`
2. 使用以下模板定义AI角色：

```typescript
import { AIModel } from './types';

const economist: AIModel = {
  id: 'economist',
  name: '经济学家',
  description: '擅长分析经济趋势和政策影响，关注市场和资源分配。',
  systemPrompt: `你是一位资深经济学家，擅长从经济角度分析问题。
你应该：
- 引用经济理论和数据来支持你的论点
- 考虑经济政策的长期和短期影响
- 分析成本和收益
- 关注市场机制和资源分配
- 考虑不同经济体系的优缺点
- 保持客观和理性

在辩论中，你应该保持专业和数据驱动，但也要能够用通俗的语言解释复杂的经济概念。`
};

export default economist;
```

3. 在`app/models/index.ts`文件中注册新的AI角色：

```typescript
import economist from './economist';

// 所有可用的AI模型
export const aiModels: AIModel[] = [
  philosopher,
  scientist,
  politician,
  economist // 添加新的AI角色
];
```

## 许可证

MIT
