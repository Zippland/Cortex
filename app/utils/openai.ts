import OpenAI from 'openai';
import { DebateMessage } from '../models/types';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 从环境变量中获取模型配置，如果未设置则使用默认值
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// 为不同场景设置不同的 token 限制
const DEBATE_MAX_TOKENS = parseInt(process.env.DEBATE_MAX_TOKENS || '200', 10);
const NOTEBOOK_MAX_TOKENS = parseInt(process.env.NOTEBOOK_MAX_TOKENS || '4000', 10);
const DEFAULT_TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.7');

// 请求类型枚举
export enum RequestType {
  DEBATE = 'debate',   // 辩论对话
  NOTEBOOK = 'notebook' // 笔记本更新
}

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
 * @param messages 消息列表
 * @param requestType 请求类型，决定使用哪种token限制
 * @param temperature 温度值
 * @returns AI回复文本
 */
export async function getAIResponse(
  messages: DebateMessage[],
  requestType: RequestType = RequestType.DEBATE,
  temperature: number = DEFAULT_TEMPERATURE
): Promise<string> {
  try {
    // 根据请求类型选择合适的token限制
    const maxTokens = requestType === RequestType.NOTEBOOK ? NOTEBOOK_MAX_TOKENS : DEBATE_MAX_TOKENS;
    
    // 打印完整的消息内容到控制台（包含name字段，便于调试）
    console.log(`发送给OpenAI的消息内容 [类型: ${requestType}, maxTokens: ${maxTokens}]:`);
    console.log(JSON.stringify(messages, null, 2));
    
    // 清理消息，确保格式符合API要求
    const sanitizedMessages = sanitizeMessages(messages);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: sanitizedMessages,
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || '无法生成回复';
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    return '抱歉，AI回复生成失败。请稍后再试。';
  }
} 