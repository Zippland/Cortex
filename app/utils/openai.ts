import OpenAI from 'openai';
import { DebateMessage } from '../models/types';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 从环境变量中获取模型配置，如果未设置则使用默认值
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '4000', 10);
const DEFAULT_TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.7');

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
  temperature: number = DEFAULT_TEMPERATURE
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
      max_tokens: MAX_TOKENS,
    });

    return response.choices[0].message.content || '无法生成回复';
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    return '抱歉，AI回复生成失败。请稍后再试。';
  }
} 