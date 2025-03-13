import { NextRequest, NextResponse } from 'next/server';
import { getModelById, chairModel } from '../../../models';
import { getAIResponse } from '../../../utils/openai';
import { DebateMessage, DebateSession } from '../../../models/types';

export async function POST(request: NextRequest) {
  try {
    const { topic, ai1Id, ai2Id, rounds } = await request.json();

    // 验证输入
    if (!topic || !ai1Id || !ai2Id || !rounds) {
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

    // 创建主席的增强系统提示
    const chairSystemPrompt = `${chairModel.systemPrompt}

辩论信息：
- 辩题: "${topic}"
- 第一位辩手: ${ai1.name}
- 第二位辩手: ${ai2.name}
- 总回合数: ${rounds}

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
辩论将进行${rounds}个回合。请介绍辩题和辩手，然后宣布辩论开始。
不要在回答开头重复"辩论主席："这样的前缀，直接开始你的开场白。`
      }
    ];

    // 获取主席的开场白
    const openingRemarks = await getAIResponse(chairMessages);

    // 创建辩论会话
    const debateSession: DebateSession = {
      topic,
      rounds: parseInt(rounds.toString()),
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
      isComplete: false
    };

    return NextResponse.json({ session: debateSession });
  } catch (error) {
    console.error('开始辩论失败:', error);
    return NextResponse.json(
      { error: '开始辩论失败' },
      { status: 500 }
    );
  }
} 