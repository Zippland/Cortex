import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '../../../utils/openai';
import { DebateMessage, DebateSession } from '../../../models/types';
import { updateNotebooksIfNeeded, getMessagesWithNotebook } from '../../../utils/notebook';

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

    // 重置用户确认状态
    session.userConfirmationNeeded = false;

    // 确定当前发言的AI
    const currentRound = session.currentRound;
    const isFirstAITurn = session.messages.length % 2 === 1; // 主席开场后，第一个AI发言
    
    const currentAI = isFirstAITurn ? session.ai1 : session.ai2;
    const otherAI = isFirstAITurn ? session.ai2 : session.ai1;

    // 根据需要更新笔记本
    const sessionWithUpdatedNotebooks = await updateNotebooksIfNeeded(session);

    // 如果笔记本更新后设置了需要用户确认，则返回当前会话
    if (sessionWithUpdatedNotebooks.userConfirmationNeeded) {
      return NextResponse.json({ session: sessionWithUpdatedNotebooks });
    }

    // 使用笔记本获取消息历史
    const messagesWithNotebook = getMessagesWithNotebook(sessionWithUpdatedNotebooks, currentAI);

    // 添加最终提示消息
    let finalPrompt = "";
    
    if (session.messages.length > 1) {
      // 如果不是第一轮，提示AI回应对方的发言
      finalPrompt = `请你作为${currentAI.name}，针对辩题"${session.topic}"和上述对话内容，针对对方的漏洞有理有据地回击，始终在回应对方的话而不是另起新的话题。不要在回复开头重复你的角色名称，直接开始你的论述。`;
    } else {
      // 如果是第一轮，提示AI开始辩论
      finalPrompt = `请你作为${currentAI.name}，针对辩题"${session.topic}"开始辩论，阐述你的初始观点。不要在回复开头重复你的角色名称，直接开始你的论述。`;
    }
    
    // 将最终提示添加到消息列表
    const fullMessages: DebateMessage[] = [
      ...messagesWithNotebook,
      {
        role: 'user' as const,
        content: finalPrompt
      }
    ];

    // 获取AI回复
    const aiResponse = await getAIResponse(fullMessages);

    // 更新会话
    const newMessage: DebateMessage = {
      role: 'assistant',
      content: aiResponse,
      name: currentAI.name
    };
    
    const updatedMessages: DebateMessage[] = [...sessionWithUpdatedNotebooks.messages, newMessage];

    // 更新回合数
    let updatedRound = currentRound;
    if (!isFirstAITurn) {
      updatedRound += 1;
    }

    // 更新会话
    const updatedSession: DebateSession = {
      ...sessionWithUpdatedNotebooks,
      currentRound: updatedRound,
      messages: updatedMessages,
      isComplete: false // 辩论不再基于回合数自动结束
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