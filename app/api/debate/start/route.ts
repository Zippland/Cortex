import { NextRequest, NextResponse } from 'next/server';
import { getModelById, chairModel, refereeModel } from '../../../models';
import { getAIResponse } from '../../../utils/openai';
import { DebateMessage, DebateSession } from '../../../models/types';
import { loadNotebooksFromFiles } from '../../../utils/notebook';
import { readNotebookFromFile, getNotebookMetadata } from '../../../utils/notebookStorage';

export async function POST(request: NextRequest) {
  try {
    const { topic, ai1Id, ai2Id } = await request.json();

    // 验证输入
    if (!topic || !ai1Id || !ai2Id) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取AI模型
    const ai1 = getModelById(ai1Id);
    const ai2 = getModelById(ai2Id);

    if (!ai1 || !ai2) {
      return NextResponse.json(
        { error: '无效的AI模型ID' },
        { status: 400 }
      );
    }

    // 获取笔记本状态
    const ai1NotebookMetadata = getNotebookMetadata(ai1, topic);
    const ai2NotebookMetadata = getNotebookMetadata(ai2, topic);
    const refereeNotebookMetadata = getNotebookMetadata(refereeModel, topic);
    
    // 创建增强的主席系统提示，包含笔记本状态信息
    const chairSystemPrompt = `${chairModel.systemPrompt}

辩论信息：
- 辩题: "${topic}"
- 第一位辩手: ${ai1.name}
- 第二位辩手: ${ai2.name}
- 辩论裁判: ${refereeModel.name}
${ai1NotebookMetadata.exists ? `- ${ai1.name}有已存在的笔记本，最后更新于${ai1NotebookMetadata.modified}` : ''}
${ai2NotebookMetadata.exists ? `- ${ai2.name}有已存在的笔记本，最后更新于${ai2NotebookMetadata.modified}` : ''}
${refereeNotebookMetadata.exists ? `- ${refereeModel.name}有已存在的笔记本，最后更新于${refereeNotebookMetadata.modified}` : ''}

你是辩论主席，请为辩论开场。`;

    // 创建主席的对话消息序列
    const chairMessages: DebateMessage[] = [
      // 系统提示
      {
        role: 'system',
        content: chairSystemPrompt
      },
      // 用户请求
      {
        role: 'user',
        content: `请你作为辩论主席，为以下辩题做开场白：${topic}。
第一位辩手是${ai1.name}，第二位辩手是${ai2.name}。
辩论由${refereeModel.name}负责评判。
请介绍辩题、辩手和裁判，然后宣布辩论开始。
${ai1NotebookMetadata.exists || ai2NotebookMetadata.exists || refereeNotebookMetadata.exists ? '请提及这是该辩题的继续讨论，辩手们已经有了前期的思考和准备。' : ''}
不要在回答开头重复"辩论主席："这样的前缀，直接开始你的开场白。`
      }
    ];

    // 获取主席的开场白
    const openingRemarks = await getAIResponse(chairMessages);

    // 创建辩论会话，初始化空笔记本
    const initialSession: DebateSession = {
      topic,
      currentRound: 0,
      messages: [
        {
          role: 'assistant',
          content: openingRemarks,
          name: chairModel.name
        }
      ],
      ai1,
      ai2,
      referee: refereeModel,
      isComplete: false,
      // 初始化空笔记本字段，稍后会从文件加载
      ai1Notebook: '',
      ai2Notebook: '',
      refereeNotebook: '',
      // 设置为1，表示已经考虑了主席开场白，但由于它是主席消息，不会计入笔记本更新触发条件
      lastNotebookUpdateCount: 1,
      userConfirmationNeeded: false
    };
    
    // 从文件加载笔记本内容
    const sessionWithNotebooks = loadNotebooksFromFiles(initialSession);

    return NextResponse.json({ session: sessionWithNotebooks });
  } catch (error) {
    console.error('开始辩论失败:', error);
    return NextResponse.json(
      { error: '开始辩论失败' },
      { status: 500 }
    );
  }
} 