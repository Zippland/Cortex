import { AIModel } from '../models/types';
import { getAIResponse } from './openai';
import fs from 'fs';
import path from 'path';

// AI模型文件存储目录
const MODELS_DIR = path.join(process.cwd(), 'app', 'models');
// 知识库文件存储目录
const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

/**
 * 从自然语言描述生成AI模型
 * @param description 用户的自然语言描述
 * @returns 生成的AI模型对象和文件名
 */
export async function generateAIModel(description: string): Promise<{ model: AIModel, fileName: string }> {
  // 构建系统提示
  const systemPrompt = `你是一个AI模型生成专家，需要将用户的自然语言描述转换为格式化的AI模型定义。
请严格遵循以下要求：

1. 生成的模型必须符合以下TypeScript接口定义：
\`\`\`
export interface AIModel {
  id: string;         // 唯一标识符，小写字母+数字，不含空格和特殊字符
  name: string;       // 中文名称，简短明了
  description: string; // 简短描述，不超过50字
  systemPrompt: string; // 详细的系统提示，引导AI的行为和思考方式
  preferences: string[]; // 偏好数组，通常包含6个条目
  stance: {
    progressive: number; // 进步性 (1-10)
    analytical: number;  // 分析性 (1-10)
    emotional: number;   // 情感性 (1-10)
    risktaking: number;  // 风险接受度 (1-10)
  };
}
\`\`\`

2. 使用以下格式输出结果（不要包含其他内容）：
\`\`\`json
{
  "fileName": "生成的文件名（不含.ts后缀）",
  "model": {
    // AIModel对象的完整内容
  }
}
\`\`\`

根据用户描述创建一个独特、有深度的AI角色，确保：
- id应该是有意义的英文单词，全小写，不能包含下划线和特殊字符
- fileName应该和id一致，全小写英文字母或数字，不能包含下划线和特殊字符
- name应该是简短的中文名称
- systemPrompt要详细说明这个AI的思考方式、知识领域和表达风格
- preferences应该包含6个具体的偏好条目
- stance应该根据描述合理设置四个维度的分数
`;

  // 用户提示
  const userPrompt = `请根据以下描述生成一个AI模型：
${description}`;

  try {
    // 调用OpenAI API获取响应
    const response = await getAIResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // 解析JSON响应
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/{[\s\S]*}/) || 
                     null;
                     
    if (!jsonMatch) {
      throw new Error('无法解析生成的AI模型');
    }

    // 提取JSON字符串并解析
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsedData = JSON.parse(jsonStr);
    
    // 确保fileName不包含下划线和特殊字符
    if (parsedData.fileName.includes('_')) {
      parsedData.fileName = parsedData.fileName.replace(/_/g, '');
    }
    
    return {
      model: parsedData.model,
      fileName: parsedData.fileName
    };
  } catch (error) {
    console.error('生成AI模型失败:', error);
    throw new Error('生成AI模型失败');
  }
}

/**
 * 创建AI模型文件
 * @param fileName 文件名（不含.ts后缀）
 * @param model AI模型对象
 * @returns 成功创建的文件路径
 */
