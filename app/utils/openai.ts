import OpenAI from 'openai';
import { DebateMessage } from '../models/types';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 默认使用的模型
const MODEL = 'gpt-4o-mini';

/**
 * 确保消息格式符合OpenAI API要求
 */
function sanitizeMessages(messages: DebateMessage[]): any[] {
  return messages.map(message => {
    // 只保留role和content字段，去除name等其他字段
    return {
      role: message.role,
      content: message.content
    };
  });
}

/**
 * 调用OpenAI API获取AI回复
 */
export async function getAIResponse(
  messages: DebateMessage[],
  temperature: number = 0.7
): Promise<string> {
  try {
    // 打印完整的消息内容到控制台（包含name字段，便于调试）
    console.log('发送给OpenAI的消息内容:');
    console.log(JSON.stringify(messages, null, 2));
    
    // 清理消息，确保格式符合API要求
    const sanitizedMessages = sanitizeMessages(messages);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: sanitizedMessages,
      temperature,
    });

    return response.choices[0].message.content || '无法生成回复';
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    return '抱歉，AI回复生成失败。请稍后再试。';
  }
} 