import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse, RequestType } from '../../../utils/openai';
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

    // 先保存用户确认状态，以便确定是否是从确认界面点击"继续辩论"
    const wasAwaitingConfirmation = session.userConfirmationNeeded;

    // 重置用户确认状态
    session.userConfirmationNeeded = false;

    // 确定当前发言的AI
    const currentRound = session.currentRound;
    const isFirstAITurn = session.messages.length % 2 === 1; // 主席开场后，第一个AI发言
    
    const currentAI = isFirstAITurn ? session.ai1 : session.ai2;
    const otherAI = isFirstAITurn ? session.ai2 : session.ai1;

    // 只有在不是从确认界面点击"继续辩论"时，才尝试更新笔记本
    let sessionWithUpdatedNotebooks = session;
    if (!wasAwaitingConfirmation) {
      sessionWithUpdatedNotebooks = await updateNotebooksIfNeeded(session);
      
      // 如果笔记本更新后设置了需要用户确认，则返回当前会话
      if (sessionWithUpdatedNotebooks.userConfirmationNeeded) {
        return NextResponse.json({ session: sessionWithUpdatedNotebooks });
      }
    }

    // 使用笔记本获取消息历史
    const messagesWithNotebook = getMessagesWithNotebook(sessionWithUpdatedNotebooks, currentAI);

    // 添加最终提示消息
    let finalPrompt = "";
    
    if (session.messages.length > 1) {
      // 如果不是第一轮，提示AI回应对方的发言
      finalPrompt = `请你作为${currentAI.name}，针对辩题"${session.topic}"和上述对话内容，针对对方的漏洞有理有据地回击（包含具体翔实的证据、数据）。结构应当是：前一段回应对方的话，后一段打出自己的论点）。但是不管说什么，都要通过论据去论证出来，论据越详实可靠，说服力越大，不能直接瞎说。注意：已经达成共识的内容、已经提过的论据不要重复提，重点在于用新的论据和逻辑，说服对方和裁判去达成新的、对自己有利的共识。字数少一点，不要超过200字。`;
    } else {
      // 如果是第一轮，提示AI开始辩论
      finalPrompt = `请你作为${currentAI.name}，针对辩题"${session.topic}"开始辩论，这是你的立论环节，阐述你的初始观点（包含具体翔实的论证、论据）。字数少一点，不要超过200字。`;
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
    const aiResponse = await getAIResponse(fullMessages, RequestType.DEBATE);

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