export function createAIModelFile(fileName: string, model: AIModel): string {
  try {
    // 确保文件名不包含特殊字符和下划线
    const safeFileName = fileName.replace(/[^a-z0-9]/g, '');
    const filePath = path.join(MODELS_DIR, `${safeFileName}.ts`);
    
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      throw new Error(`文件 ${safeFileName}.ts 已存在`);
    }
    
    // 确保model.id不包含下划线，与文件名保持一致
    if (model.id.includes('_')) {
      model.id = model.id.replace(/_/g, '');
    }
    
    // 构建文件内容
    const fileContent = `import { AIModel } from './types';

const ${safeFileName}: AIModel = {
  id: '${model.id}',
  name: '${model.name}',
  description: '${model.description}',
  systemPrompt: \`${model.systemPrompt}\`,
  // 偏好：${model.name}关注的核心点和价值观
  preferences: [
${model.preferences.map(p => `    '${p}'`).join(',\n')}
  ],
  // 立场特点：定义${model.name}的思考和行为方式
  stance: {
    progressive: ${model.stance.progressive},    // ${model.stance.progressive > 7 ? '较进步' : model.stance.progressive > 4 ? '中立' : '较保守'}
    analytical: ${model.stance.analytical},     // ${model.stance.analytical > 7 ? '高度分析性' : model.stance.analytical > 4 ? '平衡' : '直觉导向'}
    emotional: ${model.stance.emotional},      // ${model.stance.emotional > 7 ? '高度情感性' : model.stance.emotional > 4 ? '平衡' : '理性克制'}
    risktaking: ${model.stance.risktaking}      // ${model.stance.risktaking > 7 ? '勇于冒险' : model.stance.risktaking > 4 ? '平衡' : '谨慎保守'}
  }
};

export default ${safeFileName};`;

    // 写入文件
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    // 创建对应的知识库文件
    createKnowledgeFile(model.id);
    
    return filePath;
  } catch (error) {
    console.error('创建AI模型文件失败:', error);
    throw new Error('创建AI模型文件失败');
  }
}

/**
 * 创建AI模型的知识库文件
 * @param aiId AI模型的ID
 * @returns 成功创建的文件路径
 */
export function createKnowledgeFile(aiId: string): string {
  try {
    // 确保知识库目录存在
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
      console.log(`创建知识库目录: ${KNOWLEDGE_DIR}`);
    }
    
    const filePath = path.join(KNOWLEDGE_DIR, `${aiId}.md`);
    
    // 检查文件是否已存在，如果已存在则不覆盖
    if (!fs.existsSync(filePath)) {
      // 创建一个空的知识库文件，带有简单的说明
      const content = `# ${aiId} 的知识库

这是 ${aiId} 的知识库文件。
---

`;
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`创建知识库文件: ${filePath}`);
    }
    
    return filePath;
  } catch (error) {
    console.error('创建知识库文件失败:', error);
    // 这里不抛出错误，因为知识库文件创建失败不应该阻止整个AI模型的创建
    return '';
  }
}

/**
 * 更新index.ts文件以包含新的AI模型
 * @param fileName 新模型的文件名（不含.ts后缀）
 */
export function updateIndexFile(fileName: string): void {
  try {
    const indexPath = path.join(MODELS_DIR, 'index.ts');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 添加导入语句
    const importLine = `import ${fileName} from './${fileName}';\n`;
    const afterImports = indexContent.indexOf('// 所有可用的AI模型');
    
    if (afterImports === -1) {
      throw new Error('无法找到需要插入的位置');
    }
    
    // 在import部分的最后添加新的import
    let foundLastImport = false;
    const lines = indexContent.split('\n');
    let lastImportLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import') && lines[i].includes('from')) {
        lastImportLine = i;
      }
    }
    
    // 在最后一个import之后插入新的import
    lines.splice(lastImportLine + 1, 0, importLine.trim());
    
    // 找到aiModels数组并添加新模型
    let foundAiModels = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('export const aiModels') || lines[i].includes('aiModels:')) {
        foundAiModels = true;
      } else if (foundAiModels && lines[i].includes('];')) {
        // 在数组结束前添加新的模型
        const indent = lines[i].match(/^\s*/)?.[0] || '';
        lines[i] = `${indent}  ${fileName},\n${lines[i]}`;
        break;
      } else if (foundAiModels && lines[i].trim() !== '' && !lines[i].trim().startsWith('//')) {
        // 检查当前行是否是数组中的最后一个元素（在 ]; 之前的非空行）
        const currentLine = lines[i].trim();
        // 如果当前行不以逗号结尾，添加逗号
        if (!currentLine.endsWith(',')) {
          lines[i] = lines[i] + ',';
        }
      }
    }
    
    // 写回文件
    fs.writeFileSync(indexPath, lines.join('\n'), 'utf8');
  } catch (error) {
    console.error('更新索引文件失败:', error);
    throw new Error('更新索引文件失败');
  }
} 