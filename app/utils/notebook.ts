import { DebateSession, DebateMessage, AIModel } from '../models/types';
import { getAIResponse } from './openai';
import { readNotebookFromFile, writeNotebookToFile, readKnowledgeFromFile } from './notebookStorage';

// 更新AI笔记本的最大消息数阈值
export const NOTEBOOK_UPDATE_THRESHOLD = 4;

/**
 * 生成用于更新笔记本的系统提示词
 * 强调记录AI的立场、偏好和独特视角
 */
function createNotebookUpdatePrompt(ai: AIModel, topic: string, currentNotebook: string): string {
  const preferencesText = ai.preferences ? ai.preferences.map(p => `- ${p}`).join('\n') : '无特定偏好';
  const stanceDescription = ai.stance ? 
    `进步性: ${ai.stance.progressive}/10 (${ai.stance.progressive > 7 ? '高度进步' : ai.stance.progressive > 4 ? '中立' : '较为保守'})\n分析性: ${ai.stance.analytical}/10 (${ai.stance.analytical > 7 ? '高度分析' : ai.stance.analytical > 4 ? '平衡' : '直觉导向'})\n情感性: ${ai.stance.emotional}/10 (${ai.stance.emotional > 7 ? '高度情感' : ai.stance.emotional > 4 ? '平衡' : '理性克制'})\n风险接受度: ${ai.stance.risktaking}/10 (${ai.stance.risktaking > 7 ? '勇于冒险' : ai.stance.risktaking > 4 ? '平衡' : '谨慎保守'})` 
    : '无立场信息';

  return `${ai.systemPrompt}

你正在参与关于"${topic}"的辩论。请基于你的角色和立场，分析并更新你的笔记本。

你作为${ai.name}的核心偏好:
${preferencesText}

你的立场特点:
${stanceDescription}

请遵循以下规则:
1. 明确表达你对辩题的基本立场和核心观点
2. 为了赢得这个辩论，记录你们已经达成的对你有利的共识们，以及这些共识成立的理由
3. 为了赢得这个辩论，记录没有达成的对你有利的共识（交锋点）们，记录对方不达成这些共识的的原因和理由
4. 记录辩论中需要立刻反驳的观点们，记录对方支撑这些观点的理由
5. 计划你的下一步行动：为了赢得这个辩论，需要从哪些方面去说服对方
6. 突出你作为${ai.name}独特的思考方式和关注点
7. 格式清晰，包括"我的立场"、"已达成的共识"、"未达成的共识（交锋点）"、"需要立刻反驳的观点"、"下一步计划"部分
8. 注意保持你的个性特点和价值观一致性

当前笔记本内容:
${currentNotebook || "（尚无内容）"}

基于以上内容和最近的对话，请创建一个更新后的笔记本。
重点突出你的立场、价值观和思考方式，这是你的私人笔记，可以自由表达你的真实观点。
只返回笔记本内容，不要有其他回复。`;
}

/**
 * 异步更新单个AI的笔记本，并保存到文件
 */
async function updateSingleNotebook(
  ai: AIModel, 
  topic: string, 
  recentMessages: DebateMessage[],
  retryCount: number = 2  // 添加重试次数参数
): Promise<string> {
  // 从文件读取当前笔记本内容，放在try外部以便catch块中可以访问
  const currentNotebook = readNotebookFromFile(ai, topic);
  
  try {
    // 创建消息列表，包含系统提示和最近的消息
    const messages: DebateMessage[] = [
      {
        role: 'system',
        content: createNotebookUpdatePrompt(ai, topic, currentNotebook)
      },
      {
        role: 'user',
        content: `请根据以下最近的辩论内容，更新你的笔记本。保持客观分析，突出关键点，并充分体现${ai.name}的视角和立场：

${recentMessages.map(msg => `${msg.name || msg.role}: ${msg.content}`).join('\n\n')}

请直接提供更新后的笔记本内容，不要有其他回复。记住，这是你的私人笔记，你可以自由表达你的真实立场和策略思考。`
      }
    ];

    // 获取AI的回复作为更新后的笔记本
    const updatedNotebook = await getAIResponse(messages);
    
    // 检查回复内容是否有效
    if (!updatedNotebook || updatedNotebook.includes('抱歉，AI回复生成失败')) {
      throw new Error('获取AI回复失败');
    }
    
    // 将更新后的笔记本内容写入文件
    writeNotebookToFile(ai, topic, updatedNotebook);
    
    return updatedNotebook;
  } catch (error) {
    console.error(`更新${ai.name}笔记本失败:`, error);
    
    // 如果还有重试次数，尝试重试
    if (retryCount > 0) {
      console.log(`尝试重新更新${ai.name}笔记本，剩余重试次数: ${retryCount}`);
      // 递减重试次数并再次尝试
      return await updateSingleNotebook(ai, topic, recentMessages, retryCount - 1);
    }
    
    // 没有重试次数或重试失败，返回当前笔记本内容
    return currentNotebook || `${ai.name}的笔记本更新失败。将在下次更新时重试。`;
  }
}

/**
 * 检查并更新辩论会话中的笔记本
 * 当消息数量达到阈值时更新笔记本并清理历史
 */
