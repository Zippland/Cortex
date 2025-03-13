import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '../../../utils/openai';
import { DebateMessage, DebateSession } from '../../../models/types';

export async function POST(request: NextRequest) {
  try {
    const session: DebateSession = await request.json();

    // 验证会话
    if (!session || !session.topic || !session.ai1 || !session.ai2) {
      return NextResponse.json(
        { error: '无效的辩论会话' },
        { status: 400 }
      );
    }

    // 如果辩论已完成，返回当前会话
    if (session.isComplete) {
      return NextResponse.json({ session });
    }

    // 确定当前发言的AI
    const currentRound = session.currentRound;
    const isFirstAITurn = session.messages.length % 2 === 1; // 主席开场后，第一个AI发言
    
    const currentAI = isFirstAITurn ? session.ai1 : session.ai2;
    const otherAI = isFirstAITurn ? session.ai2 : session.ai1;

    // 为当前AI创建增强版系统提示
    const enhancedSystemPrompt = `${currentAI.systemPrompt}

辩论信息：
- 辩题: "${session.topic}"
- 你的角色: ${currentAI.name}
- 对方角色: ${otherAI.name}
- 当前回合: ${currentRound + 1}/${session.rounds}

请根据之前的对话历史，作为${currentAI.name}参与辩论。`;

    // 准备AI的系统消息
    const systemMessage: DebateMessage = {
      role: 'system',
      content: enhancedSystemPrompt
    };

    // 构建完整的对话历史，并根据发言者角色调整role
    const conversationHistory: DebateMessage[] = [];
    
    // 首先添加系统消息
    conversationHistory.push(systemMessage);
    
    // 然后添加所有历史消息，根据发言者正确设置角色
    for (const message of session.messages) {
      // 跳过系统消息
      if (message.role === 'system') continue;
      
      // 对于每条消息，判断是否是当前发言AI的消息
      const isCurrentAISpeaking = message.name === currentAI.name;
      const speakerName = message.name || '未知说话者';
      
      // 在消息内容前添加说话者名称，而不是使用name字段
      const contentWithSpeaker = `【${speakerName}】: ${message.content}`;
      
      // 添加到对话历史，根据说话者设置正确的角色
      conversationHistory.push({
        role: isCurrentAISpeaking ? 'assistant' : 'user',
        content: contentWithSpeaker
      });
    }

    // 添加最终提示消息
    let finalPrompt = "";
    
    if (session.messages.length > 1) {
      // 如果不是第一轮，提示AI回应对方的发言
      finalPrompt = `请你作为${currentAI.name}，针对辩题"${session.topic}"和上述对话内容，进行回应。不要在回复开头重复你的角色名称，直接开始你的论述。`;
    } else {
      // 如果是第一轮，提示AI开始辩论
      finalPrompt = `请你作为${currentAI.name}，针对辩题"${session.topic}"开始辩论，阐述你的初始观点。不要在回复开头重复你的角色名称，直接开始你的论述。`;
    }
    
    // 将最终提示添加到对话历史
    conversationHistory.push({
      role: 'user',
      content: finalPrompt
    });

    // 获取AI回复
    const aiResponse = await getAIResponse(conversationHistory);

    // 更新会话
    const newMessage: DebateMessage = {
      role: 'assistant',
      content: aiResponse,
      name: currentAI.name
    };
    
    const updatedMessages: DebateMessage[] = [...session.messages, newMessage];

    // 检查是否需要更新回合数
    let updatedRound = currentRound;
    let isComplete = false;

    if (!isFirstAITurn) {
      updatedRound += 1;
      
      // 检查辩论是否结束
      if (updatedRound >= session.rounds) {
        isComplete = true;
      }
    }

    // 更新会话
    const updatedSession: DebateSession = {
      ...session,
      currentRound: updatedRound,
      messages: updatedMessages,
      isComplete
    };

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('继续辩论失败:', error);
    return NextResponse.json(
      { error: '继续辩论失败' },
      { status: 500 }
    );
  }
} 