export async function updateNotebooksIfNeeded(session: DebateSession): Promise<DebateSession> {
  const messagesSinceLastUpdate = session.messages.length - (session.lastNotebookUpdateCount || 0);
  
  // 如果消息数量未达到阈值，直接返回原会话
  if (messagesSinceLastUpdate < NOTEBOOK_UPDATE_THRESHOLD) {
    return session;
  }

  // 获取需要处理的消息
  const messagesToProcess = session.messages.slice(
    session.lastNotebookUpdateCount || 0
  );

  // 独立更新两个AI的笔记本，避免一个失败影响另一个
  let updatedAi1Notebook = session.ai1Notebook || "";
  let updatedAi2Notebook = session.ai2Notebook || "";
  let updateSuccess = false;
  
  try {
    // 更新AI1的笔记本
    const ai1NotebookResult = await updateSingleNotebook(session.ai1, session.topic, messagesToProcess);
    updatedAi1Notebook = ai1NotebookResult;
    updateSuccess = true;
  } catch (error) {
    console.error(`最终更新AI1笔记本失败:`, error);
    // 保留原笔记本内容
  }
  
  try {
    // 更新AI2的笔记本
    const ai2NotebookResult = await updateSingleNotebook(session.ai2, session.topic, messagesToProcess);
    updatedAi2Notebook = ai2NotebookResult;
    updateSuccess = true;
  } catch (error) {
    console.error(`最终更新AI2笔记本失败:`, error);
    // 保留原笔记本内容
  }

  // 只有至少有一个笔记本更新成功，才更新lastNotebookUpdateCount
  const lastUpdateCount = updateSuccess ? session.messages.length : (session.lastNotebookUpdateCount || 0);

  // 更新会话对象，设置需要用户确认
  return {
    ...session,
    ai1Notebook: updatedAi1Notebook,
    ai2Notebook: updatedAi2Notebook,
    lastNotebookUpdateCount: lastUpdateCount,
    userConfirmationNeeded: updateSuccess // 只有在成功更新时才需要用户确认
  };
}

/**
 * 从文件加载AI笔记本内容
 */
export function loadNotebooksFromFiles(session: DebateSession): DebateSession {
  const ai1Notebook = readNotebookFromFile(session.ai1, session.topic);
  const ai2Notebook = readNotebookFromFile(session.ai2, session.topic);
  
  return {
    ...session,
    ai1Notebook,
    ai2Notebook
  };
}

/**
 * 获取用于发送给OpenAI的消息列表
 * 包含系统提示、笔记本内容、知识库内容和最近的消息
 */
export function getMessagesWithNotebook(
  session: DebateSession, 
  aiModel: AIModel
): DebateMessage[] {
  // 确定是哪个AI
  const isAi1 = aiModel.id === session.ai1.id;
  const notebook = isAi1 ? session.ai1Notebook : session.ai2Notebook;
  const opponent = isAi1 ? session.ai2.name : session.ai1.name;
  
  // 读取AI的知识库内容
  const knowledge = readKnowledgeFromFile(aiModel);
  
  // 生成简短的偏好和立场描述
  const preferencesText = aiModel.preferences ? 
    `你的核心偏好：\n${aiModel.preferences.slice(0, 3).map(p => `- ${p}`).join('\n')}` : '';
  
  const stanceDescription = aiModel.stance ? 
    `你的立场特点：进步性(${aiModel.stance.progressive}/10)，分析性(${aiModel.stance.analytical}/10)，情感性(${aiModel.stance.emotional}/10)，风险接受度(${aiModel.stance.risktaking}/10)` 
    : '';
  
  // 分隔符和标题样式
  const separator = "═".repeat(50);
  const sectionSeparator = "─".repeat(50);
  
  // 创建包含笔记本和知识库的系统提示，使用更好的格式区分
  const systemPromptWithNotebookAndKnowledge = `${separator}
📝 系统指令
${separator}

${aiModel.systemPrompt}

${sectionSeparator}
🎯 辩论信息
${sectionSeparator}

辩题: "${session.topic}"

你是 ${aiModel.name}，正在与 ${opponent} 进行辩论。
当前是第 ${session.currentRound} 轮。

${preferencesText ? `${preferencesText}\n` : ''}
${stanceDescription ? `${stanceDescription}\n` : ''}

${separator}
📔 你的笔记本（包含立场、思考和策略）
${separator}

${notebook || "（尚无内容）"}

${knowledge ? `${separator}
📚 你的知识库（参考资料和背景知识）
${separator}

${knowledge}` : ''}

${separator}
⚔️ 当前任务
${separator}

请基于以上信息和辩论历史，提供一个有理有据、立场一致的回应。
保持你的角色特点和价值观，坚定地表达你的立场，同时注意辩论策略和说服力。
注意使用笔记本中的策略和知识库中的信息来支持你的论点。`;

  // 获取自上次笔记本更新后的消息
  const recentMessages = session.messages.slice(
    session.lastNotebookUpdateCount || 0
  );

  // 返回完整的消息列表
  return [
    { role: 'system', content: systemPromptWithNotebookAndKnowledge },
    ...recentMessages
  ];
} 